export default function RoadMap() {
  const roadmapItems = [
    {
      phase: "PHASE 1",
      title: "GENESIS MINT",
      description: "Mint the initial 1,000 of our 5,000-piece collection, on the Hedera Hashgraph",
      status: "COMPLETE"
    },
    {
      phase: "PHASE 2",
      title: "STRATEGIC PARTNERSHIPS",
      description: "Forge strategic partnerships with developers, project leads, and ecosystem contributors to accelerate growth",
      status: "COMPLETE"
    },
    {
      phase: "PHASE 3",
      title: "SHIP FOSS",
      description: "Ship code and establish strategic partnerships with developers and project leads",
      status: "COMPLETE"
    },
    {
      phase: "PHASE 4",
      title: "SLIME TOOLS",
      description: "A powerful suite of free tools to build, create, and thrive on Hedera.",
      status: "COMPLETE"
    },
    {
      phase: "PHASE 5",
      title: "SLIME DAPP",
      description: "Deploy the dApp: Stake your SLIME, claim rewards, build your profile, & register domains",
      status: "IN PROGRESS"
    },
    {
      phase: "PHASE 6",
      title: "SLIME DAO",
      description: "Launch the SLIME DAO to decentralize development: every PR goes to vote, DAO holders crown the winner",
      status: "UPCOMING"
    },
    {
      phase: "PHASE 7",
      title: "INTEGRATED WALLET",
      description: "Integrated wallet to our toolkit supporting or a seamless creator experience with retail NFTs and tokens",
      status: "UPCOMING"
    }
  ]

  return (
    <section id="roadmap" className="py-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-4">ROADMAP</h2>
        <p className="text-gray-400 text-center mb-16 text-sm md:text-base">What's next for SLIME</p>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slime-green/20 hidden md:block"></div>

          <div className="space-y-6">
            {roadmapItems.map((item, index) => (
              <div key={index} className="relative flex gap-6 items-start">
                {/* Timeline Dot */}
                <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-[#2a2a2a] border-4 border-slime-green flex-shrink-0 z-10">
                  <div className={`w-5 h-5 rounded-full ${
                    item.status === 'COMPLETE' ? 'bg-slime-green' :
                    item.status === 'IN PROGRESS' ? 'bg-slime-green/50 animate-pulse' :
                    'bg-gray-700'
                  }`}></div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-[#1f1f1f] rounded-xl p-6 md:p-8 border border-gray-700 hover:border-slime-green/50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-slime-green text-xs font-bold mb-2">{item.phase}</div>
                      <h3 className="text-xl md:text-2xl font-black">{item.title}</h3>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      item.status === 'COMPLETE' ? 'bg-slime-green/20 text-slime-green' :
                      item.status === 'IN PROGRESS' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-700/50 text-gray-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm md:text-base">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

