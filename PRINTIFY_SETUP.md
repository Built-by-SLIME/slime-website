# Printify Integration Setup Guide

This guide will help you complete the Printify integration for the SLIME merch page.

## Prerequisites

1. A Printify account (sign up at https://printify.com)
2. Products created in Printify with your SLIME designs
3. Vercel account for deployment

## Step 1: Create Printify Account & API Token

1. **Sign up for Printify**: https://printify.com
2. **Complete onboarding** and verify your account
3. **Generate API Token**:
   - Go to: My Profile → Connections
   - Click "Generate Token"
   - Set appropriate access scopes (products.read, products.write, orders.read, orders.write)
   - **IMPORTANT**: Copy the token immediately - it's only shown once!
   - Store it securely

## Step 2: Create an API Shop

1. Go to "My Stores" in Printify dashboard
2. Click "Add new store"
3. Select "API" as the integration type
4. Click "Connect"
5. Name your shop (e.g., "SLIME Website")

## Step 3: Get Your Shop ID

You can get your shop ID in two ways:

### Option A: Using the API (Recommended)
```bash
curl -X GET https://api.printify.com/v1/shops.json \
  --header "Authorization: Bearer YOUR_API_TOKEN"
```

This will return a JSON array with your shops. Find the `id` field of your API shop.

### Option B: From the Printify Dashboard
The shop ID is visible in the URL when you're viewing your shop in the dashboard.

## Step 4: Create Products in Printify

1. In your Printify dashboard, go to "My Products"
2. Click "Create Product"
3. Choose a blueprint (e.g., T-Shirt, Hoodie, Hat)
4. Select a print provider
5. Upload your SLIME designs
6. Configure variants (sizes, colors)
7. Set pricing (this will be the retail price shown on your site)
8. Publish the product to your API shop

**Repeat for all products you want to sell.**

## Step 5: Configure Environment Variables

### Local Development

1. Create a `.env` file in the `slime-website` directory:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Printify credentials:
```env
PRINTIFY_API_TOKEN=your_actual_token_here
PRINTIFY_SHOP_ID=your_shop_id_here
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to: Settings → Environment Variables
3. Add the following variables:
   - `PRINTIFY_API_TOKEN` = your Printify API token
   - `PRINTIFY_SHOP_ID` = your shop ID
4. Make sure to add them for all environments (Production, Preview, Development)

## Step 6: Test Locally

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/merch` in your browser
3. You should see your Printify products loaded
4. Test the checkout flow (orders will be created in Printify but not sent to production)

## Step 7: Deploy to Vercel

1. Commit your changes:
```bash
git add .
git commit -m "Add Printify integration"
git push
```

2. Vercel will automatically deploy your changes
3. Verify the environment variables are set in Vercel dashboard
4. Test the live site

## API Endpoints

Your site now has two serverless API endpoints:

- **GET /api/products** - Fetches products from Printify
- **POST /api/orders** - Creates orders in Printify

## Order Fulfillment

By default, orders are created in Printify but **NOT automatically sent to production**. This gives you a chance to:

1. Verify the order details
2. Confirm payment (especially for crypto payments)
3. Manually send to production from Printify dashboard

### To Auto-Send Orders to Production

If you want orders to automatically go to production, edit `api/orders.ts` and uncomment these lines:

```typescript
// Uncomment these lines:
const productionOrder = await printify.sendOrderToProduction(order.id)
return res.status(201).json({ success: true, data: productionOrder })
```

## Pricing Notes

- Printify API returns prices in **cents** (e.g., 2999 = $29.99)
- The code automatically converts to dollars for display
- Set your retail prices in Printify dashboard - these are what customers see

## Troubleshooting

### "Failed to fetch products" error
- Check that `PRINTIFY_API_TOKEN` and `PRINTIFY_SHOP_ID` are set correctly
- Verify your API token has the correct scopes
- Make sure you have products published to your API shop

### Products not showing
- Ensure products are published to your API shop (not just created)
- Check that products have at least one variant enabled
- Verify products have images uploaded

### Order creation fails
- Check that the shipping address format is correct
- Verify the variant ID exists for the product
- Ensure your Printify account is in good standing

## Next Steps

1. Create your SLIME products in Printify
2. Set up payment processing (Stripe for cards, manual for HBAR)
3. Configure email notifications for orders
4. Set up webhooks to track order status (optional)

## Support

- Printify API Docs: https://developers.printify.com
- Printify Support: https://printify.com/support

