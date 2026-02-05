import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'

// Lazy load all routes for code splitting
const GooeyLanding = lazy(() => import('./components/GooeyLanding'))
const HomePage = lazy(() => import('./components/HomePage'))
const MerchPage = lazy(() => import('./components/MerchPage'))
const CollectionPage = lazy(() => import('./components/CollectionPage'))
const SwapPage = lazy(() => import('./components/SwapPage'))
const RarityTestPage = lazy(() => import('./components/RarityTestPage'))

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slime-green"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<GooeyLanding />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/merch" element={<MerchPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/rarity-test" element={<RarityTestPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
