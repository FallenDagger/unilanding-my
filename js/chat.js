/* ============================================================
   UniLanding MY — AI Chat Assistant
   Uses TF-IDF vector search (local vector DB) + OmniRoute API
============================================================ */

(function () {
  "use strict";

  const OMNIROUTE_DEFAULT = "http://localhost:20128";
  const KNOWLEDGE_URL = "data/knowledge.json";

  let knowledgeBase = [];
  let idf = {};
  let docVectors = {};
  let chatHistory = [];

  // ---------- Config ----------
  function safeJsonParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  function isValidEndpoint(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      // Allow localhost, 127.0.0.1, and HTTPS endpoints
      if (parsed.protocol === "https:") return true;
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function getConfig() {
    try {
      const ep = localStorage.getItem("chat_endpoint") || OMNIROUTE_DEFAULT;
      const model = localStorage.getItem("chat_model") || "auto";
      return {
        endpoint: isValidEndpoint(ep) ? ep : OMNIROUTE_DEFAULT,
        model: (model && model.length < 50) ? model : "auto",
      };
    } catch (e) {
      return { endpoint: OMNIROUTE_DEFAULT, model: "auto" };
    }
  }

  function saveConfig(endpoint, model) {
    try {
      if (isValidEndpoint(endpoint)) {
        localStorage.setItem("chat_endpoint", endpoint);
      }
      if (model && model.length < 50) {
        localStorage.setItem("chat_model", model);
      }
    } catch (e) {}
  }

  // ---------- Stop words ----------
  const STOP_WORDS = new Set([
    "a","an","the","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","can","shall",
    "i","you","he","she","it","we","they","me","him","her","us","them","my","your",
    "his","its","our","their","this","that","these","those","what","which","who",
    "whom","how","when","where","why","and","but","or","nor","not","so","yet",
    "at","by","for","in","of","on","to","up","as","if","than","into","through",
    "during","before","after","above","below","between","out","off","over","under",
    "again","further","then","once","here","there","all","each","few","more","most",
    "other","some","such","no","only","own","same","too","very","just","about",
  ]);

  // ---------- Tokenize ----------
  function tokenize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
      .map((w) => {
        // Simple plural normalization only
        if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
        return w;
      });
  }

  // ---------- TF-IDF Vector Search ----------
  function computeIDF(docs) {
    const N = docs.length;
    const df = {};
    docs.forEach((doc) => {
      const tokens = new Set(tokenize(doc.text));
      tokens.forEach((t) => {
        df[t] = (df[t] || 0) + 1;
      });
    });
    const idfMap = {};
    Object.keys(df).forEach((term) => {
      idfMap[term] = Math.log((N + 1) / (df[term] + 1)) + 1;
    });
    return idfMap;
  }

  function computeTF(tokens) {
    const tf = {};
    const total = tokens.length || 1;
    tokens.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });
    Object.keys(tf).forEach((t) => {
      tf[t] = tf[t] / total;
    });
    return tf;
  }

  function vectorize(text, idfMap) {
    const tokens = tokenize(text);
    const tf = computeTF(tokens);
    const vec = {};
    Object.keys(tf).forEach((term) => {
      if (idfMap[term]) {
        vec[term] = tf[term] * idfMap[term];
      }
    });
    return vec;
  }

  function cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    allTerms.forEach((term) => {
      const a = vecA[term] || 0;
      const b = vecB[term] || 0;
      dot += a * b;
      magA += a * a;
      magB += b * b;
    });
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // Category keywords for boosting
  const CATEGORY_HINTS = {
    pricing: ["price", "cost", "how much", "rm", "package", "tier", "fee", "pay"],
    services: ["service", "mpv", "transfer", "esim", "survival", "kit", "vetting", "room", "luggage"],
    booking: ["book", "booking", "step", "flight", "arrival", "airport", "klia"],
    payment: ["payment", "pay", "fpx", "card", "wallet", "visa", "mastercard"],
    account: ["login", "sign up", "account", "register", "password", "google"],
    dashboard: ["dashboard", "track", "invoice", "receipt", "checklist"],
    faq: ["faq", "guarantee", "luggage", "question"],
    about: ["about", "university", "unitar", "contact", "who"],
  };

  function detectCategory(query) {
    const q = query.toLowerCase();
    let bestCat = null;
    let bestScore = 0;
    Object.keys(CATEGORY_HINTS).forEach((cat) => {
      let score = 0;
      CATEGORY_HINTS[cat].forEach((hint) => {
        if (q.includes(hint)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestCat = cat;
      }
    });
    return bestCat;
  }

  // Intent detection: map query to most likely knowledge categories
  const INTENT_MAP = [
    { keywords: ["package", "pricing", "price", "cost", "how much", "rm", "tier", "fee"], categories: ["Pricing"] },
    { keywords: ["esim", "sim", "data", "mobile", "internet", "connectivity", "phone"], categories: ["Services", "FAQ"] },
    { keywords: ["survival", "kit", "bedding", "toiletries", "water", "meal", "voucher"], categories: ["Services", "FAQ"] },
    { keywords: ["book", "booking", "reserve", "schedule"], categories: ["Booking", "Services"] },
    { keywords: ["payment", "pay", "fpx", "card", "wallet", "visa", "mastercard", "banking"], categories: ["Payment"] },
    { keywords: ["dashboard", "track", "invoice", "receipt", "checklist"], categories: ["Dashboard", "Tracking"] },
    { keywords: ["flight", "arrival", "airport", "klia", "driver", "mpv", "transfer", "luggage"], categories: ["Services", "Tracking", "FAQ"] },
    { keywords: ["account", "login", "sign up", "register", "password", "profile"], categories: ["Account"] },
    { keywords: ["university", "unitar", "about", "who", "contact", "support"], categories: ["About", "Contact", "FAQ"] },
    { keywords: ["vetting", "room", "housing", "inspection"], categories: ["Services"] },
  ];

  function detectIntent(query) {
    const q = query.toLowerCase();
    const matched = [];
    INTENT_MAP.forEach((intent) => {
      intent.keywords.forEach((kw) => {
        if (q.includes(kw)) {
          intent.categories.forEach((cat) => {
            if (!matched.includes(cat)) matched.push(cat);
          });
        }
      });
    });
    return matched;
  }

  function searchKnowledge(query, topK = 3) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return knowledgeBase.slice(0, 1).map((doc) => ({ doc, score: 1 }));
    }
    const intents = detectIntent(query);
    const queryLower = query.toLowerCase();

    const scored = knowledgeBase.map((doc) => {
      const docLower = doc.text.toLowerCase();
      const docTokens = tokenize(doc.text);
      const docTokenSet = new Set(docTokens);

      // 1. Word overlap (how many query words appear in doc)
      let overlap = 0;
      queryTokens.forEach((t) => {
        if (docTokenSet.has(t) || docLower.includes(t)) overlap++;
      });
      const overlapScore = queryTokens.length > 0 ? overlap / queryTokens.length : 0;

      // 2. Intent/category match (strong signal)
      let intentBoost = 0;
      if (intents.includes(doc.category)) {
        intentBoost = 5;
      }

      // 3. Key term exact match boost
      let keyBoost = 0;
      const keyTerms = ["esim", "mpv", "survival", "vetting", "booking", "package", "price", "rm", "payment", "dashboard", "track", "flight", "luggage", "university", "omniroute", "landing"];
      keyTerms.forEach((kt) => {
        if (queryLower.includes(kt) && docLower.includes(kt)) keyBoost += 2;
      });

      // 4. TF-IDF cosine similarity
      const queryVec = vectorize(query, idf);
      const docVec = docVectors[doc.id] || {};
      const cosSim = cosineSimilarity(queryVec, docVec);

      // 5. Exact phrase boost
      let phraseBoost = 0;
      if (docLower.includes(queryLower)) phraseBoost += 5;

      // Combined score
      const score = (overlapScore * 4) + (cosSim * 2) + intentBoost + keyBoost + phraseBoost;

      return { doc, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK).filter((s) => s.score > 0.5);
    if (top.length === 0 && scored.length > 0) {
      return [scored[0]];
    }
    return top;
  }

  // ---------- Load knowledge base ----------
  async function loadKnowledge() {
    try {
      const resp = await fetch(KNOWLEDGE_URL);
      if (!resp.ok) throw new Error("Failed to load knowledge base");
      knowledgeBase = await resp.json();
      idf = computeIDF(knowledgeBase);
      knowledgeBase.forEach((doc) => {
        docVectors[doc.id] = vectorize(doc.text, idf);
      });
      setStatus("connected", "Knowledge base loaded");
    } catch (e) {
      console.error("Knowledge base error:", e);
      setStatus("error", "Knowledge base unavailable");
    }
  }

  // ---------- OmniRoute API ----------
  async function callOmniRoute(messages) {
    const config = getConfig();
    const endpoint = config.endpoint.replace(/\/+$/, "") + "/v1/chat/completions";
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model || "auto",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OmniRoute error ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const data = await resp.json();
    // Validate response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid API response");
    }
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const msg = data.choices[0].message;
      if (msg && typeof msg.content === "string") {
        // Sanitize: limit length
        return msg.content.slice(0, 2000);
      }
    }
    throw new Error("Unexpected API response format");
  }

  // ---------- Chat UI ----------
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatus(type, text) {
    const statusEl = document.querySelector(".chat-status");
    if (!statusEl) return;
    statusEl.className = "chat-status " + type;
    const label = statusEl.querySelector(".status-label");
    if (label) label.textContent = text;
  }

  function addMessage(role, text, sources) {
    const messagesEl = document.getElementById("chat-messages");
    if (!messagesEl) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg " + role;
    if (role === "bot") {
      let html = escapeHtml(text).replace(/\n/g, "<br>");
      if (sources && sources.length > 0) {
        html += '<div class="msg-sources">Sources: ';
        sources.forEach((s) => {
          html += `<span>${escapeHtml(s)}</span>`;
        });
        html += "</div>";
      }
      msgDiv.innerHTML = html;
    } else {
      msgDiv.textContent = text;
    }
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const messagesEl = document.getElementById("chat-messages");
    if (!messagesEl) return;
    const typing = document.createElement("div");
    typing.className = "chat-msg typing";
    typing.id = "chat-typing";
    typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById("chat-typing");
    if (typing) typing.remove();
  }

  async function sendMessage() {
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");
    if (!input || !sendBtn) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    sendBtn.disabled = true;
    addMessage("user", text);

    // Vector search
    const results = searchKnowledge(text);
    const sources = results.map((r) => r.doc.category);
    const context = results.map((r) => r.doc.text).join("\n\n");

    const systemPrompt =
      "You are UniLanding MY's helpful AI assistant. Answer questions about UniLanding MY services, pricing, booking, eSIM, survival kits, dashboard, and more. " +
      "Use the following context to answer accurately. If the question is not covered by the context, say you don't know and suggest contacting support. " +
      "Be concise and friendly. Context:\n\n" + (context || "No relevant context found.");

    chatHistory.push({ role: "user", content: text });

    showTyping();
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-6),
      ];
      const reply = await callOmniRoute(messages);
      hideTyping();
      addMessage("bot", reply, [...new Set(sources)]);
      chatHistory.push({ role: "assistant", content: reply });
      setStatus("connected", "Online");
    } catch (e) {
      hideTyping();
      // Fallback: provide a helpful message
      let fallback = "I couldn't reach the AI service. ";
      if (results.length > 0) {
        fallback += "Based on our knowledge base: " + results[0].doc.text;
      } else {
        fallback += "Please make sure OmniRoute is running (npm install -g omniroute && omniroute) on localhost:20128, or try again later.";
      }
      addMessage("bot", fallback, [...new Set(sources)]);
      setStatus("error", "Offline - using local KB");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ---------- Init ----------
  function init() {
    const toggle = document.getElementById("chat-toggle");
    const panel = document.getElementById("chat-panel");
    const closeBtn = document.getElementById("chat-close");
    const sendBtn = document.getElementById("chat-send");
    const input = document.getElementById("chat-input");

    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      panel.classList.toggle("open");
      if (panel.classList.contains("open")) {
        input.focus();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => panel.classList.remove("open"));
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Settings
    const settingsToggle = document.getElementById("chat-settings-toggle");
    const settingsPanel = document.getElementById("chat-settings-panel");
    if (settingsToggle && settingsPanel) {
      settingsToggle.addEventListener("click", () => {
        settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
      });
    }

    const endpointInput = document.getElementById("chat-endpoint-input");
    const modelInput = document.getElementById("chat-model-input");
    const saveSettings = document.getElementById("chat-save-settings");
    if (endpointInput) endpointInput.value = getConfig().endpoint;
    if (modelInput) modelInput.value = getConfig().model;

    if (saveSettings) {
      saveSettings.addEventListener("click", () => {
        const ep = endpointInput ? endpointInput.value.trim() : OMNIROUTE_DEFAULT;
        const md = modelInput ? modelInput.value.trim() : "auto";
        saveConfig(ep, md);
        showToast("Settings saved");
        // Test connection
        testConnection();
      });
    }

    // Welcome message
    addMessage(
      "bot",
      "Hi! I'm UniLanding MY's AI assistant. Ask me anything about our services, pricing, booking, eSIM, or arrival checklist. I use a vector database to find relevant info and OmniRoute for AI responses."
    );

    loadKnowledge();
  }

  async function testConnection() {
    const config = getConfig();
    try {
      const resp = await fetch(config.endpoint.replace(/\/+$/, "") + "/v1/models");
      if (resp.ok) {
        setStatus("connected", "OmniRoute connected");
      } else {
        setStatus("error", "OmniRoute not reachable");
      }
    } catch (e) {
      setStatus("error", "OmniRoute offline");
    }
  }

  function showToast(msg) {
    // Reuse dashboard toast if available, else console
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2000);
    }
  }

  // ---------- Inject chat widget HTML ----------
  function injectWidget() {
    const widget = document.createElement("div");
    widget.className = "chat-widget";
    widget.innerHTML = `
      <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">AI</div>
            <div class="chat-header-text">
              <h4>UniLanding Assistant</h4>
              <span class="chat-status">
                <span class="dot"></span>
                <span class="status-label">Loading...</span>
              </span>
            </div>
          </div>
          <button class="chat-close" id="chat-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input" placeholder="Ask about services, pricing, booking..." />
          <button class="chat-send" id="chat-send" aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div class="chat-settings">
          <details>
            <summary id="chat-settings-toggle">⚙️ OmniRoute Settings</summary>
            <div id="chat-settings-panel" style="display:none">
              <div class="settings-row">
                <label>API Endpoint</label>
                <input type="text" id="chat-endpoint-input" placeholder="http://localhost:20128" />
              </div>
              <div class="settings-row">
                <label>Model (auto for OmniRoute routing)</label>
                <input type="text" id="chat-model-input" placeholder="auto" />
              </div>
              <div class="settings-row">
                <button class="btn btn-primary" id="chat-save-settings" style="padding:6px 14px;font-size:0.8rem">Save & Test</button>
              </div>
            </div>
          </details>
        </div>
      </div>
      <button class="chat-toggle" id="chat-toggle" aria-label="Open AI assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="chat-badge"></span>
      </button>
    `;
    document.body.appendChild(widget);
  }

  // ---------- Bootstrap ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectWidget();
      init();
    });
  } else {
    injectWidget();
    init();
  }
})();
