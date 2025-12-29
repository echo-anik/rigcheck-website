# Vercel Environment Variables Setup Guide

## Quick Answer
For Vercel deployment, you need to add environment variables in the **Vercel Dashboard**, NOT through .env files.

## Step-by-Step Guide

### 1. **Local Development (.env.local)**
Create a `.env.local` file locally (for your machine only):
```bash
cp .env.example .env.local
```

Then fill in your local values:
```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-test-secret
```

### 2. **Vercel Dashboard Setup**

1. Go to https://vercel.com/dashboard
2. Select your project: **rigcheck-website**
3. Click **Settings** → **Environment Variables**
4. Add these variables for **Production**:

```
NEXT_PUBLIC_API_BASE_URL = https://your-api-domain.com/api/v1
NEXT_PUBLIC_APP_URL = https://rigcheck-website.vercel.app
NEXT_PUBLIC_SITE_URL = https://rigcheck-website.vercel.app
NEXTAUTH_URL = https://rigcheck-website.vercel.app
NEXTAUTH_SECRET = (generate a random secure string)
NEXT_PUBLIC_SITE_NAME = RigCheck PC Builder
NEXT_PUBLIC_SUPPORT_EMAIL = support@yourdomain.com
NEXT_PUBLIC_CONTACT_EMAIL = contact@yourdomain.com
NEXT_PUBLIC_DEFAULT_CURRENCY = BDT
NEXT_PUBLIC_DEFAULT_LOCALE = en-BD
NODE_ENV = production
NEXT_TELEMETRY_DISABLED = 1
```

### 3. **Environment Variable Types**

**NEXT_PUBLIC_*** variables:
- Visible in browser (exposed to client)
- Use for: API URLs, app URLs, site names, emails
- Examples: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`

**Secret variables** (no NEXT_PUBLIC_ prefix):
- Only available on server
- Use for: sensitive tokens, secrets
- Examples: `NEXTAUTH_SECRET`

### 4. **Which File is Correct?**

| File | Purpose | Git? | Use |
|------|---------|------|-----|
| `.env.example` | Template | ✅ YES | Reference for all variables |
| `.env.local` | Local development | ❌ NO | Your machine only, never commit |
| `.env.production` | Optional local prod build | ❌ NO | Testing production build locally |
| Vercel Dashboard | Production deployment | N/A | Production values |

### 5. **Deployment Flow**

```
Local Dev:
.env.local (your values) → npm run dev → http://localhost:3000

Production (Vercel):
Vercel Dashboard variables → vercel deploy → https://rigcheck-website.vercel.app
```

### 6. **IMPORTANT: .gitignore**

Ensure `.env.local` is in `.gitignore` (it should be):
```
.env.local
.env.*.local
```

Never commit real env variables to Git!

### 7. **Getting NEXTAUTH_SECRET**

Generate a secure random string:
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online generator (less secure)
https://generate-secret.vercel.app/32
```

## TL;DR

1. ✅ Create `.env.local` locally with `http://localhost:...` values
2. ✅ Add variables to **Vercel Dashboard** with production URLs
3. ✅ Never commit `.env.local` to Git
4. ✅ Use `NEXT_PUBLIC_` prefix only for client-visible variables
