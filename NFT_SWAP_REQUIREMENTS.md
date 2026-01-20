# NFT Swap Tool - Requirements & Implementation Plan

## Project Overview
Build a swap/migration tool for Hedera NFT collections where users can exchange old NFTs (without royalties) for new NFTs (with royalties).

---

## User Requirements

### Collection Details
- **Old Collection:** Token ID needed (no royalties)
- **New Collection:** Token ID needed (with royalties) - will be created via script
- **Swap Ratio:** 1:1 (same serial number, same traits/rarity)
- **Blackhole Wallet:** Address needed for old NFTs

### Tech Stack
- **SDK:** Hiero SDK (`@hiero-ledger/sdk`) - NOT Hedera SDK (being sunset)
- **Wallet Connection:** WalletConnect (supports HashPack & Kabila wallets)
- **Frontend:** React page at `/swap`
- **Backend:** Vercel serverless functions

### Authentication
- **Private Keys:** User will provide treasury wallet private keys for new collection
- **Old Collection:** No keys needed (users own their NFTs)

---

## Swap Flow

### User Journey
1. User connects wallet (HashPack or Kabila via WalletConnect)
2. User sees their old NFTs from the collection
3. User selects which NFTs to swap
4. User approves allowance for old NFTs
5. Backend transfers old NFTs to blackhole wallet
6. Backend transfers corresponding new NFTs (same serial #) to user
7. Swap complete!

---

## Technical Implementation

### Hiero SDK Documentation
- **GitHub:** https://github.com/hiero-ledger/hiero-sdk-js
- **NPM Package:** `@hiero-ledger/sdk` (v2.70.0+)
- **Docs:** https://docs.hedera.com/guides/docs/sdks
- **JSDoc:** https://hiero-ledger.github.io/hiero-sdk-js/

### Key SDK Classes Needed

#### NFT Operations
```javascript
import {
    Client,
    PrivateKey,
    AccountId,
    NftId,
    TokenId,
    TransactionId,
    TransferTransaction,
    AccountAllowanceApproveTransaction,
    AccountAllowanceDeleteTransaction,
    TokenAssociateTransaction,
} from "@hiero-ledger/sdk";
```

#### Wallet Connection
- Use WalletConnect v2 for Hedera
- Supports HashPack and Kabila wallets
- User signs transactions client-side

---

## Implementation Steps

### Phase 1: Setup & Research
- [x] Research Hiero SDK documentation
- [ ] Install Hiero SDK: `npm install @hiero-ledger/sdk`
- [ ] Set up WalletConnect for Hedera
- [ ] Get collection token IDs from user
- [ ] Get blackhole wallet address
- [ ] Get treasury wallet private keys for new collection

### Phase 2: Frontend Development
- [ ] Create `/swap` page component
- [ ] Add WalletConnect integration
- [ ] Display user's old NFTs (query via Mirror Node API)
- [ ] Add NFT selection UI
- [ ] Add swap confirmation modal
- [ ] Add transaction status tracking

### Phase 3: Backend Development
- [ ] Create `/api/swap-nft` serverless function
- [ ] Implement allowance approval logic
- [ ] Implement old NFT → blackhole transfer
- [ ] Implement new NFT → user transfer
- [ ] Add error handling & rollback logic
- [ ] Add transaction logging

### Phase 4: Testing
- [ ] Test on Hedera Testnet
- [ ] Test with multiple NFTs
- [ ] Test error scenarios (insufficient balance, failed transfers)
- [ ] Test wallet connection/disconnection
- [ ] Security audit

### Phase 5: Deployment
- [ ] Deploy to production
- [ ] Monitor transactions
- [ ] Provide user support

---

## Key SDK Operations

### 1. Approve Allowance (User Signs)
```javascript
const approveTx = new AccountAllowanceApproveTransaction()
    .approveTokenNftAllowance(
        new NftId(oldTokenId, serialNumber),
        userAccountId,
        treasuryAccountId // spender
    );

const signedTx = await approveTx.sign(userPrivateKey);
const receipt = await signedTx.execute(client);
```

### 2. Transfer Old NFT to Blackhole (Backend)
```javascript
const transferOldTx = new TransferTransaction()
    .addApprovedNftTransfer(
        new NftId(oldTokenId, serialNumber),
        userAccountId,
        blackholeAccountId
    )
    .setTransactionId(TransactionId.generate(treasuryAccountId));

const signedTx = await transferOldTx.sign(treasuryPrivateKey);
const receipt = await signedTx.execute(client);
```

### 3. Transfer New NFT to User (Backend)
```javascript
const transferNewTx = new TransferTransaction()
    .addNftTransfer(
        new NftId(newTokenId, serialNumber),
        treasuryAccountId,
        userAccountId
    );

const signedTx = await transferNewTx.sign(treasuryPrivateKey);
const receipt = await signedTx.execute(client);
```

---

## Environment Variables Needed

```env
# Hedera Network
HEDERA_NETWORK=mainnet  # or testnet

# Treasury Wallet (holds new NFTs)
TREASURY_ACCOUNT_ID=0.0.xxxxx
TREASURY_PRIVATE_KEY=302e...

# Collection Details
OLD_TOKEN_ID=0.0.xxxxx
NEW_TOKEN_ID=0.0.xxxxx
BLACKHOLE_ACCOUNT_ID=0.0.xxxxx

# WalletConnect
WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## Next Steps

**Waiting on from user:**
1. Old collection token ID
2. New collection token ID (after creation)
3. Blackhole wallet address
4. Treasury wallet private keys for new collection
5. WalletConnect project ID (if not already set up)

**Ready to start when you provide the above!** 🚀

---

**Last Updated:** 2024-11-26

