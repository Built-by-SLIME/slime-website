export default function WhatIsSlime() {
  return (
    <section id="about" className="pt-64 pb-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <div className="flex justify-center">
            <img
              src="/Assets/slime3.png"
              alt="SLIME Character"
              className="w-72 h-72 md:w-96 md:h-96 object-contain"
            />
          </div>

          {/* Right - Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-black">WHAT IS SLIME?</h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              SLIME is a development collective focused on shipping production-grade FOSS to Hedera. We scout raw talent, mentor them in public, and pay in HBAR the moment code ships. Hold a SLIME NFT to stake for equal-split HBAR rewards (treasury adds 100 extra SLIME per epoch, takes zero cut). Staking also unlocks the RFC Board - live tasks with fat HBAR pools. Build a solution, submit a PR, let the DAO vote. Win? Your code ships, your wallet fills, your rep levels up. No gatekeepers. Just open code, open bounties, and open rewards.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-slime-green">5K</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">TOTAL SUPPLY</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-slime-green">77+</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">TRAITS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-slime-green">∞</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">POSSIBILITIES</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

