import { useState, useEffect } from 'react'
import Navigation from './Navigation'
import Footer from './Footer'
import type { PrintifyProduct } from '../types/printify'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import CartModal from './CartModal'
import Toast from './Toast'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface Product {
  id: string
  title: string
  description: string
  price: number
  image: string
  images: string[] // Array of images for different colors
  variants: Array<{
    id: number
    title: string
    price: number
  }>
}

interface CheckoutForm {
  name: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  paymentMethod: 'card' | 'crypto'
}

interface ShippingOption {
  code: number
  name: string
  description: string
  cost: number // in cents
  costFormatted: string
}

// Stripe Payment Form Component
function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError
}: {
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setMessage('Payment system not ready. Please wait a moment and try again.')
      return
    }

    if (!isReady) {
      setMessage('Please wait for the payment form to load.')
      return
    }

    setIsProcessing(true)
    setMessage('')

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/merch?payment=success',
        },
        redirect: 'if_required'
      })

      if (error) {
        setMessage(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setMessage(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs'
        }}
      />
      {message && (
        <div className="text-red-500 text-sm">{message}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'PROCESSING...' : !isReady ? 'LOADING...' : 'PAY NOW'}
      </button>
    </form>
  )
}

// Success Modal Component
interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  orderDetails: {
    orderId: string
    amount: number
    productTitle: string
    email: string
  }
  paymentMethod?: 'card' | 'crypto'
  hbarAmount?: string
  shippingCost?: number
  productTotal?: number
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  orderDetails,
  paymentMethod = 'card',
  hbarAmount,
  shippingCost,
  productTotal
}) => {
  if (!isOpen) return null

  const isHBAR = paymentMethod === 'crypto'
  const hasBreakdown = shippingCost !== undefined && productTotal !== undefined

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] border-2 border-slime-green rounded-lg max-w-md w-full p-8 relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slime-green rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {isHBAR ? 'ORDER CREATED!' : 'PAYMENT SUCCESSFUL!'}
        </h2>
        <p className="text-gray-400 text-center mb-6">
          {isHBAR ? 'Complete your payment to finalize' : 'Your order has been received'}
        </p>

        {/* Order details */}
        <div className="bg-[#252525] rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Order ID / MEMO:</span>
            <span className="font-mono text-slime-green">{orderDetails.orderId}</span>
          </div>

          {/* Show breakdown if available */}
          {hasBreakdown ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Product Total:</span>
                <span className="font-bold">${productTotal!.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping:</span>
                <span className="font-bold">${shippingCost!.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">{isHBAR ? 'Total Amount:' : 'Total Paid:'}</span>
                  <span className="font-bold text-slime-green text-lg">${orderDetails.amount.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-400">{isHBAR ? 'Amount:' : 'Amount Paid:'}</span>
              <span className="font-bold">${orderDetails.amount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-400">Product:</span>
            <span className="text-right">{orderDetails.productTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email:</span>
            <span className="text-right text-sm">{orderDetails.email}</span>
          </div>
        </div>

        {/* HBAR Payment Instructions */}
        {isHBAR && hbarAmount && (
          <div className="bg-slime-green/10 border border-slime-green rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-3 text-slime-green">COMPLETE YOUR PAYMENT</h3>
            <div className="space-y-2 mb-3">
              <p className="text-sm text-gray-300">
                <span className="font-bold">Send:</span> <span className="text-slime-green font-bold text-lg">{hbarAmount} HBAR</span>
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-bold">To Wallet:</span> <span className="text-slime-green font-mono break-all">{import.meta.env.VITE_HBAR_TREASURY_WALLET || '0.0.9463056'}</span>
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-bold">MEMO (Required):</span> <span className="text-slime-green font-mono font-bold">{orderDetails.orderId}</span>
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3 mb-2">
              <p className="text-sm text-yellow-200">
                ⚠️ <span className="font-bold">IMPORTANT:</span> You MUST include the memo <span className="font-mono font-bold">{orderDetails.orderId}</span> when sending your HBAR payment!
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500 rounded p-3">
              <p className="text-xs text-red-200">
                <span className="font-bold">DISCLAIMER:</span> SLIME is not responsible for HBAR sent without the correct MEMO. Always double-check the memo before sending payment.
              </p>
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="bg-[#252525] rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2 text-slime-green">WHAT'S NEXT?</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-slime-green mr-2">•</span>
              <span>{isHBAR ? 'Check your email for complete payment instructions' : "You'll receive an order confirmation email shortly"}</span>
            </li>
            <li className="flex items-start">
              <span className="text-slime-green mr-2">•</span>
              <span>{isHBAR ? 'Send HBAR payment with the memo above' : 'Your order will be processed within 24-48 hours'}</span>
            </li>
            <li className="flex items-start">
              <span className="text-slime-green mr-2">•</span>
              <span>{isHBAR ? "We'll process your order once payment is confirmed on HashScan" : "You'll receive shipping updates via email"}</span>
            </li>
          </ul>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full bg-slime-green text-black py-3 rounded-md font-bold text-lg hover:bg-[#00cc33] transition"
        >
          CONTINUE SHOPPING
        </button>
      </div>
    </div>
  )
}

// Product Selection Modal Component
function ProductSelectionModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}: {
  product: Product
  onClose: () => void
  onAddToCart: (variantId: number, quantity: number) => void
  onBuyNow: (variantId: number, quantity: number) => void
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const handleAddToCart = () => {
    if (!selectedVariantId) {
      alert('Please select a size/color')
      return
    }
    onAddToCart(parseInt(selectedVariantId), quantity)
    onClose()
  }

  const handleBuyNow = () => {
    if (!selectedVariantId) {
      alert('Please select a size/color')
      return
    }
    onBuyNow(parseInt(selectedVariantId), quantity)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-[#1f1f1f] z-10">
          <h2 className="text-2xl font-black">SELECT OPTIONS</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Image Carousel */}
          <div className="relative aspect-square bg-[#252525] rounded-lg overflow-hidden">
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-slime-green' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xl font-bold">{product.title}</h3>

          {/* Size/Color Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">SIZE / COLOR *</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
            >
              <option value="">Select size / color</option>
              {product.variants
                .slice()
                .sort((a, b) => {
                  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'One size']
                  const getSizeAndColor = (title: string) => {
                    const parts = title.split(' / ')
                    return {
                      size: parts[0]?.trim() || '',
                      color: parts[1]?.trim() || ''
                    }
                  }
                  const variantA = getSizeAndColor(a.title)
                  const variantB = getSizeAndColor(b.title)
                  const sizeIndexA = sizeOrder.findIndex(s => variantA.size.includes(s))
                  const sizeIndexB = sizeOrder.findIndex(s => variantB.size.includes(s))
                  if (sizeIndexA !== sizeIndexB) {
                    if (sizeIndexA === -1) return 1
                    if (sizeIndexB === -1) return -1
                    return sizeIndexA - sizeIndexB
                  }
                  return variantA.color.localeCompare(variantB.color)
                })
                .map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-bold mb-2">QUANTITY</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-[#252525] hover:bg-slime-green hover:text-black rounded transition font-bold"
              >
                −
              </button>
              <span className="w-16 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-[#252525] hover:bg-slime-green hover:text-black rounded transition font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-md font-bold hover:bg-gray-600 transition"
            >
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-slime-green text-black px-6 py-3 rounded-md font-bold hover:bg-[#00cc33] transition"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Card Component with image carousel
function ProductCard({
  product,
  onBuyNow,
  onAddToCart,
  calculateHBARPrice
}: {
  product: Product
  onBuyNow: (product: Product) => void
  onAddToCart: (product: Product, quantity: number) => void
  calculateHBARPrice: (price: number) => string
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  return (
    <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all flex flex-col h-full">
      <div className="aspect-square bg-[#252525] p-4 md:p-8 flex items-center justify-center relative group overflow-hidden">
        <img
          src={product.images[currentImageIndex]}
          alt={product.title}
          className="max-w-full max-h-full object-contain"
        />

        {/* Image navigation - only show if multiple images */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex
                      ? 'bg-slime-green w-4'
                      : 'bg-gray-500 hover:bg-gray-400'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow mb-4">
          <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-3">{product.description}</p>
        </div>
        <div className="space-y-3 pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-400 mb-1">From</div>
              <div className="text-2xl font-black text-slime-green">${product.price.toFixed(2)}</div>
              <div className="text-xs text-gray-500">~{calculateHBARPrice(product.price)} HBAR</div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 bg-[#252525] hover:bg-slime-green hover:text-black rounded transition font-bold"
              >
                −
              </button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 bg-[#252525] hover:bg-slime-green hover:text-black rounded transition font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onAddToCart(product, quantity)}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-md font-bold text-sm hover:bg-gray-600 transition"
            >
              ADD TO CART
            </button>
            <button
              onClick={() => onBuyNow(product)}
              className="flex-1 bg-slime-green text-black px-4 py-3 rounded-md font-bold text-sm hover:bg-[#00cc33] transition"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MerchPage() {
  const cart = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hbarPrice, setHbarPrice] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState(false)
  const [formData, setFormData] = useState<CheckoutForm>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'United States',
    paymentMethod: 'card'
  })
  const [sameAsBilling, setSameAsBilling] = useState(true)

  // Product selection modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForModal, setProductForModal] = useState<Product | null>(null)
  const [modalAction, setModalAction] = useState<'addToCart' | 'buyNow'>('addToCart')

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [shippingCalculated, setShippingCalculated] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string
    amount: number
    productTitle: string
    email: string
  } | null>(null)
  const [successPaymentMethod, setSuccessPaymentMethod] = useState<'card' | 'crypto'>('card')
  const [successHbarAmount, setSuccessHbarAmount] = useState<string>('')
  const [successShippingCost, setSuccessShippingCost] = useState<number | undefined>(undefined)
  const [successProductTotal, setSuccessProductTotal] = useState<number | undefined>(undefined)

  // Fetch live HBAR price
  useEffect(() => {
    async function fetchHbarPrice() {
      try {
        // Using CoinGecko API to get HBAR price in USD
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd')
        const data = await response.json()
        const price = data['hedera-hashgraph']?.usd
        if (price) {
          setHbarPrice(price)
        }
      } catch (error) {
        console.error('Failed to fetch HBAR price:', error)
        // Fallback to a default price if API fails
        setHbarPrice(0.17) // Approximate fallback
      }
    }

    fetchHbarPrice()
    // Refresh price every 5 minutes
    const interval = setInterval(fetchHbarPrice, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch products from Printify API
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch products')
        }

        // Transform Printify products to our Product interface
        const transformedProducts: Product[] = result.data.map((p: PrintifyProduct) => {
          // Filter to only enabled variants, then get lowest price
          const enabledVariants = p.variants.filter((v: any) => v.is_enabled)
          const basePrice = enabledVariants.length > 0
            ? Math.min(...enabledVariants.map((v: any) => v.price)) / 100
            : 0

          // Get unique colors from enabled variants
          const colorOption = p.options?.find((opt: any) => opt.type === 'color')
          const enabledVariantIds = new Set(enabledVariants.map((v: any) => v.id))

          // Collect images for each unique color from enabled variants
          const colorImages: string[] = []
          const seenColors = new Set<number>()

          if (colorOption) {
            // For each enabled variant, find its color and corresponding image
            enabledVariants.forEach((variant: any) => {
              const colorId = variant.options?.find((opt: number) =>
                colorOption.values.some((c: any) => c.id === opt)
              )

              if (colorId && !seenColors.has(colorId)) {
                seenColors.add(colorId)

                // Find the best image for this variant
                // Priority: 1) default image, 2) selected for publishing, 3) front position, 4) any image
                const variantImages = p.images.filter((img: any) =>
                  img.variant_ids.includes(variant.id)
                )

                const bestImage =
                  variantImages.find((img: any) => img.is_default) ||
                  variantImages.find((img: any) => img.is_selected_for_publishing) ||
                  variantImages.find((img: any) => img.position === 'front') ||
                  variantImages[0]

                if (bestImage) {
                  colorImages.push(bestImage.src)
                }
              }
            })
          }

          // Fallback to default image if no color images found
          const defaultImage = p.images.find((img: any) => img.is_default)?.src ||
                              p.images[0]?.src ||
                              '/Assets/SPLAT.png'

          const finalImages = colorImages.length > 0 ? colorImages : [defaultImage]

          // Strip HTML tags from description and limit length
          const stripHtml = (html: string) => {
            const tmp = document.createElement('div')
            tmp.innerHTML = html
            const text = tmp.textContent || tmp.innerText || ''
            // Limit to 150 characters
            return text.length > 150 ? text.substring(0, 150) + '...' : text
          }

          return {
            id: p.id,
            title: p.title,
            description: stripHtml(p.description),
            price: basePrice,
            image: finalImages[0], // Primary image
            images: finalImages, // All color variant images
            variants: enabledVariants.map((v: any) => ({
              id: v.id,
              title: v.title,
              price: v.price / 100 // Convert cents to dollars
            }))
          }
        })

        // Define custom sort order
        const sortOrder = [
          'snapback',
          'slime face beanie',
          'slime cuffed beanie',
          'slime face t-shirt',
          'slime t-shirt',
          'zip-up',
          'pullover',
          'champion',
          'slime face sticker',
          'slime sticker',
          '501',
          'kiss cut',
          'thong'
        ]

        // Sort products based on custom order
        const sortedProducts = transformedProducts.sort((a, b) => {
          const titleA = a.title.toLowerCase()
          const titleB = b.title.toLowerCase()

          // Find the index in sortOrder for each product
          const indexA = sortOrder.findIndex(keyword => titleA.includes(keyword))
          const indexB = sortOrder.findIndex(keyword => titleB.includes(keyword))

          // If both found, sort by their order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }

          // If only one found, it comes first
          if (indexA !== -1) return -1
          if (indexB !== -1) return 1

          // If neither found, maintain original order
          return 0
        })

        setProducts(sortedProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Generate HBAR memo from Printify order ID
  const generateHBARMemo = (printifyOrderId: string) => {
    return `SLIME${printifyOrderId}`
  }

  const handleBuyNow = (product: Product) => {
    setProductForModal(product)
    setModalAction('buyNow')
    setShowProductModal(true)
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    setProductForModal(product)
    setModalAction('addToCart')
    setShowProductModal(true)
  }

  const handleModalAddToCart = (variantId: number, quantity: number) => {
    if (!productForModal) return

    const variant = productForModal.variants.find(v => v.id === variantId)
    if (!variant) return

    cart.addItem({
      productId: productForModal.id,
      variantId: variant.id,
      title: productForModal.title,
      variantTitle: variant.title,
      price: variant.price,
      image: productForModal.image
    }, quantity)

    // Show toast notification
    setToastMessage(`Added ${quantity}x ${productForModal.title} to cart!`)
    setShowToast(true)
  }

  const handleModalBuyNow = (variantId: number, quantity: number) => {
    if (!productForModal) return

    const variant = productForModal.variants.find(v => v.id === variantId)
    if (!variant) return

    // Add to cart first
    cart.addItem({
      productId: productForModal.id,
      variantId: variant.id,
      title: productForModal.title,
      variantTitle: variant.title,
      price: variant.price,
      image: productForModal.image
    }, quantity)

    // Then go to checkout
    setSelectedProduct(productForModal)
    setShowCheckout(true)
    setClientSecret(null)
    setPaymentIntentId(null)
  }

  const handleCheckoutFromCart = () => {
    setShowCart(false)
    // For now, we'll use the first item in cart as selected product
    // In a full implementation, we'd handle multiple items differently
    if (cart.items.length > 0) {
      const firstItem = cart.items[0]
      const product = products.find(p => p.id === firstItem.productId)
      if (product) {
        setSelectedProduct(product)
        setShowCheckout(true)
        setClientSecret(null)
        setPaymentIntentId(null)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

    // Reset shipping calculation if address changes
    if (['address', 'city', 'state', 'zip', 'country'].includes(e.target.name)) {
      setShippingCalculated(false)
      setShippingOptions([])
      setSelectedShipping(null)
    }
  }

  const calculateShipping = async () => {
    // Validate cart has items
    if (cart.items.length === 0) {
      alert('Your cart is empty. Please add items before calculating shipping.')
      return
    }

    // Determine which address to use for shipping
    const shippingAddress = sameAsBilling ? {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country
    } : {
      name: formData.shippingName,
      address: formData.shippingAddress,
      city: formData.shippingCity,
      state: formData.shippingState,
      zip: formData.shippingZip,
      country: formData.shippingCountry
    }

    // Validate shipping address fields
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country) {
      alert('Please fill in all shipping address fields before calculating shipping')
      return
    }

    setIsCalculatingShipping(true)

    try {
      // Split name into first and last name
      const nameParts = shippingAddress.name.trim().split(' ')
      const firstName = nameParts[0] || 'Customer'
      const lastName = nameParts.slice(1).join(' ') || firstName

      // Prepare line items from cart
      const lineItems = cart.items.map(item => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity
      }))

      // Convert country names to ISO codes for Printify API
      let countryCode = shippingAddress.country
      if (shippingAddress.country === 'United States') {
        countryCode = 'US'
      } else if (shippingAddress.country === 'Canada') {
        countryCode = 'CA'
      }

      const response = await fetch('/api/calculate-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: lineItems,
          address_to: {
            first_name: firstName,
            last_name: lastName,
            email: formData.email || '[email protected]',
            country: countryCode,
            region: shippingAddress.state,
            address1: shippingAddress.address,
            city: shippingAddress.city,
            zip: shippingAddress.zip
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to calculate shipping')
      }

      setShippingOptions(result.shippingOptions)

      // Auto-select standard shipping (code 1) if available
      const standardShipping = result.shippingOptions.find((opt: ShippingOption) => opt.code === 1)
      if (standardShipping) {
        setSelectedShipping(standardShipping)
      } else if (result.shippingOptions.length > 0) {
        setSelectedShipping(result.shippingOptions[0])
      }

      setShippingCalculated(true)
    } catch (error) {
      console.error('Error calculating shipping:', error)
      alert('Failed to calculate shipping. Please try again.')
    } finally {
      setIsCalculatingShipping(false)
    }
  }

  const handleSubmitOrder = async () => {
    // Validate cart has items
    if (cart.items.length === 0) {
      alert('Your cart is empty')
      return
    }

    // Validate shipping is calculated
    if (!shippingCalculated || !selectedShipping) {
      alert('Please calculate shipping before submitting your order')
      return
    }

    setIsProcessingOrder(true)

    try {
      // Determine which address to use for shipping
      const shippingAddress = sameAsBilling ? {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country
      } : {
        name: formData.shippingName,
        address: formData.shippingAddress,
        city: formData.shippingCity,
        state: formData.shippingState,
        zip: formData.shippingZip,
        country: formData.shippingCountry
      }

      // Split name into first and last name
      const nameParts = shippingAddress.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName

      if (formData.paymentMethod === 'card') {
        // STRIPE PAYMENT FLOW
        // Calculate total with shipping
        const productTotal = cart.getTotalPrice()
        const shippingCost = selectedShipping.cost / 100 // Convert cents to dollars
        const totalAmount = productTotal + shippingCost
        const amountInCents = Math.round(totalAmount * 100) // Convert dollars to cents

        console.log('Creating payment intent:', {
          productTotal,
          shippingCost,
          totalAmount,
          amountInCents
        })

        // Get first item title for payment description
        const firstItemTitle = cart.items[0]?.title || 'SLIME Merch'

        const paymentResponse = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInCents, // Stripe requires cents (includes shipping)
            productTitle: firstItemTitle,
            customerEmail: formData.email,
            productTotal: productTotal,
            shippingCost: shippingCost,
            shippingMethod: selectedShipping.name
          })
        })

        const paymentResult = await paymentResponse.json()
        console.log('Payment intent result:', paymentResult)

        if (!paymentResult.success) {
          throw new Error(paymentResult.message || paymentResult.error || 'Failed to create payment intent')
        }

        setClientSecret(paymentResult.clientSecret)
        setPaymentIntentId(paymentResult.paymentIntentId)
        setIsProcessingOrder(false)
      } else {
        // HBAR PAYMENT FLOW
        // Calculate total with shipping
        const productTotal = cart.getTotalPrice()
        const shippingCost = selectedShipping.cost / 100 // Convert cents to dollars
        const totalAmount = productTotal + shippingCost

        // Create order data for Printify API
        const lineItems = cart.items.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity
        }))

        // Convert country names to ISO codes for Printify API
        let orderCountryCode = shippingAddress.country
        if (shippingAddress.country === 'United States') {
          orderCountryCode = 'US'
        } else if (shippingAddress.country === 'Canada') {
          orderCountryCode = 'CA'
        }

        const orderData = {
          line_items: lineItems,
          shipping_method: selectedShipping.code,
          send_shipping_notification: true,
          address_to: {
            first_name: firstName,
            last_name: lastName,
            email: formData.email,
            phone: '',
            country: orderCountryCode,
            region: shippingAddress.state,
            address1: shippingAddress.address,
            city: shippingAddress.city,
            zip: shippingAddress.zip
          }
        }

        // Create draft order in Printify
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        const orderResult = await orderResponse.json()

        if (!orderResult.success) {
          throw new Error(orderResult.error || 'Failed to create order')
        }

        // Get Printify order ID and generate memo
        const printifyOrderId = orderResult.data.id
        const hbarMemo = `SLIME${printifyOrderId}`

        console.log('Printify order created:', printifyOrderId)
        console.log('HBAR memo:', hbarMemo)

        // Get first item title for email
        const firstItemTitle = cart.items[0]?.title || 'SLIME Merch'
        const firstItemVariant = cart.items[0]?.variantTitle || ''

        // Send email notification
        console.log('Sending HBAR order email with data:', {
          orderMemo: hbarMemo,
          customerName: formData.name,
          customerEmail: formData.email,
          productTitle: firstItemTitle,
          variantTitle: firstItemVariant,
          price: productTotal,
          shippingCost: shippingCost,
          totalAmount: totalAmount,
          hbarAmount: calculateHBARPrice(totalAmount),
          shippingMethod: selectedShipping.name
        })

        const emailResponse = await fetch('/api/send-order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderMemo: hbarMemo,
            customerName: formData.name,
            customerEmail: formData.email,
            productTitle: firstItemTitle,
            variantTitle: firstItemVariant,
            price: productTotal,
            shippingCost: shippingCost,
            totalAmount: totalAmount,
            hbarAmount: calculateHBARPrice(totalAmount),
            shippingMethod: selectedShipping.name,
            shippingAddress: orderData.address_to
          })
        })

        console.log('Email response status:', emailResponse.status)
        const emailResult = await emailResponse.json()
        console.log('Email result:', emailResult)

        if (!emailResult.success) {
          console.error('Failed to send email notification:', emailResult.error)
        } else {
          console.log('Email sent successfully!')
        }

        // Set order details and show success modal
        setOrderDetails({
          orderId: hbarMemo,
          amount: totalAmount,
          productTitle: firstItemTitle,
          email: formData.email
        })
        setSuccessPaymentMethod('crypto')
        setSuccessHbarAmount(calculateHBARPrice(totalAmount))
        setSuccessShippingCost(shippingCost)
        setSuccessProductTotal(productTotal)
        setShowSuccessModal(true)

        // Clear cart after successful order
        cart.clearCart()

        // Close checkout
        setShowCheckout(false)
        setClientSecret(null)
        setPaymentIntentId(null)

        // Reset form data
        setFormData({
          name: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States',
          shippingName: '',
          shippingAddress: '',
          shippingCity: '',
          shippingState: '',
          shippingZip: '',
          shippingCountry: 'United States',
          paymentMethod: 'card'
        })

        // Reset shipping
        setShippingCalculated(false)
        setShippingOptions([])
        setSelectedShipping(null)

        setIsProcessingOrder(false)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert(`Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsProcessingOrder(false)
    }
  }

  const calculateHBARPrice = (usdPrice: number) => {
    if (!hbarPrice) {
      return '...' // Loading state
    }
    // Calculate HBAR amount and round UP to cover transfer/exchange fees
    const hbarAmount = Math.ceil(usdPrice / hbarPrice)
    return hbarAmount.toString()
  }

  const handleStripePaymentSuccess = async () => {
    console.log('Payment success handler called!')
    console.log('paymentIntentId:', paymentIntentId)

    if (!paymentIntentId || !selectedShipping || cart.items.length === 0) {
      console.error('Missing required data:', { paymentIntentId, selectedShipping, cartItems: cart.items.length })
      return
    }

    try {
      // Determine which address to use for shipping
      const shippingAddress = sameAsBilling ? {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country
      } : {
        name: formData.shippingName,
        address: formData.shippingAddress,
        city: formData.shippingCity,
        state: formData.shippingState,
        zip: formData.shippingZip,
        country: formData.shippingCountry
      }

      // Split name into first and last name
      const nameParts = shippingAddress.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName

      console.log('Creating order with cart items:', cart.items)

      // Prepare line items from cart
      const lineItems = cart.items.map(item => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity
      }))

      // Convert country names to ISO codes for Printify API
      let confirmCountryCode = shippingAddress.country
      if (shippingAddress.country === 'United States') {
        confirmCountryCode = 'US'
      } else if (shippingAddress.country === 'Canada') {
        confirmCountryCode = 'CA'
      }

      // Create order data for Printify API
      const orderData = {
        line_items: lineItems,
        shipping_method: selectedShipping.code,
        send_shipping_notification: true,
        address_to: {
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: '',
          country: confirmCountryCode,
          region: shippingAddress.state,
          address1: shippingAddress.address,
          city: shippingAddress.city,
          zip: shippingAddress.zip
        }
      }

      // Confirm order and send to Printify production
      console.log('Calling /api/confirm-order with:', { paymentIntentId, orderData })

      const response = await fetch('/api/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          orderData
        })
      })

      console.log('Confirm order response status:', response.status)
      const result = await response.json()
      console.log('Confirm order result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm order')
      }

      // Calculate total with shipping
      const productTotal = cart.getTotalPrice()
      const shippingCost = selectedShipping.cost / 100
      const totalAmount = productTotal + shippingCost

      // Set order details and show success modal
      setOrderDetails({
        orderId: result.data.orderId,
        amount: totalAmount,
        productTitle: selectedProduct.title,
        email: formData.email
      })
      setSuccessPaymentMethod('card')
      setSuccessShippingCost(shippingCost)
      setSuccessProductTotal(productTotal)
      setShowSuccessModal(true)

      // Clear cart after successful order
      cart.clearCart()

      // Close checkout
      setShowCheckout(false)
      setClientSecret(null)
      setPaymentIntentId(null)

      // Reset form data
      setFormData({
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
        shippingName: '',
        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingZip: '',
        shippingCountry: 'United States',
        paymentMethod: 'card'
      })
      setSameAsBilling(true)

      // Reset shipping
      setShippingCalculated(false)
      setShippingOptions([])
      setSelectedShipping(null)

    } catch (error) {
      console.error('Error confirming order:', error)
      alert(`Payment succeeded but order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease contact support at orders@builtbyslime.org`)
    }
  }

  const handleStripePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`)
    setClientSecret(null)
    setPaymentIntentId(null)
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      {/* Header Section with Dot Grid Background */}
      <section className="relative bg-[#2a2a2a]">
        {/* Dot pattern background with gradient fade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
        }}></div>

        <Navigation />

        {/* Hero Section */}
        <div className="relative py-12 md:py-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-4">SLIME MERCH</h1>
            <p className="text-gray-400 text-lg mb-8">Rep the collective. Wear the SLIME.</p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-6 md:py-10 px-4 md:px-8 pb-20 bg-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slime-green"></div>
              <p className="mt-4 text-gray-400">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <p className="text-gray-400 text-sm">Please make sure you have configured your Printify API credentials.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">No products available yet.</p>
              <p className="text-gray-500 text-sm mt-2">Create products in your Printify dashboard to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuyNow={handleBuyNow}
                  onAddToCart={handleAddToCart}
                  calculateHBARPrice={calculateHBARPrice}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Selection Modal */}
      {showProductModal && productForModal && (
        <ProductSelectionModal
          product={productForModal}
          onClose={() => setShowProductModal(false)}
          onAddToCart={handleModalAddToCart}
          onBuyNow={handleModalBuyNow}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f1f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-[#1f1f1f] z-10">
              <h2 className="text-2xl font-black">CHECKOUT</h2>
              <button
                onClick={() => {
                  setShowCheckout(false)
                  setShippingCalculated(false)
                  setShippingOptions([])
                  setSelectedShipping(null)
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cart Items Summary */}
              <div className="bg-[#252525] rounded-lg p-4 border border-gray-700">
                <h3 className="font-bold mb-3">ORDER ITEMS</h3>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-contain rounded" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-400">{item.variantTitle}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold text-slime-green">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                  <span className="font-bold">Subtotal:</span>
                  <span className="font-bold text-slime-green">${cart.getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold mb-2">PAYMENT METHOD *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    className={`p-4 rounded-md border-2 font-bold transition ${
                      formData.paymentMethod === 'card'
                        ? 'border-slime-green bg-slime-green/10 text-slime-green'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    CREDIT CARD
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'crypto' })}
                    className={`p-4 rounded-md border-2 font-bold transition ${
                      formData.paymentMethod === 'crypto'
                        ? 'border-slime-green bg-slime-green/10 text-slime-green'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    HBAR {shippingCalculated && selectedShipping
                      ? `(${calculateHBARPrice(cart.getTotalPrice() + (selectedShipping.cost / 100))} HBAR)`
                      : ''}
                  </button>
                </div>
              </div>

              {/* Billing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">BILLING INFORMATION</h3>

                <div>
                  <label className="block text-sm font-bold mb-2">FULL NAME *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">EMAIL *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">ADDRESS *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">CITY *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">STATE *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">ZIP CODE *</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">COUNTRY *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">SHIPPING INFORMATION</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="w-4 h-4 accent-slime-green"
                    />
                    <span className="text-sm text-gray-300">Same as billing</span>
                  </label>
                </div>

                {!sameAsBilling && (
                  <>
                    <div>
                      <label className="block text-sm font-bold mb-2">FULL NAME *</label>
                      <input
                        type="text"
                        name="shippingName"
                        value={formData.shippingName}
                        onChange={handleInputChange}
                        required={!sameAsBilling}
                        className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">ADDRESS *</label>
                      <input
                        type="text"
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleInputChange}
                        required={!sameAsBilling}
                        className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">CITY *</label>
                        <input
                          type="text"
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleInputChange}
                          required={!sameAsBilling}
                          className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">STATE *</label>
                        <input
                          type="text"
                          name="shippingState"
                          value={formData.shippingState}
                          onChange={handleInputChange}
                          required={!sameAsBilling}
                          className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">ZIP CODE *</label>
                        <input
                          type="text"
                          name="shippingZip"
                          value={formData.shippingZip}
                          onChange={handleInputChange}
                          required={!sameAsBilling}
                          className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">COUNTRY *</label>
                        <input
                          type="text"
                          name="shippingCountry"
                          value={formData.shippingCountry}
                          onChange={handleInputChange}
                          required={!sameAsBilling}
                          className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Shipping Calculation */}
              <div className="bg-[#252525] border border-gray-700 rounded-lg p-4">
                <h4 className="font-bold mb-3">SHIPPING</h4>

                {!shippingCalculated ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">
                      Please calculate shipping to continue
                    </p>
                    <button
                      type="button"
                      onClick={calculateShipping}
                      disabled={isCalculatingShipping}
                      className="w-full bg-slime-green text-black py-3 rounded-md font-bold hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCalculatingShipping ? 'CALCULATING...' : 'CALCULATE SHIPPING'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slime-green font-bold">✓ Shipping calculated</p>

                    {/* Shipping Method Selector */}
                    <div className="space-y-2">
                      {shippingOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => setSelectedShipping(option)}
                          className={`w-full p-3 rounded-md border-2 text-left transition ${
                            selectedShipping?.code === option.code
                              ? 'border-slime-green bg-slime-green/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold">{option.name}</div>
                              <div className="text-sm text-gray-400">{option.description}</div>
                            </div>
                            <div className="font-bold text-slime-green">{option.costFormatted}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShippingCalculated(false)
                        setShippingOptions([])
                        setSelectedShipping(null)
                      }}
                      className="text-sm text-gray-400 hover:text-slime-green transition"
                    >
                      Recalculate shipping
                    </button>
                  </div>
                )}
              </div>

              {/* Stripe Payment Form */}
              {formData.paymentMethod === 'card' && clientSecret && (
                <div className="bg-[#252525] border border-gray-700 rounded-lg p-4">
                  <h4 className="font-bold mb-4">PAYMENT DETAILS</h4>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      onSuccess={handleStripePaymentSuccess}
                      onError={handleStripePaymentError}
                    />
                  </Elements>
                </div>
              )}

              {/* Crypto Payment Instructions */}
              {formData.paymentMethod === 'crypto' && shippingCalculated && selectedShipping && (
                <div className="bg-slime-green/10 border border-slime-green rounded-lg p-4">
                  <h4 className="font-bold text-slime-green mb-3">HBAR PAYMENT INSTRUCTIONS</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    After submitting your order, you'll receive payment instructions including:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-2 mb-3 list-disc list-inside">
                    <li>Your unique order ID / MEMO</li>
                    <li>Exact HBAR amount to send (currently ~{calculateHBARPrice(cart.getTotalPrice() + (selectedShipping.cost / 100))} HBAR)</li>
                    <li>Treasury wallet address</li>
                  </ul>
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3">
                    <p className="text-sm text-yellow-200">
                      ⚠️ <span className="font-bold">IMPORTANT:</span> You MUST include the MEMO when sending your HBAR payment. Payment instructions will be shown immediately after submitting your order.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {shippingCalculated && selectedShipping && (
                <div className="bg-[#1f1f1f] border border-gray-700 rounded-lg p-4">
                  <h4 className="font-bold mb-3">ORDER SUMMARY</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="font-bold">${cart.getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping ({selectedShipping.name}):</span>
                      <span className="font-bold">{selectedShipping.costFormatted}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-slime-green">
                          ${(cart.getTotalPrice() + (selectedShipping.cost / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {formData.paymentMethod === 'card' && !clientSecret && (
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isProcessingOrder}
                  className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingOrder ? 'PROCESSING...' : 'CONTINUE TO PAYMENT'}
                </button>
              )}

              {formData.paymentMethod === 'crypto' && (
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isProcessingOrder}
                  className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingOrder ? 'PROCESSING...' : 'SUBMIT ORDER (PAY WITH HBAR)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && orderDetails && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            setOrderDetails(null)
            setSuccessShippingCost(undefined)
            setSuccessProductTotal(undefined)
          }}
          orderDetails={orderDetails}
          paymentMethod={successPaymentMethod}
          hbarAmount={successHbarAmount}
          shippingCost={successShippingCost}
          productTotal={successProductTotal}
        />
      )}

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 z-40 bg-slime-green text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#00cc33] transition"
        aria-label="Shopping cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {cart.getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-slime-green text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.getTotalItems()}
          </span>
        )}
      </button>

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckoutFromCart}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}

