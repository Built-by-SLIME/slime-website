export default function WhatIsSlime() {
  return (
    <section id="about" className="pt-16 md:pt-64 pb-20 px-8 bg-[#2a2a2a]">
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
              One part development group, one part community DAO, one part NFT project - SLIME exists to train new builders, ship open-source solutions, and partner with every corner of Hedera to lift the whole ecosystem higher, together.
            </p>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              Hold a SLIME NFT to stake for your equal slice of HBAR rewards (treasury adds 100+ SLIME per epoch, takes zero cut). No gatekeepers, no middlemen—just open code, open collaboration, and shared upside for everyone who holds SLIME.
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

