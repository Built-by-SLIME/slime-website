export default function MeetTheSlime() {
  const slimes = [
    { id: 1, image: "/Assets/slime1.png" },
    { id: 2, image: "/Assets/slime2.png" },
    { id: 3, image: "/Assets/slime3.png" },
    { id: 4, image: "/Assets/slime4.png" },
    { id: 5, image: "/Assets/slime5.png" },
    { id: 6, image: "/Assets/slime6.png" }
  ]

  return (
    <section className="py-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Featured SLIME */}
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="/Assets/slime1.png" 
                alt="Featured SLIME"
                className="w-96 h-96 object-contain"
              />
              <div className="absolute -bottom-4 -right-4 bg-slime-green text-black px-6 py-3 rounded-full font-bold text-xl">
                #1337
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">MEET THE SLIME!</h2>
              <p className="text-gray-400 text-base md:text-lg">
                Each SLIME is unique with its own combination of traits, accessories, and personality.
                Discover the rarest SLIMEs in the collection.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1f1f1f] rounded-lg p-4 md:p-6 border border-gray-700">
                <div className="text-2xl md:text-3xl font-black text-slime-green mb-1">85%</div>
                <div className="text-xs text-gray-500 font-medium">RARITY SCORE</div>
              </div>
              <div className="bg-[#1f1f1f] rounded-lg p-4 md:p-6 border border-gray-700">
                <div className="text-2xl md:text-3xl font-black text-slime-green mb-1">12</div>
                <div className="text-xs text-gray-500 font-medium">TRAITS</div>
              </div>
              <div className="bg-[#1f1f1f] rounded-lg p-4 md:p-6 border border-gray-700">
                <div className="text-2xl md:text-3xl font-black text-slime-green mb-1">TOP 5%</div>
                <div className="text-xs text-gray-500 font-medium">RANKING</div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-4">EXPLORE THE COLLECTION</h3>
              <div className="grid grid-cols-6 gap-2 md:gap-3">
                {slimes.map((slime) => (
                  <div
                    key={slime.id}
                    className="aspect-square bg-[#1f1f1f] rounded-lg p-2 border border-gray-700 hover:border-slime-green transition cursor-pointer"
                  >
                    <img
                      src={slime.image}
                      alt={`SLIME ${slime.id}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button className="bg-slime-green text-black px-8 py-3 md:py-4 rounded-md font-bold text-sm md:text-base hover:bg-[#00cc33] transition">
              VIEW FULL COLLECTION
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

