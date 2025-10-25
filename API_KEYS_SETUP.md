# 🔑 API Keys Setup Guide

## ✅ **Gemini API Key Configured**

Your Gemini API key has been set up: `AIzaSyA_LslfB_7FdSJixz3mrtnnrwb0yi87vh8`

## 🛠️ **Environment Setup**

### **For Local Development:**

1. **Create `.env.local` file** in your project root:
```bash
# Copy the example file
cp local-env.example .env.local
```

2. **Edit `.env.local`** with your keys:
```bash
VITE_GEMINI_API_KEY=AIzaSyA_LslfB_7FdSJixz3mrtnnrwb0yi87vh8
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_URL=http://localhost:3001/api
```

### **For Vercel Deployment:**

In your Vercel dashboard → Settings → Environment Variables, add:

```
VITE_GEMINI_API_KEY = AIzaSyA_LslfB_7FdSJixz3mrtnnrwb0yi87vh8
VITE_GOOGLE_MAPS_API_KEY = your_google_maps_api_key_here
VITE_API_URL = https://your-backend-url.railway.app/api
```

## 🗺️ **Google Maps API Key Setup**

You'll also need a Google Maps API key for location features:

### **Step 1: Get Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create credentials → API Key
5. Restrict the key to your domains

### **Step 2: Add to Environment**
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🚀 **Deploy to Vercel with API Keys**

### **Method 1: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_GOOGLE_MAPS_API_KEY
vercel env add VITE_API_URL
```

### **Method 2: Vercel Dashboard**
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add each variable:
   - `VITE_GEMINI_API_KEY` = `AIzaSyA_LslfB_7FdSJixz3mrtnnrwb0yi87vh8`
   - `VITE_GOOGLE_MAPS_API_KEY` = `your_google_maps_api_key`
   - `VITE_API_URL` = `https://your-backend-url.railway.app/api`

## 🧪 **Test Your Setup**

### **Local Testing:**
```bash
# Start development server
npm run dev

# Test AI features in your app
# Test location features (after adding Google Maps key)
```

### **Production Testing:**
1. Deploy to Vercel
2. Test AI chat functionality
3. Test location-based features
4. Verify all features work

## 🔒 **Security Notes**

- ✅ **Environment variables** are secure and not exposed in code
- ✅ **API keys** are only accessible to your app
- ✅ **Vercel** handles environment variables securely
- ⚠️ **Never commit** `.env.local` to git

## 📋 **Checklist**

- [x] Gemini API key configured
- [ ] Google Maps API key obtained
- [ ] Local environment file created
- [ ] Vercel environment variables set
- [ ] App deployed and tested

## 🎯 **Next Steps**

1. **Get Google Maps API key** (if you need location features)
2. **Deploy to Vercel** with environment variables
3. **Test AI features** in production
4. **Set up backend** (Railway recommended)

Your Gemini AI integration is now ready! The AI chat assistant and receipt processing features will work once deployed. 🎉
