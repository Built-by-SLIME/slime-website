import Navigation from './Navigation'
import Footer from './Footer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <div className="bg-[#1f1f1f] border border-gray-800 rounded-2xl p-6 space-y-4 text-gray-300 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      <Navigation />

      <main className="py-20 px-4 md:px-8 flex-grow">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Legal</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">PRIVACY POLICY</h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed">
              Last updated: May 2025
            </p>
          </div>

          <Section title="OVERVIEW">
            <p>
              SLIME on Hedera ("we", "us", or "our") operates the SLIME dApp available at{' '}
              <span className="text-white font-semibold">slimeonhedera.com</span>. We are committed to transparency
              about what data we collect and why. This policy explains our practices clearly and in plain language.
            </p>
            <p>
              We do not sell, rent, or share your personal data with third parties for advertising or marketing purposes.
            </p>
          </Section>

          <Section title="DATA WE COLLECT">
            <p>We collect only the minimum data required to operate our leaderboard feature:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><span className="text-white font-semibold">X (Twitter) Username & User ID</span> — collected via X OAuth when you choose to connect your X account.</li>
              <li><span className="text-white font-semibold">Hedera Wallet Address</span> — collected when you connect a compatible Hedera wallet to the dApp.</li>
            </ul>
            <p className="mt-2">
              This data is used solely to associate your on-chain activity with your X identity for leaderboard display purposes.
            </p>
          </Section>

          <Section title="DATA WE DO NOT COLLECT">
            <p>We do <span className="text-white font-semibold">not</span> collect:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Email addresses</li>
              <li>Names or physical addresses</li>
              <li>Payment information</li>
              <li>Browser fingerprints or tracking cookies</li>
              <li>Any data beyond what is listed above</li>
            </ul>
          </Section>

          <Section title="HOW WE USE YOUR DATA">
            <p>The X username/ID and wallet address you provide are used exclusively to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Display your identity on the SLIME community leaderboard</li>
              <li>Associate on-chain NFT and token activity with your X profile</li>
            </ul>
            <p>We do not use this data for any other purpose.</p>
          </Section>

          <Section title="DATA STORAGE & HOSTING">
            <p>
              The SLIME dApp is hosted on <span className="text-white font-semibold">Vercel</span>. Data associated
              with leaderboard participation may be stored in a secure database. We follow industry-standard
              practices to protect stored data from unauthorized access.
            </p>
          </Section>

          <Section title="YOUR RIGHTS">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Request deletion of your data at any time</li>
              <li>Opt out of leaderboard participation</li>
              <li>Disconnect your X account or wallet from our platform at any time</li>
            </ul>
            <p>
              To exercise any of these rights, contact us via our official X account{' '}
              <a href="https://x.com/SLIMEonHedera" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">@SLIMEonHedera</a>.
            </p>
          </Section>

          <Section title="THIRD-PARTY SERVICES">
            <p>
              Our dApp interacts with third-party services including the Hedera Hashgraph network, SentX marketplace,
              and X (Twitter) OAuth. These services operate under their own privacy policies, which we encourage
              you to review.
            </p>
          </Section>

          <Section title="CHANGES TO THIS POLICY">
            <p>
              We may update this Privacy Policy from time to time. Changes will be reflected by updating the
              "Last updated" date at the top of this page. Continued use of the dApp after changes constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="CONTACT">
            <p>
              For any privacy-related questions, reach out to us on X at{' '}
              <a href="https://x.com/SLIMEonHedera" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">@SLIMEonHedera</a>.
            </p>
          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
