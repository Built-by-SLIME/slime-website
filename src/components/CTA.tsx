export default function CTA() {
  return (
    <section className="py-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-slime-green/10 to-slime-green/5 rounded-2xl p-8 md:p-12 border border-slime-green/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left - Image */}
            <div className="flex justify-center">
              <img
                src="/Assets/slimelogonft.png"
                alt="Join SLIME"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {/* Right - Content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
                JOIN SLIME
              </h2>
              <p className="text-gray-400 text-base md:text-lg">
                Join our growing community of SLIME enthusiasts. Get early access to drops,
                exclusive perks, and be part of something special.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="bg-slime-green text-black px-8 py-3 rounded-md font-bold text-sm md:text-base hover:bg-[#00cc33] transition text-center">
                  JOIN DISCORD
                </a>
                <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="border-2 border-slime-green text-slime-green px-8 py-3 rounded-md font-bold text-sm md:text-base hover:bg-slime-green hover:text-black transition text-center">
                  FOLLOW ON X
                </a>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 md:gap-6">
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slime-green">5+</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">REPOSITORIES</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slime-green">75+</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">HOLDERS</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slime-green">1K+</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">X FOLLOWERS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

