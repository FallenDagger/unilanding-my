# UniLanding MY

Your Stress-Free Soft Landing in Malaysia — a landing page + student dashboard for international students arriving at KLIA.

## Quick Start (Local Hosting)

### Option 1: Python (Recommended)
```bash
# Windows
start.bat

# Or manually:
python -m http.server 8080
```
Then open: http://localhost:8080

### Option 2: Node.js
```bash
npm install
npm start
```
Then open: http://localhost:8080

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## File Structure

```
├── index.html              # Landing page
├── dashboard.html          # Student dashboard
├── css/
│   ├── styles.css          # Core styles
│   ├── themes.css          # 4 themes (light/dark/nature/nightsky)
│   ├── motion.css          # Immersive scroll animations
│   ├── chat.css            # AI chat widget
│   └── dashboard.css       # Dashboard styles
├── js/
│   ├── main.js             # Core interactions
│   ├── theme.js            # Theme switcher
│   ├── motion.js           # Scroll motion engine
│   ├── chat.js             # AI assistant (vector DB + OmniRoute)
│   └── dashboard.js        # Dashboard logic
├── data/
│   └── knowledge.json      # AI knowledge base (vector DB)
├── .htaccess               # Apache security headers
├── nginx-security.conf     # Nginx security headers
├── start.bat               # Windows local server
├── package.json            # Node.js scripts
└── README.md               # This file
```

## Features

- **Landing Page**: Hero, services, pricing (3 tiers), FAQ, track ride, booking wizard
- **Student Dashboard**: Overview, bookings, ride tracking, eSIM/checklist, invoices, profile
- **4 Themes**: Light, Dark, Nature (falling flowers), Night Sky (shooting stars)
- **AI Assistant**: Vector database (TF-IDF) + OmniRoute API integration
- **Immersive Scroll**: Parallax, text reveal, staggered animations, scroll progress
- **Security**: XSS prevention, CSP, safe JSON parsing, input sanitization, security headers

## AI Assistant Setup (Optional)

For AI-powered responses, install and run OmniRoute:

```bash
npm install -g omniroute
omniroute
```

Dashboard opens at http://localhost:20128. The chat widget will automatically connect.

Without OmniRoute, the assistant falls back to local knowledge base search.

## Deployment

### Free Hosting (Recommended)
- **Cloudflare Pages**: Connect GitHub repo, auto-deploy
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop folder

### Custom Domain
- `.my` domains: ~RM 30-50/year (MYNIC, Exabytes)
- `.com` domains: ~$10-15/year

## Security

- Content Security Policy (CSP) meta tags
- XSS prevention via HTML escaping + input sanitization
- Safe JSON parsing for localStorage
- File upload validation (type + size)
- Security headers for Apache (.htaccess) and Nginx
- No inline scripts or eval()