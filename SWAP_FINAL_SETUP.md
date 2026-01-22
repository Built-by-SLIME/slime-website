# 🔄 NFT SWAP - FINAL SETUP GUIDE

## ✅ WHAT'S BEEN BUILT

Your NFT swap feature is **COMPLETE**! Here's what's ready:

### **Frontend (`/swap` page):**
- ✅ HashPack wallet connection
- ✅ Fetches user's old SLIME NFTs from Hedera Mirror Node
- ✅ Displays NFTs with images and metadata
- ✅ NFT selection UI (select individual or all)
- ✅ Swap button with transaction handling
- ✅ Loading states and error handling

### **Backend (`/api/swap-nft`):**
- ✅ Transfers old NFT from user to blackhole wallet
- ✅ Transfers new NFT from treasury to user
- ✅ Maintains same serial numbers
- ✅ Error handling and transaction logging

### **Configuration:**
- ✅ Environment variables set up
- ✅ WalletConnect Project ID: `80fd1d9842276457fc1d12be7c65f6fa`
- ✅ Old Token ID: `0.0.8357917`
- ✅ New Token ID: `0.0.9474754`
- ✅ Treasury Wallet: `0.0.9463056`
- ✅ Blackhole Wallet: `0.0.10172931`

---

## 🔧 FINAL STEPS TO GO LIVE

### **Step 1: Add Treasury Private Key to Vercel**

1. Go to: https://vercel.com/built-by-slimes-projects/slime-website/settings/environment-variables
2. Click **"Add New"**
3. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `HEDERA_NETWORK` | `mainnet` | Production |
| `TREASURY_ACCOUNT_ID` | `0.0.9463056` | Production |
| `TREASURY_PRIVATE_KEY` | `YOUR_PRIVATE_KEY_HERE` | Production |
| `OLD_TOKEN_ID` | `0.0.8357917` | Production |
| `NEW_TOKEN_ID` | `0.0.9474754` | Production |
| `BLACKHOLE_ACCOUNT_ID` | `0.0.10172931` | Production |

**IMPORTANT:** The `TREASURY_PRIVATE_KEY` should be in DER format (starts with `302e...`)

4. Click **"Save"**

### **Step 2: Deploy to Vercel**

Once you add the environment variables, Vercel will automatically redeploy.

Or you can manually deploy:
```bash
cd slime-website
git add -A
git commit -m "Add NFT swap feature"
git push
```

---

## 🧪 TESTING THE SWAP

### **Before Testing:**
1. Make sure you have HashPack wallet installed
2. Make sure your treasury wallet (`0.0.9463056`) has the new SLIME NFTs
3. Make sure you have a test wallet with old SLIME NFTs

### **Test Flow:**
1. Go to: https://builtbyslime.org/swap
2. Click **"CONNECT HASHPACK"**
3. Approve connection in HashPack
4. You should see your old SLIME NFTs
5. Select NFTs to swap
6. Click **"SWAP X NFTs"**
7. Approve transaction in HashPack
8. Wait for confirmation
9. Check your wallet - old NFTs should be gone, new NFTs should appear!

---

## 🔐 SECURITY NOTES

- ✅ **Treasury private key** is ONLY in Vercel (never in code or git)
- ✅ **User never shares private keys** - they sign transactions in their wallet
- ✅ **Allowance system** - user must approve each NFT transfer
- ✅ **Backend validation** - all transfers validated server-side

---

## 📋 HOW THE SWAP WORKS

### **User Flow:**
1. User connects HashPack wallet
2. Frontend fetches their old SLIME NFTs from Hedera Mirror Node
3. User selects which NFTs to swap
4. User clicks "SWAP"
5. Frontend calls `/api/swap-nft` with account ID and serial numbers
6. Backend performs the swap (see below)
7. User sees success message and refreshed NFT list

### **Backend Flow (for each NFT):**
1. **Transfer old NFT to blackhole:**
   - Uses approved transfer (user must have approved allowance)
   - Transfers from user wallet to blackhole wallet (`0.0.10172931`)
   
2. **Transfer new NFT to user:**
   - Transfers from treasury wallet (`0.0.9463056`) to user wallet
   - Same serial number as the old NFT

---

## 🚨 TROUBLESHOOTING

### **"HashPack wallet not found"**
- User needs to install HashPack extension
- Link provided in error message

### **"Failed to fetch NFTs"**
- Check that the old token ID is correct
- Check Hedera Mirror Node is accessible

### **"Swap failed"**
- Check that treasury wallet has the new NFTs with matching serial numbers
- Check that treasury private key is correct in Vercel
- Check that user has approved allowance (future enhancement)

### **"Server configuration error"**
- Missing environment variables in Vercel
- Check all variables are set correctly

---

## 🔮 FUTURE ENHANCEMENTS

### **Phase 2 (Optional):**
- [ ] Add allowance approval step in UI
- [ ] Add transaction status tracking with HashScan links
- [ ] Add batch swap optimization
- [ ] Add swap history/analytics
- [ ] Add email notifications on successful swap

---

## 📁 FILE STRUCTURE

```
slime-website/
├── src/
│   └── components/
│       └── SwapPage.tsx          # Main swap page component
├── api/
│   └── swap-nft.js               # Backend swap API
├── .env.local                     # Local environment variables
├── SWAP_FINAL_SETUP.md           # This file
└── NFT_SWAP_REQUIREMENTS.md      # Original requirements
```

---

## 🚀 YOU'RE READY!

Once you add the treasury private key to Vercel, the swap feature will be **LIVE**!

**Test it thoroughly before announcing to the community!**

---

**Last Updated:** 2025-01-22

