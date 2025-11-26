import { useCart } from '../context/CartContext'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export default function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-2 border-slime-green rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg md:text-2xl font-bold">
            SHOPPING CART ({getTotalItems()} {getTotalItems() === 1 ? 'ITEM' : 'ITEMS'})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-400 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="bg-[#252525] rounded-lg p-3 md:p-4"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex gap-3 mb-3">
                      {/* Product Image */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-contain bg-[#1a1a1a] rounded flex-shrink-0"
                      />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm mb-1 truncate">{item.title}</h3>
                        <p className="text-gray-400 text-xs mb-1 truncate">{item.variantTitle}</p>
                        <p className="text-slime-green font-bold text-sm">${item.price.toFixed(2)}</p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-gray-400 hover:text-red-500 transition self-start"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity Controls & Subtotal */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-8 h-8 bg-[#1a1a1a] hover:bg-slime-green hover:text-black rounded transition font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-8 h-8 bg-[#1a1a1a] hover:bg-slime-green hover:text-black rounded transition font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Subtotal: <span className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex gap-4">
                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 object-contain bg-[#1a1a1a] rounded"
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{item.variantTitle}</p>
                      <p className="text-slime-green font-bold">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-gray-400 hover:text-red-500 transition"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-8 h-8 bg-[#1a1a1a] hover:bg-slime-green hover:text-black rounded transition font-bold"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-8 h-8 bg-[#1a1a1a] hover:bg-slime-green hover:text-black rounded transition font-bold"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm text-gray-400">
                        Subtotal: <span className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg md:text-xl font-bold">TOTAL:</span>
              <span className="text-2xl md:text-3xl font-black text-slime-green">${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 text-white px-4 md:px-6 py-3 rounded-md font-bold hover:bg-gray-600 transition text-sm md:text-base"
              >
                CONTINUE SHOPPING
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 bg-slime-green text-black px-4 md:px-6 py-3 rounded-md font-bold hover:bg-[#00cc33] transition text-sm md:text-base"
              >
                CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

