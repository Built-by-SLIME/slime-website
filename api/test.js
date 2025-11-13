export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'API is working!',
    env_check: {
      hasToken: !!process.env.PRINTIFY_API_TOKEN,
      hasShopId: !!process.env.PRINTIFY_SHOP_ID,
      nodeVersion: process.version
    }
  })
}

