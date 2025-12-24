# Encadri Deployment Guide

This guide explains how to deploy Encadri to Vercel (Frontend) and Railway (Backend).

## Prerequisites

- GitHub account with the repository at: https://github.com/bahadhay/Encadri_v1
- Railway account: https://railway.app
- Vercel account: https://vercel.com
- Azure Storage account (for file uploads)
- PostgreSQL database (provided by Railway)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create New Project in Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `bahadhay/Encadri_v1`
5. Railway will detect the .NET application

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will automatically create and link the database
4. The `DATABASE_URL` environment variable will be auto-configured

### Step 3: Configure Environment Variables

Go to your backend service → **Variables** tab and add:

```bash
# Database (Auto-configured by Railway when you add PostgreSQL)
DATABASE_URL=<automatically set by Railway>

# Azure Storage (REQUIRED for file uploads)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=encadristorage;AccountKey=YOUR_REAL_AZURE_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=encadri-documents

# Optional: ASP.NET Environment
ASPNETCORE_ENVIRONMENT=Production
```

**Replace `YOUR_REAL_AZURE_KEY`** with your actual Azure Storage account key from your local `appsettings.json` file.

### Step 4: Configure Build Settings

1. Go to **Settings** → **Build**
2. Set **Root Directory**: `Encadri-Backend/Encadri-Backend`
3. Railway will automatically detect the .NET 8 application

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Once deployed, Railway will provide a public URL like: `https://your-app.up.railway.app`
4. Copy this URL - you'll need it for the frontend

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project to Vercel

1. Go to https://vercel.com
2. Click **"Add New" → "Project"**
3. Import your GitHub repository: `bahadhay/Encadri_v1`
4. Vercel will detect the Angular application

### Step 2: Configure Build Settings

Set the following in Vercel:

- **Framework Preset**: Angular
- **Root Directory**: `Encadri-Frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/encadri-frontend/browser`
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Go to **Settings** → **Environment Variables** and add:

```bash
# Backend API URL (use your Railway backend URL)
API_URL=https://your-app.up.railway.app
```

**Replace `https://your-app.up.railway.app`** with your actual Railway backend URL from Part 1.

### Step 4: Update Angular Environment Configuration

Before deploying, you may need to update your Angular app to read from environment variables.

Check `Encadri-Frontend/src/app/core/services/api.service.ts` - it should use the Railway backend URL.

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your application
3. You'll get a URL like: `https://your-app.vercel.app`

---

## Part 3: Update CORS Settings

After deployment, update the backend CORS settings to allow your Vercel frontend:

In `Encadri-Backend/Encadri-Backend/Program.cs`, you may want to restrict CORS to your specific Vercel domain:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:4200",  // Local development
                    "https://your-app.vercel.app"  // Production Vercel URL
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});
```

---

## Required Environment Variables Summary

### Railway (Backend)

| Variable | Source | Example |
|----------|--------|---------|
| `DATABASE_URL` | Auto-configured by Railway PostgreSQL | `postgresql://user:pass@host:port/db` |
| `AZURE_STORAGE_CONNECTION_STRING` | Your Azure Portal | `DefaultEndpointsProtocol=https;AccountName=...` |
| `AZURE_STORAGE_CONTAINER_NAME` | Your choice | `encadri-documents` |

### Vercel (Frontend)

| Variable | Source | Example |
|----------|--------|---------|
| `API_URL` | Your Railway backend URL | `https://your-app.up.railway.app` |

---

## Getting Your Azure Storage Connection String

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to your Storage Account: `encadristorage`
3. Go to **Security + networking** → **Access keys**
4. Copy **Connection string** from key1 or key2
5. Use this in the `AZURE_STORAGE_CONNECTION_STRING` environment variable

---

## Testing Your Deployment

1. Open your Vercel frontend URL: `https://your-app.vercel.app`
2. Try to register/login
3. Test creating a project
4. Test uploading a document
5. Check Railway logs if something doesn't work:
   - Go to Railway project → Backend service → **Deployments** → Click latest deployment → **View Logs**

---

## Troubleshooting

### Backend Issues

- **Database connection failed**: Check that PostgreSQL is added and DATABASE_URL is set
- **File uploads not working**: Verify AZURE_STORAGE_CONNECTION_STRING is correct
- **CORS errors**: Update CORS policy in Program.cs to include your Vercel URL

### Frontend Issues

- **API calls failing**: Check that API_URL environment variable matches your Railway backend URL
- **404 errors**: Ensure Output Directory is set to `dist/encadri-frontend/browser`
- **Build fails**: Check Node.js version compatibility (Angular 18 requires Node 18+)

### Logs

- **Railway**: Project → Service → Deployments → View Logs
- **Vercel**: Project → Deployments → Click deployment → View Function Logs

---

## Local Development (Keeping Your Secrets)

For local development, create `appsettings.Development.json` (this file is gitignored):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=encadri;Username=postgres;Password=YourLocalPassword"
  },
  "AzureStorage": {
    "ConnectionString": "YOUR_REAL_AZURE_CONNECTION_STRING",
    "ContainerName": "encadri-documents"
  }
}
```

This file stays on your local machine and is never pushed to GitHub!

---

## Security Best Practices

✅ **DO**:
- Use environment variables for secrets in Railway and Vercel
- Keep `appsettings.Development.json` in your local machine only
- Use placeholder values in `appsettings.json` (already done)
- Rotate your Azure keys periodically

❌ **DON'T**:
- Commit real credentials to GitHub
- Share your Azure Storage keys publicly
- Use the same passwords for development and production
