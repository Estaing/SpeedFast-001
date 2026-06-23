# SpeedFast — Free Cloud Deployment Guide

This guide deploys the full stack for **$0/month** using:

| Service | Provider | What it hosts |
|---|---|---|
| PostgreSQL (permanent free) | **Neon** | Database |
| Redis | **Render Key Value** | Sessions + cache |
| Backend API + Worker | **Render** | Node.js / Fastify |
| Frontend | **Vercel** | React SPA |

Total time: ~20 minutes. No credit card required.

---

## Step 1 — Free PostgreSQL on Neon (permanent, no expiry)

1. Go to **https://neon.tech** → **Sign up free** (GitHub login works)
2. Click **New Project** → name it `speedfast` → pick the region closest to you → **Create project**
3. In the project dashboard, copy the **Connection string** — it looks like:
   ```
   postgresql://speedfast_owner:XXXX@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this** — you'll need it in Step 3.

---

## Step 2 — Deploy Backend + Redis on Render

### 2a. Create a Render account
Go to **https://render.com** → **Get Started for Free** → sign in with GitHub. No credit card needed.

### 2b. Deploy via Blueprint (one click)
1. In Render dashboard → **New** → **Blueprint**
2. Connect your GitHub account → select the **SpeedFast-001** repo
3. Render reads `render.yaml` automatically and shows 3 services:
   - `speedfast-api` (Web Service)
   - `speedfast-worker` (Background Worker)
   - `speedfast-redis` (Key Value)
4. Click **Apply** → Render creates all 3 services

### 2c. Generate JWT secrets
Run this in your terminal (or use any random hex generator):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# run twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET
```

### 2d. Set environment variables on Render
For **both** `speedfast-api` AND `speedfast-worker` services, go to:
**Service → Environment → Add Environment Variable**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string from Step 1 |
| `REDIS_URL` | Copy from Render → speedfast-redis → **Connect** tab |
| `JWT_SECRET` | Your first generated hex string |
| `JWT_REFRESH_SECRET` | Your second generated hex string |

### 2e. Get your API URL
After deploy finishes (2–3 min), go to **speedfast-api → Settings**.
Your API URL will be something like:
```
https://speedfast-api.onrender.com
```
**Save this** — you need it for Step 3.

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Update vercel.json with your real API URL
Edit `frontend/vercel.json` and replace the placeholder:
```json
"destination": "https://speedfast-api.onrender.com/api/$1"
```
with your actual Render URL from Step 2e. Commit and push:
```bash
git add frontend/vercel.json
git commit -m "chore: set Render API URL in Vercel proxy"
git push
```

### 3b. Deploy to Vercel
1. Go to **https://vercel.com** → **Sign up** with GitHub (free)
2. Click **Add New Project** → Import **SpeedFast-001** repo
3. Set **Root Directory** to `frontend`
4. Framework: **Vite** (auto-detected)
5. Click **Deploy** — done in ~60 seconds

### 3c. Get your frontend URL
Vercel gives you a URL like:
```
https://speedfast-001.vercel.app
```

### 3d. Add CORS back-reference on Render
Go to **Render → speedfast-api → Environment** and add:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://speedfast-001.vercel.app` |

Render will auto-redeploy with the new variable.

---

## Step 4 — Verify it's working

```bash
# 1. Check API health
curl https://speedfast-api.onrender.com/health/ready
# Expected: {"status":"ready"}

# 2. Register a test user
curl -s -X POST https://speedfast-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@speedfast.vn","password":"Test123!"}' | jq

# 3. Login and grab token
TOKEN=$(curl -s -X POST https://speedfast-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@speedfast.vn","password":"Test123!"}' | jq -r .accessToken)

# 4. Create a vehicle
curl -s -X POST https://speedfast-api.onrender.com/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vin":"VF8X12345678ABCDE","model":"VF8","batteryCapacity":87.7}' | jq

# 5. Open the frontend
open https://speedfast-001.vercel.app
```

---

## Free Tier Limits to Know

| Limit | Impact | Workaround |
|---|---|---|
| Render free service **sleeps after 15 min idle** | First request takes ~30s to wake up | Acceptable for testing; upgrade to $7/mo Starter to keep it awake |
| Render free = **750 compute hours/month** | ~31 days × 24h — enough if only one service runs continuously | Worker + API together use ~2× hours; monitor in Render dashboard |
| Neon free = **0.5 GB storage, 191 compute hours/month** | Plenty for testing | Scales to paid automatically if exceeded |
| Render Key Value free = **25 MB RAM** | Fine for JWT sessions + small caches | More than enough for testing |
| Vercel free = **100 GB bandwidth/month** | Extremely generous | Never an issue for personal/demo projects |

---

## CI/CD — Automatic Deploys

Both Render and Vercel are already connected to GitHub:
- Every push to `main` → **Render auto-redeploys** the API + worker
- Every push to `main` → **Vercel auto-redeploys** the frontend
- Pull requests → Vercel creates **preview URLs** automatically

Your CI pipeline (`.github/workflows/ci.yml`) runs tests on every push before any deploy happens.

---

## API Documentation

Once deployed, the interactive Swagger UI is available at:
```
https://speedfast-api.onrender.com/docs
```

---

## Observability (Optional)

The app ships with OpenTelemetry. To enable tracing in production:
1. Sign up at **https://www.honeycomb.io** (free tier: 20M events/month)
2. Get your OTLP endpoint and API key
3. Add to Render environment:
   ```
   OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
   OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=YOUR_API_KEY
   ```

---

## Troubleshooting

**API returns 503 / health check fails**
- Check Render logs: Service → Logs
- Most common cause: `DATABASE_URL` or `REDIS_URL` env var missing or wrong

**Frontend shows "Network Error" on login**
- Verify `vercel.json` has the correct Render URL in the rewrite destination
- Check browser DevTools → Network tab for the actual failing request URL

**First request is very slow (~30s)**
- Normal for free Render tier (cold start after idle). The second request is instant.

**Prisma migration error on deploy**
- The start command runs `prisma migrate deploy` automatically
- If it fails, check Render logs for the exact migration error
