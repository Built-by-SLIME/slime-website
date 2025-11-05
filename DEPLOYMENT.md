# Deployment Guide

## Environment Variables

This project uses environment variables to keep API keys and sensitive data secure.

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SENTX_API_KEY` | Your SentX API key for NFT data | `your_api_key_here` |
| `VITE_SLIME_TOKEN_ID` | SLIME collection token ID on Hedera | `0.0.9474754` |

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. Start the dev server:
   ```bash
   npm run dev
   ```

**Note:** The `.env` file is gitignored and will never be committed to the repository.

### Vercel Deployment

#### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `Built-by-SLIME/slime-website`

#### Step 2: Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add the following variables:

   **Variable Name:** `VITE_SENTX_API_KEY`  
   **Value:** `R1W7vOPQg40CXwf7OSizMnJas3sFaink` (your actual API key)  
   **Environment:** Production, Preview, Development (select all)

   **Variable Name:** `VITE_SLIME_TOKEN_ID`  
   **Value:** `0.0.9474754`  
   **Environment:** Production, Preview, Development (select all)

3. Click "Save"

#### Step 3: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your site
3. Your site will be live at `https://your-project.vercel.app`

#### Step 4: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

### Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy every push to `main` branch to production
- Create preview deployments for pull requests
- Run builds with your configured environment variables

### Troubleshooting

**Issue:** API calls failing with 401 or missing data

**Solution:** 
1. Check that environment variables are set in Vercel
2. Make sure variable names start with `VITE_` (required for Vite)
3. Redeploy after adding/changing environment variables

**Issue:** Build fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### Security Notes

- ✅ API keys are stored as environment variables
- ✅ `.env` file is gitignored
- ✅ Never commit API keys to the repository
- ✅ Use Vercel's environment variable encryption
- ✅ Rotate API keys if accidentally exposed

### Build Commands

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Lint:** `npm run lint`

