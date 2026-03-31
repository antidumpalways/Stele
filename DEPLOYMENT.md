# STELE Deployment Guide

## Development Setup (Local)

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **For testing with World ID Simulator:**
   - Set `VITE_WORLD_ID_ENV=staging` in `.env.local`
   - Get test credentials from: https://developer.world.org/
   - Any non-empty `VITE_WORLD_ID_APP_ID` will work with Simulator
   
3. **For Storacha (optional file storage):**
   ```bash
   npm install -g @storacha/cli
   storacha login <email>
   storacha space create
   storacha key create  # Copy output → STORACHA_KEY
   storacha delegation create <did_from_above> --base64  # → STORACHA_PROOF
   ```

4. **Start dev environment:**
   ```bash
   npm install           # Install root + server deps
   npm run dev:all       # Starts frontend (5000) + backend (3001)
   ```

## Production Deployment

### Environment Variables

**Required on server:**
- `PORT` (default: 3001)
- `WORLD_ID_APP_ID` - From https://developer.world.org/
- `WORLD_ID_RP_ID` - From https://developer.world.org/
- `RP_SIGNING_KEY` - From https://developer.world.org/ (Signing Key)
- `WORLD_ID_ACTION` - Action string (e.g., "stele-inscribe")
- `STORACHA_KEY` - Storacha agent key
- `STORACHA_PROOF` - Storacha UCAN delegation (base64)
- `PINATA_JWT` - Pinata JWT for backup IPFS pinning (from https://app.pinata.cloud/)
- `ALLOWED_ORIGIN` (optional) - Restrict CORS to your domain

**Required in build environment** (if building separately):
- `VITE_WORLD_ID_APP_ID`
- `VITE_WORLD_ID_RP_ID`
- `VITE_WORLD_ID_ACTION`
- `VITE_WORLD_ID_ENV=production` ← Switch from staging

### Building for Production

```bash
# Build frontend
npm run build           # Output: dist/

# Build server
npm run build --prefix server  # Output: server/dist/

# Run production
npm start              # Builds and starts everything
```

### Docker Deployment

A `Dockerfile` is included:
```bash
docker build -t stele .
docker run -p 3001:3001 \
  -e WORLD_ID_APP_ID=app_xxx \
  -e WORLD_ID_RP_ID=rp_xxx \
  -e RP_SIGNING_KEY=xxx \
  -e STORACHA_KEY=xxx \
  -e STORACHA_PROOF=xxx \
  stele
```

### Replit Deployment

1. **Set environment secrets** in Replit (Settings → Secrets):
   - `WORLD_ID_APP_ID`
   - `WORLD_ID_RP_ID`
   - `RP_SIGNING_KEY`
   - `VITE_WORLD_ID_APP_ID`
   - `VITE_WORLD_ID_RP_ID`
   - `STORACHA_KEY`
   - `STORACHA_PROOF`

2. **Configure `.replit`:**
   ```toml
   [deployment]
   deploymentTarget = "autoscale"
   run = ["npm", "start"]
   build = ["npm", "run", "build", "&&", "npm", "run", "build", "--prefix", "server"]
   ```

3. **Deploy:**
   - Push to git → Replit auto-deploys
   - Or use Replit deployment UI

## World ID Setup

### Getting Credentials

1. Go to https://developer.world.org/
2. Create an app in Developer Portal
3. Copy `App ID` → `WORLD_ID_APP_ID` (and `VITE_WORLD_ID_APP_ID`)
4. Create Signing Key → Copy hex string → `RP_SIGNING_KEY`
5. Get `Relying Party ID` from dashboard → `WORLD_ID_RP_ID` (and `VITE_WORLD_ID_RP_ID`)

### Staging vs Production

- **Staging** (`VITE_WORLD_ID_ENV=staging`):
  - Uses World ID Simulator
  - No real world ID verification
  - Click "Verify" → Copy QR → Open https://simulator.worldcoin.org → Paste

- **Production** (`VITE_WORLD_ID_ENV=production`):
  - Real World ID users verify via World App
  - Requires approved app in World ID Portal
  - RP credentials must be registered in production

## Database

SQLite database is stored at `./data/stele.db` (auto-created).

To reset:
```bash
rm -rf data/
npm run dev:all
```

## Troubleshooting

### "Verify with World ID" button disabled
- Check `.env.local` has `VITE_WORLD_ID_APP_ID` set
- Verify `npm run dev:all` is running (both frontend + backend)

### "Gagal menyiapkan verifikasi" (Failed to prepare verification)
- Server not running → `npm run dev:server` (terminal 2)
- `RP_SIGNING_KEY` invalid → Check World ID dashboard
- `WORLD_ID_ACTION` mismatch → Must match `VITE_WORLD_ID_ACTION`

### "Koneksi ke World App gagal"
- Using Simulator mode but camera won't scan → Paste QR code into https://simulator.worldcoin.org instead
- Wrong `WORLD_ID_ENV` setting

### Storacha upload fails
- Missing `STORACHA_KEY` or `STORACHA_PROOF`
- Key is expired → Create new delegation
- Space quota full → Create new space

## Monitoring

Logs are printed to server console:
- `STELE server running on port 3001`
- Error logs include: World ID verification failures, Storacha upload errors, inscription creation issues

For production logging, use:
- PM2: `pm2 start "npm start" --name stele`
- systemd: Create `/etc/systemd/system/stele.service`
- Docker: Mount `/data` volume for persistent database
