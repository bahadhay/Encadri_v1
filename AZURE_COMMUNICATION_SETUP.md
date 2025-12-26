# Azure Communication Services Setup Guide

This guide will help you set up Azure Communication Services (ACS) for video calling functionality in Encadri.

## Prerequisites

- An Azure account (create one at https://azure.microsoft.com/free/)
- Access to Azure Portal

## Step 1: Create Azure Communication Services Resource

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Communication Services"**
4. Click **"Create"**

### Configuration:
- **Subscription**: Select your Azure subscription
- **Resource Group**: Create new or select existing (e.g., `encadri-resources`)
- **Resource Name**: Choose a unique name (e.g., `encadri-communication`)
- **Data Location**: Choose the region closest to your users
- **Tags**: (Optional) Add tags for organization

5. Click **"Review + Create"**
6. Click **"Create"**

Wait for the deployment to complete (usually takes 1-2 minutes).

## Step 2: Get Connection String

1. Once deployed, click **"Go to resource"**
2. In the left menu, click **"Keys"** under Settings
3. You'll see two connection strings: **Primary** and **Secondary**
4. Copy the **Primary connection string**

The connection string format looks like:
```
endpoint=https://encadri-communication.communication.azure.com/;accesskey=AbCdEf123456...
```

## Step 3: Configure in Railway (Backend)

### Option A: Using Railway Dashboard
1. Go to your Railway project
2. Click on your backend service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add:
   - **Variable Name**: `AZURE_COMMUNICATION_CONNECTION_STRING`
   - **Value**: Paste your connection string from Step 2
6. Click **"Add"**
7. Railway will automatically redeploy your backend

### Option B: Using Railway CLI
```bash
railway variables set AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..."
```

## Step 4: Verify Setup

Once Railway redeploys your backend:

1. Check the logs to confirm ACS is initialized:
   ```bash
   railway logs
   ```

   You should see:
   ```
   Azure Communication Services initialized successfully.
   ```

2. Test the video call endpoint:
   ```bash
   curl https://your-backend.railway.app/api/videocall/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "service": "Azure Communication Services",
     "message": "Video calling service is operational"
   }
   ```

## Step 5: Test Video Calling

1. Log in to your Encadri application
2. Navigate to a meeting
3. Click **"Join Video Call"**
4. You should now be able to join video calls successfully!

## Pricing Information

Azure Communication Services has a free tier:
- **Free**: First 1000 minutes per month
- **Paid**: $0.004 per participant per minute after free tier

For most educational use cases, the free tier should be sufficient.

## Troubleshooting

### "Azure Communication Services is not configured" Error
- Verify the connection string is set in Railway environment variables
- Check that the variable name is exactly: `AZURE_COMMUNICATION_CONNECTION_STRING`
- Redeploy the backend after adding the variable

### "Failed to create ACS user" Error
- Verify your Azure subscription is active
- Check that the ACS resource hasn't been deleted
- Ensure your connection string is valid and not expired

### Base-64 Errors
- This usually means the connection string is invalid or contains placeholder text
- Double-check you copied the entire connection string from Azure Portal
- Ensure there are no extra spaces or line breaks in the connection string

## Security Best Practices

1. **Never commit connection strings to Git**
   - Use environment variables only
   - Keep appsettings.json with placeholder values

2. **Rotate keys regularly**
   - Use the Secondary key while rotating the Primary
   - Update Railway environment variable when rotating

3. **Monitor usage**
   - Set up Azure billing alerts
   - Monitor ACS usage in Azure Portal

## Alternative: Using Environment Variable Locally

For local development, set the environment variable:

**Windows (PowerShell):**
```powershell
$env:AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..."
```

**macOS/Linux:**
```bash
export AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..."
```

Then run your backend:
```bash
dotnet run
```

## Additional Resources

- [Azure Communication Services Documentation](https://learn.microsoft.com/en-us/azure/communication-services/)
- [ACS Pricing Calculator](https://azure.microsoft.com/en-us/pricing/details/communication-services/)
- [ACS SDKs and APIs](https://learn.microsoft.com/en-us/azure/communication-services/concepts/sdk-options)

## Support

If you encounter issues:
1. Check Railway logs for error messages
2. Verify ACS resource is active in Azure Portal
3. Test the `/api/videocall/health` endpoint
4. Review this setup guide step by step
