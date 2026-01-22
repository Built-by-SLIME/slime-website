import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GooeyLanding from './components/GooeyLanding'
import HomePage from './components/HomePage'
import MerchPage from './components/MerchPage'
import CollectionPage from './components/CollectionPage'
import SwapPage from './components/SwapPage'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GooeyLanding />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/merch" element={<MerchPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/swap" element={<SwapPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
