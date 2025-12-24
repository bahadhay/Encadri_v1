# 🚀 Deploy Encadri - Start Here

## Total Time: 5 Minutes
## Cost: $0

---

## Step 1: Deploy Backend to Railway (2 minutes)

### 1. Go to Railway
https://railway.app

Click **"Login with GitHub"**

### 2. Create New Project

1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select **"bahadhay/encadri-V1"**
4. Railway starts deploying (detects .NET automatically)

### 3. Add PostgreSQL Database

1. In your project dashboard, click **"+ New"**
2. Select **"Database"**
3. Click **"Add PostgreSQL"**
4. Done! Database auto-connects to your backend

### 4. Configure Backend Service

1. Click on your **backend service** (encadri-V1)
2. Go to **"Settings"** tab
3. Find **"Root Directory"**
4. Enter: `Encadri-Backend/Encadri-Backend`
5. Click **"Redeploy"** at the top

### 5. Get Your Backend URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Copy the URL (looks like: `encadri-backend-production.up.railway.app`)

### 6. **IMPORTANT: Update Frontend Config**

Open your project locally and update this file:

**File:** `Encadri-Frontend/src/environments/environment.prod.ts`

Replace the URLs with YOUR Railway domain:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-RAILWAY-DOMAIN.up.railway.app/api',
  hubUrl: 'https://YOUR-RAILWAY-DOMAIN.up.railway.app/hubs'
};
```

Save and commit:
```bash
git add Encadri-Frontend/src/environments/environment.prod.ts
git commit -m "Update production API URL"
git push origin main
```

**✅ Backend deployed!**

---

## Step 2: Deploy Frontend to Vercel (2 minutes)

### 1. Go to Vercel
https://vercel.com

Click **"Sign Up"** → Choose **"Continue with GitHub"**

### 2. Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find **"bahadhay/encadri-V1"** in the list
3. Click **"Import"**

### 3. Configure Build Settings

```
Framework Preset: Angular
Root Directory: Encadri-Frontend
Build Command: npm run build -- --configuration production
Output Directory: dist/encadri-frontend/browser
Install Command: npm install
```

### 4. Deploy

Click **"Deploy"**

Wait 2-3 minutes for build to complete.

**✅ Frontend deployed!**

---

## Step 3: Test Your App (1 minute)

### Test Backend

Visit: `https://YOUR-RAILWAY-URL.up.railway.app/swagger`

You should see Swagger API documentation.

### Test Frontend

Vercel gives you a URL like: `https://encadri-v1.vercel.app`

Open it in your browser.

**✅ App is live!**

---

## What You Get (FREE)

- ✅ Backend running 24/7 (no sleep)
- ✅ PostgreSQL database (free)
- ✅ Frontend with global CDN
- ✅ Auto-deploy on git push
- ✅ HTTPS/SSL included
- ✅ Real-time logs

---

## Update Your App Later

Just push to GitHub:

```bash
git add .
git commit -m "Update"
git push origin main
```

Railway and Vercel auto-deploy automatically!

---

## Troubleshooting

### Backend not starting on Railway

1. Check **"Deployments"** tab → View logs
2. Verify Root Directory: `Encadri-Backend/Encadri-Backend`
3. Ensure PostgreSQL is added and linked

### Frontend build failed on Vercel

1. Check build logs in Vercel dashboard
2. Verify Root Directory: `Encadri-Frontend`
3. Verify Output: `dist/encadri-frontend/browser`

### CORS errors

Update your Railway backend URL in `environment.prod.ts` and redeploy.

### Database connection error

Railway auto-injects `DATABASE_URL`. Check:
1. PostgreSQL is added in Railway
2. It's in the same project
3. Check backend logs for connection errors

---

## Need Help?

- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Check logs in both dashboards

---

## Your URLs

**Backend (Railway):** https://YOUR-RAILWAY-URL.up.railway.app
**Frontend (Vercel):** https://YOUR-VERCEL-URL.vercel.app
**Swagger API:** https://YOUR-RAILWAY-URL.up.railway.app/swagger

---

**That's it! Your app is live! 🎉**
