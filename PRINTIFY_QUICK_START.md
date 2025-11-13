# Printify Quick Start Checklist

## ✅ What's Been Done

- [x] Created Printify API service utility (`api/lib/printify.ts`)
- [x] Created serverless API endpoints (`/api/products`, `/api/orders`)
- [x] Updated MerchPage to fetch real products from Printify
- [x] Updated order submission to create orders in Printify
- [x] Added TypeScript types for Printify API
- [x] Updated environment variables configuration
- [x] Installed required dependencies (@vercel/node)

## 🔧 What You Need To Do

### 1. Printify Account Setup (15 minutes)
- [ ] Create Printify account at https://printify.com
- [ ] Generate API token (My Profile → Connections)
- [ ] Create an API shop (My Stores → Add new store → API)
- [ ] Note your Shop ID

### 2. Create Products (30-60 minutes)
- [ ] Create products in Printify dashboard
- [ ] Upload SLIME designs
- [ ] Configure variants (sizes, colors)
- [ ] Set retail prices
- [ ] Publish to your API shop

### 3. Configure Environment Variables (5 minutes)

**Local (.env file):**
```env
PRINTIFY_API_TOKEN=your_token_here
PRINTIFY_SHOP_ID=your_shop_id_here
```

**Vercel Dashboard:**
- [ ] Add `PRINTIFY_API_TOKEN` to Vercel environment variables
- [ ] Add `PRINTIFY_SHOP_ID` to Vercel environment variables

### 4. Test & Deploy (10 minutes)
- [ ] Test locally: `npm run dev`
- [ ] Verify products load on `/merch` page
- [ ] Test checkout flow
- [ ] Deploy to Vercel: `git push`

## 🚀 Quick Commands

```bash
# Install dependencies (already done)
npm install

# Start local dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
git add .
git commit -m "Add Printify integration"
git push
```

## 📝 Important Notes

1. **Prices**: Set in Printify dashboard (in dollars), API returns in cents
2. **Orders**: Created in Printify but NOT auto-sent to production (you control when to fulfill)
3. **Images**: Automatically pulled from Printify products
4. **Variants**: Sizes/colors from Printify are used in checkout

## 🔗 Useful Links

- Printify Dashboard: https://printify.com/app
- Printify API Docs: https://developers.printify.com
- Your Vercel Dashboard: https://vercel.com/dashboard

## 💡 Tips

- Start with 1-2 test products to verify everything works
- Use Printify's mockup generator for product images
- Check Printify's pricing calculator to set profitable retail prices
- Orders appear in Printify dashboard under "Orders"

## ❓ Need Help?

See `PRINTIFY_SETUP.md` for detailed instructions and troubleshooting.

