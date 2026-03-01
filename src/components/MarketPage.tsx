import Navigation from './Navigation'

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">SLIME MARKET</h1>
        <p className="text-gray-500 text-sm">Coming soon.</p>
      </main>
    </div>
  )
}
