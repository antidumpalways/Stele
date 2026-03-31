# STELE: Immutable Witness Protocol

> *"Only verified humans can inscribe truth onto the permanent record."*

[![World Chain Sepolia](https://img.shields.io/badge/World%20Chain-Sepolia%20Testnet-7c3aed)](https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6)
[![IPFS via Storacha](https://img.shields.io/badge/Storage-Storacha%20%2F%20IPFS%20%2F%20Filecoin-blue)](https://storacha.network)
[![World ID](https://img.shields.io/badge/Identity-World%20ID%20v4-black)](https://developer.world.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What is STELE?

STELE is a **censorship-proof journalism protocol** built for the Protocol Labs x World hackathon. It binds three primitives into a single tamper-evident record:

| Pillar | Technology | Purpose |
|--------|-----------|---------|
| **WHO** | World ID (biometric proof) | Proves the author is a real, unique human |
| **WHAT** | SHA-256 content hash | Any pixel changed means proof invalid |
| **WHERE** | Storacha / IPFS / Filecoin | Permanently stored, no server to seize |
| **CHAIN** | World Chain smart contract | On-chain anchor that can never be altered |

Every story is permanently linked to a real human. No bots. No fake witnesses. No central server to take down.

---

## Live Demo

| | |
|---|---|
| **App** | https://stele.replit.app](https://stelexprotocollabs.fun |
| **Contract** | [`0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6`](https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6) |
| **Network** | World Chain Sepolia (chainId: 4801) |
| **IPFS Gateway** | https://w3s.link/ipfs |
| **Deploy Tx** | `0xf825e6c954922744a5875a6981930abf6efaa5f605ca96d0a17e20ddaa42f3d6` |

---

## Hackathon Targets

| Prize | Track | Amount |
|-------|-------|--------|
| World Build 3 | Sybil-Proof Social Graph | $5,000 |
| Storacha Sponsor Prize | Decentralized Storage | $500 |
| Infrastructure and Digital Rights | Censorship-Resistant Infra | $6,000 |

---

## Why STELE?

Existing journalism platforms trust **institutions**: editors, servers, cloud providers. Institutions can be pressured, hacked, or taken offline.

STELE trusts **cryptography**:

- A journalist's identity is their World ID nullifier, not their name or account
- Their content is their SHA-256 hash, not a URL that can be replaced
- Their story lives on IPFS and World Chain, not on a server that can be seized

The SHA-256 content hash **is** the World ID verification signal. This creates an atomic, unbreakable binding between WHO published it and WHAT was published. Change one byte of the content and the entire proof chain collapses.

---

## How It Works

```
  Browser
  --------
  1. Journalist uploads evidence files (photos, documents)
  2. SHA-256 hash computed in-browser (WebCrypto API) — before any upload
  3. ELA (Error Level Analysis) runs for tamper detection
  4. GPS / IP geolocation captured at city level (privacy-preserving)
  5. AI auto-fills title, excerpt, category (Claude Vision)

       |
       v

  World ID Verification (IDKit v4)
  ---------------------------------
  - Signal = SHA-256 hash (atomic binding: WHO + WHAT in one proof)
  - RP-signed context: backend signs (appId + action + signal)
  - QR code for desktop / deep link inside World App
  - Server verifies proof against developer.world.org
  - Returns: nullifier_hash + verification_level (orb / device)

       |
       v

  Storacha Upload (UCAN-delegated)
  ---------------------------------
  - Server issues scoped UCAN token to browser agent DID
  - Browser uploads directly: evidence/ + metadata.json packaged as CAR
  - Returns IPFS CID (content-addressed, permanent)
  - Pinata backup pin fired (fire-and-forget, redundancy layer)

       |
       v

  World Chain Anchor
  -------------------
  - inscribe(contentHash, nullifierHash, ipfsCid, verificationTier)
  - Fire-and-forget: does not block the user
  - Uniqueness enforced per contentHash (same story cannot be anchored twice)
  - Returns on-chain tx hash, linked from every card

       |
       v

  Public Feed
  ------------
  - Any visitor can re-fetch from IPFS and re-hash in-browser
  - Match = "TRUE HUMAN WITNESS" / Mismatch = tampered content detected
  - Vouch (World ID required): +10 pts Orb / +1 pt Device
  - Flag (World ID required): 5 flags + majority = DISPUTED
  - Every action permanently recorded on World Chain
```

---

## Features

### Core Inscription Engine
- **SHA-256 hashing** computed in-browser before upload using WebCrypto API
- **World ID signal binding**: the content hash is the verification signal, creating an atomic WHO+WHAT link
- **UCAN-delegated upload**: browser uploads directly to Storacha without the server touching the files
- **Pinata backup pin**: every CID pinned to Pinata for long-term availability

### World ID Integration (v4)
- `IDKitRequestWidget` with `deviceLegacy` preset and full RP context signing
- Server-side proof verification against `developer.world.org/api/v4/verify`
- Both **Orb** (biometric iris scan) and **Device** (phone-based) verification supported
- Orb vouches weighted 10x in consensus scoring
- MiniKit native verification when running inside World App (no QR needed)

### Smart Contract: InscriptionRegistry.sol

Deployed on World Chain Sepolia at `0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6`.

```solidity
// Publish a story — unique per SHA-256 hash
function inscribe(
    bytes32 contentHash,       // SHA-256 of evidence
    bytes32 nullifierHash,     // World ID proof of humanity
    string calldata ipfsCid,
    string calldata verificationTier
) external returns (uint256 id)

// Vouch for a story — 1 human = 1 vouch per story (on-chain)
function vouch(
    bytes32 inscriptionContentHash,
    bytes32 nullifierHash,
    string calldata verificationTier
) external returns (uint256 id)

// Flag a story as disputed — 1 human = 1 flag per story (on-chain)
function flag(
    bytes32 inscriptionContentHash,
    bytes32 nullifierHash
) external returns (uint256 id)
```

Every social action (publish, vouch, flag) is permanently recorded on World Chain with its own transaction hash.

### ELA: Error Level Analysis
- Browser-side pixel manipulation detector using Canvas API
- Compares original vs re-compressed JPEG to detect edits
- Score 0-100: `AUTHENTIC` (< 25), `SUSPECT` (25-54), `TAMPERED` (55+)
- Score stored with each inscription for full transparency

### AI Auto-Fill (Claude Vision)
- One-click metadata generation from uploaded images
- Produces: title, excerpt, location, category
- Rate limited: 10 requests / 15 min per IP

### Geolocation (Privacy-Preserving)
- Captures city/country only, never exact GPS coordinates
- GPS first (browser Geolocation API + OpenStreetMap reverse geocode)
- Falls back to IP-based (ipapi.co) if GPS is denied

### Consensus System
- **Vouch**: World ID-verified users vouch for inscriptions (1 per user per inscription)
  - Orb = +10 pts, Device = +1 pt
- **Verified**: net score >= 3 earns a green VERIFIED badge
- **Flag**: World ID-verified users can dispute inscriptions (1 per user)
- **Disputed**: flag count >= 5 AND flags outnumber vouches
- Orb vouchers are strong defenders: one Orb vouch requires 10 flags to overcome

### Inspect and Verify
- Any visitor can inspect any inscription at any time
- Re-fetches evidence from IPFS across 5 gateways with automatic fallback
- Recomputes SHA-256 hash in-browser
- Match = `TRUE HUMAN WITNESS` / Mismatch = tampered content detected

### MiniKit (World App Native)
- `@worldcoin/minikit-js` integrated
- When opened inside World App via deep link: native biometric verification with no QR code
- Falls back to IDKit QR widget in regular browsers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (Radix UI), Framer Motion |
| Data Fetching | TanStack Query v5 |
| Backend | Express 4, Node.js 22 |
| Database | SQLite (better-sqlite3) |
| Identity | World ID v4 (IDKit + RP Signing + MiniKit) |
| Storage | Storacha (w3up client) via IPFS / Filecoin |
| Backup Storage | Pinata (pinByHash API) |
| Blockchain | World Chain Sepolia (ethers.js v6) |
| Smart Contract | Solidity 0.8.24 |
| AI | Anthropic Claude claude-3-5-sonnet (vision) |

---

## Project Structure

```
stele/
├── src/                           # Frontend (React + Vite)
│   ├── pages/
│   │   ├── Index.tsx              # Landing page with hero and live stats
│   │   ├── Feed.tsx               # Browse inscriptions (filter, vouch, flag, inspect)
│   │   ├── Publish.tsx            # Full inscription creation flow
│   │   └── Network.tsx            # Storacha and World Chain live stats
│   ├── components/
│   │   ├── SteleCard.tsx          # Inscription card (inspect, vouch, flag, chain verify)
│   │   ├── HeroSection.tsx        # Landing hero + live network stats strip
│   │   ├── StorageNetwork.tsx     # Storacha network status component
│   │   ├── Navbar.tsx             # Floating pill navbar with dark/light toggle
│   │   ├── SteleLogo.tsx          # Custom SVG stone-tablet logo mark
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/
│   │   └── useTheme.ts            # Dark/light theme with localStorage persistence
│   └── lib/
│       ├── api.ts                 # Backend API client and shared types
│       ├── storacha.ts            # Storacha UCAN upload client
│       ├── contentHash.ts         # SHA-256 hashing + IPFS verification
│       ├── ela.ts                 # Error Level Analysis (tamper detection)
│       ├── geolocation.ts         # GPS / IP geolocation (privacy-preserving)
│       ├── ipfs-gateways.ts       # Multi-gateway IPFS fetcher with fallback
│       ├── minikit.ts             # MiniKit World App native verification
│       └── crypto.ts              # Crypto utilities
│
├── server/                        # Backend (Express + Node.js)
│   ├── index.ts                   # Server entry point + middleware
│   ├── db.ts                      # SQLite schema + additive migrations
│   └── routes/
│       ├── inscriptions.ts        # Inscription CRUD, consensus scoring, stats
│       ├── worldchain.ts          # World Chain anchor (fire-and-forget)
│       ├── rp-signature.ts        # World ID RP context signing
│       ├── verify-proof.ts        # World ID proof server-side verification
│       ├── storacha-delegation.ts # UCAN capability token issuance
│       ├── ai-describe.ts         # AI metadata from image (Claude Vision)
│       └── pinata.ts              # Pinata backup pin
│
├── contracts/
│   └── InscriptionRegistry.sol    # World Chain smart contract
│
├── scripts/
│   ├── compile.js                 # Compile Solidity to artifacts/
│   ├── deploy.js                  # Deploy to World Chain Sepolia or Mainnet
│   └── generate-wallet.js         # Generate new deployer wallet
│
├── artifacts/                     # Compiled contract ABI + bytecode
├── data/                          # SQLite database (auto-created at runtime)
└── DEPLOYMENT.md                  # Production deployment guide
```

---

## Data Model

### `inscriptions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `cid` | TEXT UNIQUE | Storacha/IPFS Content ID |
| `title` | TEXT | Headline |
| `excerpt` | TEXT | 1-2 sentence summary |
| `location` | TEXT | City, Country |
| `category` | TEXT | Environment / Governance / Conflict / Misinformation |
| `content_hash` | TEXT | SHA-256 hex of evidence files |
| `nullifier_hash` | TEXT | World ID nullifier (sybil-resistant human identity) |
| `author_hash` | TEXT | Derived author identifier |
| `evidence_paths` | TEXT | JSON array of filenames in the CID |
| `verification_tier` | TEXT | `orb` or `device` |
| `ela_score` | REAL | Tamper detection score (0-100) |
| `flag_count` | INTEGER | Community dispute flag count |
| `world_chain_tx` | TEXT | World Chain transaction hash |
| `created_at` | TEXT | UTC datetime |

### `vouches`

| Column | Type | Description |
|--------|------|-------------|
| `inscription_id` | TEXT FK | References inscriptions.id |
| `nullifier_hash` | TEXT | 1 vouch per human per inscription |
| `tier` | TEXT | `orb` (+10 pts) or `device` (+1 pt) |

### `flags`

| Column | Type | Description |
|--------|------|-------------|
| `inscription_id` | TEXT FK | References inscriptions.id |
| `nullifier_hash` | TEXT | 1 flag per human per inscription |
| `reason` | TEXT | Optional dispute reason |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/rp-signature` | Generate World ID RP signed context |
| `POST` | `/api/verify-proof` | Server-side World ID proof verification |
| `POST` | `/api/storacha-delegation` | Issue UCAN delegation to browser DID |
| `GET` | `/api/inscriptions` | List inscriptions (supports `?category=X`) |
| `POST` | `/api/inscriptions` | Create a new inscription |
| `GET` | `/api/inscriptions/stats` | Network stats + World Chain info |
| `POST` | `/api/inscriptions/:id/vouch` | Vouch for an inscription (World ID required) |
| `POST` | `/api/inscriptions/:id/flag` | Flag / dispute an inscription (World ID required) |
| `POST` | `/api/ai-describe` | Generate metadata from image (Claude Vision) |
| `POST` | `/api/inscriptions/:id/simulate-orb-vouch` | Demo: add simulated Orb vouch |
| `POST` | `/api/inscriptions/:id/simulate-flag` | Demo: add simulated dispute flag |
| `POST` | `/api/inscriptions/:id/reset-demo` | Demo: reset simulated actions |
| `DELETE` | `/api/inscriptions/:id` | Delete inscription |

Rate limits: 100 requests / 15 min global, 10 requests / 15 min on `/api/ai-describe`.

---

## IPFS Multi-Gateway Fallback

Content is fetched through 5 gateways in priority order:

| Priority | Gateway |
|----------|---------|
| 1 | `{cid}.ipfs.storacha.link` |
| 2 | `{cid}.ipfs.w3s.link` |
| 3 | `gateway.pinata.cloud/ipfs/{cid}` |
| 4 | `{cid}.ipfs.dweb.link` |
| 5 | `{cid}.ipfs.cloudflare-ipfs.com` |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page: hero, how it works, live network stats |
| `/feed` | Browse all inscriptions: filter by category, vouch, flag, inspect |
| `/publish` | Create an inscription: upload evidence, ELA check, AI fill, World ID verify |
| `/network` | Live stats: Storacha network, UCAN delegation chain, World Chain contract |

---

## Quick Start

### Prerequisites

- Node.js 22+
- World ID app at [developer.world.org](https://developer.world.org/)
- Storacha account at [storacha.network](https://storacha.network/)
- Pinata account (optional) at [pinata.cloud](https://pinata.cloud/)
- Anthropic API key (optional) at [console.anthropic.com](https://console.anthropic.com/)

### 1. Install

```bash
git clone https://github.com/YOUR_USERNAME/stele.git
cd stele
npm install
cd server && npm install && cd ..
```

### 2. Environment Variables

Create `server/.env`:

```env
# World ID
WORLD_ID_APP_ID=app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORLD_ID_RP_ID=rp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RP_SIGNING_KEY=<ecdsa-p256-signing-key>

# Storacha
STORACHA_KEY=<agent-private-key>
STORACHA_PROOF=<base64-ucan-delegation>

# Optional
PINATA_JWT=<pinata-jwt>
ANTHROPIC_API_KEY=<anthropic-key>
DEPLOYER_PRIVATE_KEY=<world-chain-deployer-wallet-pk>
WORLD_CHAIN_CONTRACT=0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6
```

Create `.env.local` (frontend):

```env
VITE_WORLD_ID_APP_ID=app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_WORLD_ID_RP_ID=rp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### World ID Setup

1. Create an app at [developer.world.org](https://developer.world.org/)
2. Copy **App ID** to `WORLD_ID_APP_ID` and `VITE_WORLD_ID_APP_ID`
3. Copy **Relying Party ID** to `WORLD_ID_RP_ID` and `VITE_WORLD_ID_RP_ID`
4. Go to **Managed Mode**, create a **Signing Key**, copy to `RP_SIGNING_KEY`
5. Set action string to `stele-inscribe`

#### Storacha Setup

```bash
npm install -g @storacha/cli
storacha login your@email.com
storacha space create stele
storacha key create                                   # -> STORACHA_KEY
storacha delegation create <agent-did> --base64       # -> STORACHA_PROOF
```

### 3. Run

```bash
npm run dev:all
```

- **Frontend**: http://localhost:5000
- **API server**: http://localhost:3001 (proxied via Vite at `/api`)

---

## Smart Contract

### Contract Details

| | |
|---|---|
| **File** | `contracts/InscriptionRegistry.sol` |
| **Network** | World Chain Sepolia (chainId: 4801) |
| **Address** | `0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6` |
| **Deploy tx** | `0xf825e6c954922744a5875a6981930abf6efaa5f605ca96d0a17e20ddaa42f3d6` |
| **Explorer** | [View on World Chain Explorer](https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6) |

### Compile and Deploy

```bash
# Compile
node scripts/compile.js
# Output: artifacts/InscriptionRegistry.json

# Generate a new deployer wallet
node scripts/generate-wallet.js

# Deploy to World Chain Sepolia (requires DEPLOYER_PRIVATE_KEY)
node scripts/deploy.js

# Deploy to World Chain Mainnet
node scripts/deploy.js --mainnet
```

---

## Production Deployment

```bash
# Build
npm run build
cd server && npm run build

# Run
NODE_ENV=production node server/dist/index.js
```

The production server serves the built React frontend from `dist/` and the API on the same port.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Replit deployment, environment setup, and troubleshooting.

---

## Hackathon Submission

**Protocol Labs x World — Hackathon 2025**

---

### World Build 3: $5,000

**Track:** Sybil-Proof Social Graph

> *"Build a social or community Mini App where every interaction is gated by World ID, ensuring 100% human-to-human engagement without bots or trolls."*

STELE is a human-only journalism layer. Every story published, every vouch, every flag requires a live World ID proof. No bots. No fake witnesses. Every inscription is permanently linked to a real human being.

**Submission checklist:**

| Requirement | Status | Detail |
|-------------|--------|--------|
| World ID for core functionality | Yes | Publishing, vouching, and flagging all require live World ID proof |
| Deployed to World Chain | Yes | `InscriptionRegistry.sol` on World Chain Sepolia (chainId: 4801) |
| Orb-verified Proof of Personhood | Yes | Orb tier supported; Orb vouches carry 10x consensus weight |
| Working demo | Yes | Live on Replit: full publish, verify, inspect flow |
| Public GitHub + clear README | Yes | This file |
| World App Mini App (MiniKit) | Yes | `@worldcoin/minikit-js` integrated; native verification inside World App |
| On-chain social actions | Yes | `inscribe()`, `vouch()`, `flag()` all permanently recorded on World Chain |

**Judging criteria alignment:**

| Criterion | Weight | STELE |
|-----------|--------|-------|
| Humanity and Utility | 40% | Solves disinformation at the source: every story is cryptographically tied to a real human, not an account |
| Technical Execution | 30% | World Chain contract with inscribe/vouch/flag + UCAN-delegated IPFS + MiniKit native verification |
| Viral Potential / Market Fit | 20% | One click to prove any news story came from a real human: shareable, verifiable, globally useful |
| Presentation and Demo | 10% | Clear Triad of Truth: WHO (World ID) + WHAT (SHA-256) + WHERE (IPFS/Filecoin) + CHAIN (World Chain) |

**Key technical innovations:**

- The SHA-256 content hash IS the World ID verification signal: atomic binding between identity and content in a single proof
- A journalist's identity is their nullifier, not their name: privacy-preserving by default
- One person cannot publish the same story twice: on-chain uniqueness enforcement per `contentHash`
- Community consensus (vouch/flag) is weighted by verification tier: Orb = 10x, Device = 1x, enforced on-chain
- Inside World App: MiniKit enables zero-friction native verification with no QR code, no external browser

---

### Storacha Sponsor Prize: $500 pool

**Track:** Decentralized Storage Infrastructure

STELE demonstrates production-grade Storacha integration:

- **UCAN delegation chain**: server issues scoped capability tokens to browser agent DIDs; the browser uploads directly to Storacha without the server touching the files
- **CAR file packaging**: evidence files and metadata bundled as a single content-addressed archive before upload
- **Multi-gateway fallback**: 5 IPFS gateways tried in priority order (storacha.link, w3s.link, Pinata, dweb.link, Cloudflare)
- **Pinata backup pin**: every CID pinned to Pinata as a redundant permanence layer

---

### Infrastructure and Digital Rights: $6,000

**Track:** Censorship-Resistant Infrastructure

STELE is a **censorship-resistant journalism primitive**, not another platform:

- No central server holds the content: evidence lives on IPFS via Storacha/Filecoin
- No central authority controls access: UCAN delegation is trustless and server-independent
- No jurisdiction can suppress a story: content hash anchored on World Chain is immutable
- No single point of failure: 5 IPFS gateways, Pinata backup, on-chain anchor
- No fake sources: every story requires biometric World ID verification

This is infrastructure built to survive adversarial conditions.

---

## Core Thesis

> *Journalism needs a censorship-resistant primitive, not another platform. STELE is that primitive: human-verified, content-addressed, on-chain anchored.*

The name comes from ancient stone monuments inscribed with important records. Permanent, public, and tamper-evident. This protocol is the digital equivalent.

---

## License

MIT
