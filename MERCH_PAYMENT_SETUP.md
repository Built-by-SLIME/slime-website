# 🎨 SLIME Merch Payment System - Setup Guide

## ✅ What's Been Built

Your merch page now has a **complete dual payment system**:

### **💳 Credit Card Payments (Stripe)**
- Integrated Stripe Elements for secure card payments
- Automatic payment processing
- Orders automatically sent to Printify production
- Customer receives shipping updates

### **💰 HBAR Crypto Payments**
- Unique order MEMO system (e.g., `SLIME-123456ABC`)
- Email notifications to `orders@builtbyslime.org`
- Manual verification via HashScan
- Manual Printify order creation

---

## 🔧 Final Setup Steps

### **1. Add Frontend Environment Variables**

Create a `.env.local` file in the `slime-website` directory:

```bash
# Stripe Publishable Key (Frontend) - Use your TEST key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# HBAR Treasury Wallet (Frontend)
VITE_HBAR_TREASURY_WALLET=0.0.9463056
```

**For Production (when ready to go live):**
Replace the test key with your live key:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **2. Verify Vercel Environment Variables**

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```
STRIPE_PUBLISHABLE_KEY = pk_live_... (your LIVE publishable key)
STRIPE_SECRET_KEY = sk_live_... (your LIVE secret key)
HBAR_TREASURY_WALLET = 0.0.9463056
RESEND_API_KEY = re_... (your Resend API key)
RESEND_FROM_EMAIL = orders@builtbyslime.org
RESEND_TO_EMAIL = orders@builtbyslime.org
```

**Preview/Development Environments:**
```
STRIPE_PUBLISHABLE_KEY = pk_test_... (your TEST publishable key)
STRIPE_SECRET_KEY = sk_test_... (your TEST secret key)
HBAR_TREASURY_WALLET = 0.0.9463056
RESEND_API_KEY = re_... (your Resend API key)
RESEND_FROM_EMAIL = orders@builtbyslime.org
RESEND_TO_EMAIL = orders@builtbyslime.org
```

---

## 🎯 How It Works

### **Credit Card Payment Flow:**

1. Customer clicks "BUY NOW" → Selects size
2. Chooses "CREDIT CARD" payment method
3. Enters shipping information
4. Clicks "CONTINUE TO PAYMENT"
5. Stripe payment form appears
6. Customer enters card details
7. Clicks "PAY NOW"
8. **Backend automatically:**
   - Verifies payment with Stripe
   - Creates order in Printify
   - Sends order to production
9. Customer sees success message
10. **Done!** Order ships automatically

### **HBAR Payment Flow:**

1. Customer clicks "BUY NOW" → Selects size
2. Chooses "HBAR" payment method
3. Sees payment instructions with:
   - **Order ID / MEMO** (e.g., `SLIME-123456ABC`)
   - **Amount** (e.g., `147 HBAR`)
   - **Wallet** (`0.0.9463056`)
4. Enters shipping information
5. Clicks "SUBMIT ORDER (PAY WITH HBAR)"
6. **Backend automatically:**
   - Creates draft order in Printify
   - Sends email to `orders@builtbyslime.org` with all details
7. Customer sees payment instructions
8. **You receive email with:**
   - Order MEMO
   - Customer info
   - Shipping address
   - HBAR amount
   - Link to verify on HashScan
9. **You manually:**
   - Check HashScan for payment with matching MEMO
   - Verify HBAR amount
   - Create order in Printify dashboard
10. **Done!** Order ships

---

## 📧 Email Notification Example

When an HBAR order comes in, you'll receive:

```
Subject: 🎨 New HBAR Order - SLIME-123456ABC

📋 Order Details
Order ID / MEMO: SLIME-123456ABC
Product: SLIME Hoodie - Size L / Black
Price: $25.00 USD

💰 Payment Details
Amount: 147 HBAR
Wallet: 0.0.9463056
MEMO: SLIME-123456ABC
⚠️ IMPORTANT: Customer must include MEMO SLIME-123456ABC

👤 Customer Information
Name: John Doe
Email: john@example.com

📦 Shipping Address
John Doe
123 Main St
Los Angeles, CA 90001
United States

🔍 Next Steps
1. Verify HBAR payment on HashScan
2. Search for MEMO: SLIME-123456ABC
3. Confirm payment amount: 147 HBAR
4. Once verified, create order in Printify
```

---

## 🧪 Testing

### **Test Stripe Payments:**

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Any future expiry date, any CVC

### **Test HBAR Payments:**

1. Place an order with HBAR payment
2. Check your email at `orders@builtbyslime.org`
3. Verify email contains all order details

---

## 🚀 Going Live

When ready to accept real payments:

1. **Update Vercel Production environment variables** with LIVE Stripe keys
2. **Update `.env.local`** with live publishable key (for local testing)
3. **Test one order** with a real card (small amount)
4. **Verify** Printify order is created and sent to production
5. **You're live!** 🎉

---

## 📝 Notes

- **Stripe test mode** is currently active (safe for testing)
- **HBAR payments** require manual verification and order creation
- **Email notifications** only sent for HBAR orders
- **Credit card orders** are fully automated
- **MEMO field** is critical for matching HBAR payments to orders

---

## 🆘 Troubleshooting

**Stripe payment not working?**
- Check `.env.local` has correct `VITE_STRIPE_PUBLISHABLE_KEY`
- Verify Vercel has `STRIPE_SECRET_KEY` set
- Check browser console for errors

**Email not received?**
- Verify Resend domain is verified
- Check Vercel has `RESEND_API_KEY` set
- Check spam folder

**HBAR price not showing?**
- CoinGecko API may be rate-limited
- Fallback price of 0.17 HBAR/USD will be used

---

**Built with ❤️ for SLIME** 🎨

