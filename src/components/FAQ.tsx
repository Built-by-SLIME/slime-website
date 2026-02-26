import React, { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: { question: string; answer: React.ReactNode }[] = [
    {
      question: "WHAT IS SLIME?",
      answer: "Focused on Hedera - SLIME is one part development collective, one part community DAO, and one part NFT project. We support the network by training new builders, shipping FOSS, and partnering with other Hedera projects - lifting everyone higher, together."
    },
    {
      question: "HOW DO I GET A SLIME?",
      answer: "You can mint a SLIME on Altlantis market - or you can purchase a SLIME off secondary through SentX - in the future we will integrate native minting solutions"
    },
    {
      question: "WHAT ARE THE BENEFITS OF OWNING A SLIME?",
      answer: "You can stake your SLIME to earn HBAR rewards, unlock complete creator tools, and gain access to the SLIME DAO"
    },
    {
      question: "WHEN IS THE MINT DATE?",
      answer: <>We are currently minting on SentX! <a href="https://sentx.io/launchpad/slime-public?filter=all" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">Click here to mint!</a></>
    },
    {
      question: "WHAT IS THE MINT PRICE?",
      answer: "200 HBAR"
    }
  ]

  return (
    <section id="faq" className="py-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-4">FAQ's</h2>
        <p className="text-gray-400 text-center mb-12 text-sm md:text-base">Everything you need to know about SLIME</p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green/50 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 md:px-8 py-5 md:py-6 flex justify-between items-center text-left"
              >
                <h3 className="text-base md:text-lg font-bold pr-4">{faq.question}</h3>
                <div className={`text-slime-green text-2xl transition-transform flex-shrink-0 ${
                  openIndex === index ? 'rotate-45' : ''
                }`}>
                  +
                </div>
              </button>

              {openIndex === index && (
                <div className="px-6 md:px-8 pb-5 md:pb-6">
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

