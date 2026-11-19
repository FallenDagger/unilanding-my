# UniLanding MY — Deployment Guide

## Quick Deploy (Free Hosting)

### Option 1: Cloudflare Pages (Recommended — Free, Unlimited Bandwidth)

1. **Create a free account** at https://dash.cloudflare.com/sign-up
2. **Create a GitHub repo** (free at https://github.com/new)
3. **Push your site**:
   ```bash
   git init
   git add .
   git commit -m "UniLanding MY v1"
   git remote add origin https://github.com/YOUR_USERNAME/unilanding-my.git
   git push -u origin main
   ```
4. **Connect to Cloudflare Pages**:
   - Go to https://dash.cloudflare.com → Pages → Create a project
   - Connect your GitHub repo
   - Build settings: Framework preset = None, Build command = (leave empty), Output directory = `/`
   - Click "Save and Deploy"
5. Your site is live at `https://unilanding-my.pages.dev`

### Option 2: Vercel (Free, Auto-Deploy from GitHub)

1. **Create a free account** at https://vercel.com/signup
2. **Import your GitHub repo** at https://vercel.com/new
3. **Deploy settings**: Framework = Other, Build Command = (empty), Output Directory = `.`
4. Your site is live at `https://unilanding-my.vercel.app`

### Option 3: Netlify (Free, Drag & Drop)

1. **Create a free account** at https://app.netlify.com/signup
2. **Drag and drop** your project folder onto the Netlify dashboard
3. Your site is live instantly at `https://random-name.netlify.app`
4. **Optional**: Connect GitHub for auto-deploy

### Option 4: GitHub Pages (Free, No Account Needed Beyond GitHub)

1. **Create a GitHub repo** at https://github.com/new
2. **Push your site**:
   ```bash
   git init
   git add .
   git commit -m "UniLanding MY v1"
   git remote add origin https://github.com/YOUR_USERNAME/unilanding-my.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, Folder: / (root)
   - Click Save
4. Your site is live at `https://YOUR_USERNAME.github.io/unilanding-my/`

### Option 5: Surge.sh (Free, Command Line)

1. **Install surge**:
   ```bash
   npm install -g surge
   ```
2. **Login**:
   ```bash
   surge login
   ```
3. **Deploy**:
   ```bash
   surge . unilanding-my.surge.sh
   ```
4. Your site is live at `https://unilanding-my.surge.sh`

---

## Custom Domain (When Ready)

### Malaysian Domain Registrars
| Registrar | .my Domain | Price |
|-----------|-----------|-------|
| [MYNIC](https://www.mynic.my) | Official registry | ~RM 30-50/yr |
| [Exabytes](https://www.exabytes.my) | .my, .com.my | ~RM 30-80/yr |
| [Shinjiru](https://www.shinjiru.com.my) | .my domains | ~RM 40-90/yr |

### International Registrars
| Registrar | .com Domain | Price |
|-----------|------------|-------|
| [Cloudflare](https://www.cloudflare.com/products/registrar/) | At-cost pricing | ~$9-10/yr |
| [Namecheap](https://www.namecheap.com) | .com | ~$10-15/yr |
| [Porkbun](https://porkbun.com) | .com | ~$10/yr |

### Connect Custom Domain to Hosting
After deploying to Cloudflare Pages/Vercel/Netlify:
1. Go to your hosting dashboard → Custom Domains
2. Add your domain (e.g., `unilanding.my`)
3. Update DNS records at your registrar:
   - **Cloudflare Pages**: CNAME → `unilanding-my.pages.dev`
   - **Vercel**: CNAME → `cname.vercel-dns.com`
   - **Netlify**: CNAME → `your-site.netlify.app`

---

## Post-Deployment Checklist

- [ ] Verify all pages load (index.html, dashboard.html)
- [ ] Test theme switching (4 themes)
- [ ] Test AI chat widget (vector DB search)
- [ ] Test booking flow end-to-end
- [ ] Test responsive design on mobile
- [ ] Verify CSP headers (check browser console)
- [ ] Add custom domain (optional)
- [ ] Enable HTTPS (automatic on all providers)
- [ ] Add favicon.ico (optional, to remove 404)
- [ ] Configure analytics (optional)

## Environment Variables (for OmniRoute AI)

If using OmniRoute for AI responses, users need to run it locally:
```bash
npm install -g omniroute
omniroute
# Dashboard: http://localhost:20128
```

The chat widget connects to `http://localhost:20128` by default. Users can change this in the chat settings panel.