import Hero from './Hero'
import WhatIsSlime from './WhereIsSlime'
import HotNFTs from './HotNFTs'
import RoadMap from './RoadMap'
import FAQ from './FAQ'
import CTA from './CTA'
import Footer from './Footer'

function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Hero />
      <WhatIsSlime />
      <RoadMap />
      <HotNFTs />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}

export default HomePage

