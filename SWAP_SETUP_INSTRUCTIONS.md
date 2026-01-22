# 🔄 NFT SWAP FEATURE - Setup Instructions

## ✅ What's Been Built

I've created the foundation for your NFT swap feature:

### **1. Environment Variables**
- ✅ Updated `.env.local` with swap configuration
- ✅ Updated `.env.example` with documentation
- ✅ Added placeholders for sensitive data

### **2. Swap Page**
- ✅ Created `/swap` route
- ✅ Basic UI with wallet connection placeholder
- ✅ NFT display structure (needs WalletConnect integration)

### **3. Routing**
- ✅ Added SwapPage to App.tsx
- ✅ Route accessible at `/swap`

---

## 🔧 WHAT YOU NEED TO DO

### **Step 1: Get WalletConnect Project ID**

1. Go to: https://cloud.walletconnect.com/
2. Sign up for a free account
3. Create a new project (name it "SLIME Swap" or similar)
4. Copy your **Project ID**
5. Update `.env.local` **line 32**:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
   ```

### **Step 2: Add Treasury Private Key to Vercel**

1. Go to: https://vercel.com/built-by-slimes-projects/slime-website/settings/environment-variables
2. Add a new environment variable:
   - **Name:** `TREASURY_PRIVATE_KEY`
   - **Value:** Your treasury wallet private key (starts with `302e...`)
   - **Environment:** Production (and Preview if you want to test)
3. Click "Save"

### **Step 3: Add Backend Environment Variables to Vercel**

Add these to Vercel (if not already there):

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `HEDERA_NETWORK` | `mainnet` | Network to use |
| `TREASURY_ACCOUNT_ID` | `0.0.9463056` | Treasury wallet |
| `OLD_TOKEN_ID` | `0.0.8357917` | Old SLIME collection |
| `NEW_TOKEN_ID` | `0.0.9474754` | New SLIME collection |
| `BLACKHOLE_ACCOUNT_ID` | `0.0.10172931` | Blackhole wallet |
| `TREASURY_PRIVATE_KEY` | `302e...` | **SENSITIVE** - Your private key |

---

## 📋 NEXT STEPS (For Me)

Once you provide the WalletConnect Project ID, I'll:

1. ✅ Implement WalletConnect integration in SwapPage
2. ✅ Add NFT fetching from Hedera Mirror Node
3. ✅ Build NFT selection UI
4. ✅ Create backend API endpoint (`/api/swap-nft`)
5. ✅ Implement swap transaction logic
6. ✅ Add transaction status tracking
7. ✅ Test on mainnet

---

## 🔐 SECURITY NOTES

- ✅ **Treasury private key** is ONLY in Vercel environment variables (never in code)
- ✅ **WalletConnect Project ID** is safe to be in `.env.local` (it's public-facing)
- ✅ **All sensitive data** is in Vercel, not in the repository

---

## 📝 FILE LOCATIONS

### **Frontend Files:**
- `slime-website/src/components/SwapPage.tsx` - Main swap page
- `slime-website/src/App.tsx` - Routing (added `/swap` route)
- `slime-website/.env.local` - **Line 32** needs WalletConnect Project ID

### **Environment Files:**
- `slime-website/.env.local` - Local development (update line 32)
- `slime-website/.env.example` - Documentation

### **Backend Files (To Be Created):**
- `slime-website/api/swap-nft.js` - Swap transaction handler (coming next)

---

## 🚀 READY TO CONTINUE?

**Please provide:**
1. Your WalletConnect Project ID (from https://cloud.walletconnect.com/)

**Then I'll:**
1. Complete the WalletConnect integration
2. Build the full swap functionality
3. Create the backend API
4. Make it ready to test!

---

**Last Updated:** 2025-01-22

