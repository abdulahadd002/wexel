# Wexel Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended)

Railway offers easy deployment with built-in PostgreSQL.

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy Database**:
   - New Project → Add PostgreSQL
   - Copy the `DATABASE_URL` from Variables tab

3. **Deploy Backend**:
   - New Project → Deploy from GitHub repo
   - Select the `server` folder as root directory
   - Add environment variables:
     ```
     DATABASE_URL=<from step 2>
     JWT_SECRET=<generate a long random string>
     OPENAI_API_KEY=<your OpenAI key>
     CLIENT_URL=<your frontend URL>
     ```
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`

4. **Deploy Frontend**:
   - Use Vercel: [vercel.com](https://vercel.com)
   - Import GitHub repo, select `client` folder
   - Add environment variable:
     ```
     VITE_API_URL=<your Railway backend URL>/api
     ```

---

### Option 2: Render.com

1. **Database**: Create PostgreSQL → Copy Internal Database URL

2. **Backend** (Web Service):
   - Root Directory: `server`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm start`
   - Environment Variables: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, CLIENT_URL

3. **Frontend** (Static Site):
   - Root Directory: `client`
   - Build: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variable: VITE_API_URL

---

### Option 3: Docker on VPS

1. **Get a VPS** (DigitalOcean, Linode, AWS EC2, etc.)

2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

3. **Clone and Configure**:
   ```bash
   git clone https://github.com/yourusername/wexel.git
   cd wexel
   cp .env.production.example .env
   # Edit .env with your values
   nano .env
   ```

4. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

5. **Setup SSL** (optional but recommended):
   - Use Cloudflare (free SSL)
   - Or install Certbot for Let's Encrypt

---

### Option 4: Vercel + Supabase (Serverless)

1. **Database**: Create free PostgreSQL on [supabase.com](https://supabase.com)

2. **Backend**: Deploy to Vercel as serverless functions (requires code restructuring)

3. **Frontend**: Deploy to Vercel

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret key for JWT tokens | random-64-char-string |
| OPENAI_API_KEY | OpenAI API key for OCR | sk-... |
| CLIENT_URL | Frontend URL (for CORS) | https://wexel.example.com |
| VITE_API_URL | Backend API URL (frontend) | https://api.wexel.example.com/api |

## Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] CORS configured for frontend domain
- [ ] SSL/HTTPS enabled
- [ ] Test user registration/login
- [ ] Test bill upload and OCR
- [ ] Test Excel export
