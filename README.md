# SLIME Website

Official website for SLIME - a development collective dedicated to delivering production-grade FOSS to the Hedera ecosystem.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_SENTX_API_KEY` - Your SentX API key (get from https://sentx.io)
- `VITE_SLIME_TOKEN_ID` - SLIME NFT collection token ID (default: 0.0.9474754)

### Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build

```bash
npm run build
```

## 📦 Deployment to Vercel

### Environment Variables on Vercel

Add the following environment variables in your Vercel project settings:

1. Go to your Vercel project → Settings → Environment Variables
2. Add these variables:
   - `VITE_SENTX_API_KEY` = `your_sentx_api_key`
   - `VITE_SLIME_TOKEN_ID` = `0.0.9474754`

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **WebGL** - Gooey slime animation
- **SentX API** - NFT marketplace integration

## 📄 License

MIT

## 🔗 Links

- [GitHub](https://github.com/Built-by-SLIME)
- [Discord](https://discord.gg/8X9PvNFyzK)
- [X (Twitter)](https://x.com/builtbyslime)
