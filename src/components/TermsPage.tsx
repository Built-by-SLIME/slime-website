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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      <Navigation />

      <main className="py-20 px-4 md:px-8 flex-grow">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Legal</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">TERMS OF SERVICE</h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed">
              Last updated: May 2025
            </p>
          </div>

          <Section title="ACCEPTANCE OF TERMS">
            <p>
              By accessing or using the SLIME dApp at <span className="text-white font-semibold">slimeonhedera.com</span>{' '}
              ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not
              use the Platform.
            </p>
          </Section>

          <Section title="WHAT THE PLATFORM IS">
            <p>
              The SLIME dApp is a decentralized application built on the Hedera Hashgraph. It allows users to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>View and explore the SLIME NFT collection</li>
              <li>Buy, sell, and trade SLIME NFTs via the SentX marketplace integration</li>
              <li>Manage their SLIME NFT inventory and $SLIME token balance</li>
              <li>Participate in the community leaderboard via X (Twitter) OAuth</li>
            </ul>
          </Section>

          <Section title="ELIGIBILITY">
            <p>
              You must be of legal age in your jurisdiction to use this Platform. By using the Platform, you
              represent that you meet this requirement and that your use complies with all applicable local laws
              and regulations.
            </p>
          </Section>

          <Section title="NFT OWNERSHIP & IP RIGHTS">
            <p>
              When you purchase a SLIME NFT, you receive full commercial intellectual property rights to that
              specific NFT's artwork. You may use your SLIME NFT for personal projects, merchandise, branding,
              and commercial purposes.
            </p>
            <p>
              You do <span className="text-white font-semibold">not</span> acquire rights to the SLIME brand name,
              overall collection trademarks, or any NFTs you do not own.
            </p>
          </Section>

          <Section title="NO FINANCIAL ADVICE">
            <p>
              Nothing on this Platform constitutes financial, investment, legal, or tax advice. NFTs and digital
              tokens are volatile assets. You are solely responsible for your own investment decisions. Past
              performance is not indicative of future results.
            </p>
          </Section>

          <Section title="WALLET & TRANSACTIONS">
            <p>
              You are solely responsible for the security of your Hedera wallet and private keys. All on-chain
              transactions are final and irreversible. We are not liable for any losses arising from lost wallet
              access, failed transactions, or errors in transaction details you provide.
            </p>
          </Section>

          <Section title="LEADERBOARD & X OAUTH">
            <p>
              By connecting your X (Twitter) account, you authorize us to read your X username and user ID for
              leaderboard display purposes only. You may disconnect your X account at any time. See our{' '}
              <a href="/privacy" className="text-slime-green hover:underline">Privacy Policy</a> for full details
              on data handling.
            </p>
          </Section>

          <Section title="THIRD-PARTY SERVICES">
            <p>
              The Platform integrates with third-party services including SentX, Hedera Hashgraph, and X (Twitter).
              We are not responsible for the availability, accuracy, or conduct of these services. Their own
              terms and policies apply to your use of them.
            </p>
          </Section>

          <Section title="DISCLAIMER OF WARRANTIES">
            <p>
              The Platform is provided "as is" and "as available" without warranties of any kind. We do not
              guarantee uninterrupted access, error-free operation, or that the Platform will meet your
              requirements.
            </p>
          </Section>

          <Section title="LIMITATION OF LIABILITY">
            <p>
              To the maximum extent permitted by law, SLIME on Hedera and its contributors shall not be liable
              for any indirect, incidental, special, or consequential damages arising from your use of the
              Platform, including but not limited to loss of funds, NFTs, or data.
            </p>
          </Section>

          <Section title="CHANGES TO THESE TERMS">
            <p>
              We may update these Terms of Service at any time. Changes will be reflected by the "Last updated"
              date above. Continued use of the Platform after changes constitutes acceptance of the revised terms.
            </p>
          </Section>

          <Section title="CONTACT">
            <p>
              For questions about these Terms, reach out via X at{' '}
              <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">@builtbyslime</a>.
            </p>
          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
