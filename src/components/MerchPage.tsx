import { useState } from 'react'
import Footer from './Footer'

interface Product {
  id: string
  title: string
  description: string
  price: number
  image: string
  variants: Array<{
    id: string
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
  size: string
  paymentMethod: 'card' | 'crypto'
}

export default function MerchPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState<CheckoutForm>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    size: '',
    paymentMethod: 'card'
  })

  // Mock products - will be replaced with Printify API data
  const products: Product[] = [
    {
      id: '1',
      title: 'SLIME T-Shirt',
      description: 'Premium cotton tee with SLIME logo',
      price: 29.99,
      image: '/Assets/SPLAT.png', // Placeholder - will use actual product images
      variants: [
        { id: 's', title: 'Small', price: 29.99 },
        { id: 'm', title: 'Medium', price: 29.99 },
        { id: 'l', title: 'Large', price: 29.99 },
        { id: 'xl', title: 'X-Large', price: 29.99 }
      ]
    },
    {
      id: '2',
      title: 'SLIME Hoodie',
      description: 'Cozy hoodie with embroidered SLIME',
      price: 49.99,
      image: '/Assets/SPLAT.png', // Placeholder
      variants: [
        { id: 's', title: 'Small', price: 49.99 },
        { id: 'm', title: 'Medium', price: 49.99 },
        { id: 'l', title: 'Large', price: 49.99 },
        { id: 'xl', title: 'X-Large', price: 49.99 }
      ]
    },
    {
      id: '3',
      title: 'SLIME Hat',
      description: 'Snapback cap with SLIME patch',
      price: 24.99,
      image: '/Assets/SPLAT.png', // Placeholder
      variants: [
        { id: 'onesize', title: 'One Size', price: 24.99 }
      ]
    }
  ]

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product)
    setShowCheckout(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()
    
    // For now, just log the order - you'll process manually
    console.log('Order submitted:', {
      product: selectedProduct,
      formData
    })

    // Show success message
    alert(`Order received! ${formData.paymentMethod === 'crypto' ? 'Please send HBAR payment to the address shown below.' : 'Payment processing will be handled manually.'}`)
    
    // Reset
    setShowCheckout(false)
    setFormData({
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      size: '',
      paymentMethod: 'card'
    })
  }

  const calculateHBARPrice = (usdPrice: number) => {
    // Mock conversion rate - you'll want to use real-time rates
    const hbarRate = 0.05 // $0.05 per HBAR
    return Math.ceil(usdPrice / hbarRate)
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

        {/* Navigation */}
        <nav className="relative flex justify-between items-center px-4 py-5 z-10">
          <style>{`
            @media (min-width: 768px) {
              nav { padding-left: 76.5px !important; padding-right: 60px !important; }
            }
          `}</style>
          <div className="flex items-center md:mt-[4px]">
            <a href="/home">
              <img src="/Assets/SPLAT.png" alt="SLIME" className="h-auto w-10 md:w-12" />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10" style={{ marginTop: '4px' }}>
            <div className="flex gap-10 text-sm font-medium">
              <a href="https://altlantis.market/live/QQaupimisf3YogPk2hdq" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">MINT</a>
              {/* <a href="/merch" className="text-slime-green">MERCH</a> */}
              <a href="/collection" className="text-gray-300 hover:text-slime-green transition">COLLECTION</a>
            </div>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://github.com/Built-by-SLIME" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden text-gray-300 hover:text-slime-green transition z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[#2a2a2a] z-40 flex flex-col items-center justify-center">
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 text-gray-300 hover:text-slime-green transition"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-8 text-center">
              <a
                href="https://altlantis.market/live/QQaupimisf3YogPk2hdq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-slime-green transition text-2xl font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                MINT
              </a>
              <a
                href="/collection"
                className="text-gray-300 hover:text-slime-green transition text-2xl font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                COLLECTION
              </a>

              {/* Social Icons */}
              <div className="flex items-center gap-6 mt-8">
                <a href="https://github.com/Built-by-SLIME" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative py-20 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-4">SLIME MERCH</h1>
            <p className="text-gray-400 text-lg mb-8">Rep the collective. Wear the SLIME.</p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10 px-8 pb-20 bg-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all"
              >
                <div className="aspect-square bg-[#252525] p-8 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                    <p className="text-gray-400 text-sm">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <div className="text-2xl font-black text-slime-green">${product.price}</div>
                      <div className="text-xs text-gray-500">~{calculateHBARPrice(product.price)} HBAR</div>
                    </div>
                    <button
                      onClick={() => handleBuyNow(product)}
                      className="bg-slime-green text-black px-6 py-3 rounded-md font-bold text-sm hover:bg-[#00cc33] transition"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f1f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-[#1f1f1f] z-10">
              <h2 className="text-2xl font-black">CHECKOUT</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
              {/* Product Summary */}
              <div className="bg-[#252525] rounded-lg p-4 border border-gray-700">
                <div className="flex gap-4">
                  <img src={selectedProduct.image} alt={selectedProduct.title} className="w-20 h-20 object-contain" />
                  <div className="flex-1">
                    <h3 className="font-bold">{selectedProduct.title}</h3>
                    <p className="text-sm text-gray-400">{selectedProduct.description}</p>
                    <p className="text-slime-green font-bold mt-2">${selectedProduct.price}</p>
                  </div>
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-bold mb-2">SIZE *</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#252525] border border-gray-700 rounded-md px-4 py-3 text-white focus:border-slime-green focus:outline-none"
                >
                  <option value="">Select size</option>
                  {selectedProduct.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title}
                    </option>
                  ))}
                </select>
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
                    HBAR ({calculateHBARPrice(selectedProduct.price)} HBAR)
                  </button>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">SHIPPING INFORMATION</h3>
                
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

              {/* Crypto Payment Instructions */}
              {formData.paymentMethod === 'crypto' && (
                <div className="bg-slime-green/10 border border-slime-green rounded-lg p-4">
                  <h4 className="font-bold text-slime-green mb-2">HBAR PAYMENT INSTRUCTIONS</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    After submitting this order, you'll receive an email with our HBAR wallet address and order details.
                    Send exactly <span className="font-bold text-slime-green">{calculateHBARPrice(selectedProduct.price)} HBAR</span> to complete your purchase.
                  </p>
                  <p className="text-xs text-gray-400">
                    Orders will be processed manually once payment is confirmed on the Hedera network.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition"
              >
                {formData.paymentMethod === 'crypto' ? 'SUBMIT ORDER (PAY WITH HBAR)' : 'SUBMIT ORDER'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}

