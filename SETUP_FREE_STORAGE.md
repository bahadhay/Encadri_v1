# Setup Free File Storage

## Option 1: Cloudinary (Recommended - FREE)

### Free Tier:
- 25 GB storage
- 25 GB bandwidth/month
- No credit card required

### Setup (2 minutes):

1. Go to https://cloudinary.com/users/register_free
2. Sign up (use GitHub)
3. After login, go to **Dashboard**
4. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

5. In Railway, add environment variables:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Then I'll update the code to use Cloudinary instead of Azure.

---

## Option 2: Supabase Storage (FREE)

### Free Tier:
- 1 GB storage
- 2 GB bandwidth/month
- 50 MB max file size

### Setup (3 minutes):

1. Go to https://supabase.com
2. Create new project
3. Go to **Storage** → Create bucket: `encadri-documents`
4. Go to **Settings** → **API**
5. Copy:
   - Project URL
   - Project API Key (anon/public)

6. In Railway, add:
```
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=encadri-documents
```

Then I'll update code for Supabase.

---

## Option 3: Azure Blob Storage (Costs Money)

### Pricing:
- ~$0.02/GB/month
- Needs credit card

### Setup (if you have Azure credits):

1. Go to https://portal.azure.com
2. Create Storage Account
3. Create container: `encadri-documents`
4. Get connection string
5. In Railway, add:
```
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER_NAME=encadri-documents
```

---

## Recommendation:

**Use Cloudinary** - it's the easiest and most generous free tier.

Tell me which option you want and I'll update the code!
