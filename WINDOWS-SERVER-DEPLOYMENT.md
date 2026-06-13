# Zahid Clinic Token Queue — Windows Server Deployment Guide

This product is designed to run on a **Windows Server** machine on your clinic LAN. The server hosts the queue app, staff panels, hall display, and Urdu voice announcements.

---

## Architecture overview

| Component | Role |
|-----------|------|
| **Windows Server** | Runs Node.js app on port **3000** |
| **Hall TV / projector** | Opens `/display` in Chrome or Edge (fullscreen) |
| **Room 1 tablet/PC** | Opens `/room1` for consultation tokens |
| **Room 2 tablet/PC** | Opens `/room2` for checkup tokens |

All devices must be on the **same local network** as the server.

**Internet:** Required only for **Urdu voice announcements** (Microsoft Edge TTS). Token updates and the display work fully offline on the LAN.

---

## Requirements

| Item | Recommendation |
|------|----------------|
| OS | Windows Server 2019, 2022, or Windows 10/11 Pro (standalone clinic PC) |
| RAM | 2 GB minimum, 4 GB recommended |
| Disk | 500 MB free for Node.js + app |
| Node.js | **v20 LTS** or **v22 LTS** ([https://nodejs.org](https://nodejs.org)) |
| Network | Static LAN IP for the server (example: `192.168.1.10`) |
| Browsers | **Google Chrome** or **Microsoft Edge** on display and staff devices |

---

## Step 1 — Install Node.js on Windows Server

1. Download the **LTS Windows Installer (.msi)** from [https://nodejs.org](https://nodejs.org).
2. Run the installer as Administrator.
3. Accept defaults; ensure **“Add to PATH”** is checked.
4. Open **PowerShell** or **Command Prompt** and verify:

```powershell
node -v
npm -v
```

You should see versions such as `v20.x.x` and `10.x.x`.

---

## Step 2 — Copy the application to the server

1. Copy the full project folder to the server, for example:

```
C:\Apps\token-queue-nest
```

2. The folder must contain at least:

```
token-queue-nest\
  package.json
  package-lock.json
  tsconfig.json
  src\
  public\
```

Do **not** copy `node_modules` from another machine unless it was installed on the same Windows OS. Prefer running `npm install` on the server.

---

## Step 3 — Install dependencies

Open **PowerShell as Administrator** (or a user with write access to the app folder):

```powershell
cd C:\Apps\token-queue-nest
npm install
```

Wait until it finishes with no errors.

---

## Step 4 — Build for production

```powershell
cd C:\Apps\token-queue-nest
npm run build
```

This compiles TypeScript into the `dist\` folder.

Verify:

```powershell
dir dist\main.js
```

---

## Step 5 — Test run (manual)

Start the server once to confirm it works:

```powershell
cd C:\Apps\token-queue-nest
npm run start:prod
```

You should see output similar to:

```
✅ Token Queue Server (NestJS) running
   Local:   http://localhost:3000
   Display: http://192.168.1.10:3000/display
   Room 1:  http://192.168.1.10:3000/room1
   Room 2:  http://192.168.1.10:3000/room2
```

Note the **Display / Room URLs** and your server LAN IP.

### Quick checks on the server

| Test | URL |
|------|-----|
| Display page | `http://localhost:3000/display` |
| Room 1 panel | `http://localhost:3000/room1` |
| Room 2 panel | `http://localhost:3000/room2` |
| Urdu TTS sample | `http://localhost:3000/api/tts?token=1&room=room1` |

Stop the test with **Ctrl+C** before setting up PM2 (Step 7).

---

## Step 6 — Open Windows Firewall (port 3000)

Other PCs and tablets on the LAN must reach port **3000**.

### Option A — PowerShell (recommended)

Run **PowerShell as Administrator**:

```powershell
New-NetFirewallRule `
  -DisplayName "Zahid Clinic Token Queue" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 3000 `
  -Action Allow `
  -Profile Domain,Private
```

Use `-Profile Domain,Private,Public` only if you understand the security impact on public networks. For a clinic LAN, **Private** is usually enough.

### Option B — Windows Defender Firewall GUI

1. Open **Windows Defender Firewall with Advanced Security**.
2. **Inbound Rules** → **New Rule…**
3. **Port** → TCP → **3000**
4. **Allow the connection**
5. Name: `Zahid Clinic Token Queue`

### Find the server LAN IP

```powershell
ipconfig
```

Look for **IPv4 Address** on the active Ethernet/Wi‑Fi adapter (example: `192.168.1.10`).

Assign a **static IP** or DHCP reservation so this address does not change after reboot.

---

## Step 7 — Run with PM2 (auto-start on boot)

The app must stay running 24/7. Use **PM2** to manage the Node.js process, restart it on crash, and restore it after reboot.

### 7.1 Install PM2 globally

Open **PowerShell as Administrator**:

```powershell
npm install -g pm2
pm2 -v
```

### 7.2 Create a PM2 ecosystem file (recommended)

In `C:\Apps\token-queue-nest`, create `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'TokenQueue',
      script: 'dist/main.js',
      cwd: 'C:\\Apps\\token-queue-nest',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
```

Create the logs folder:

```powershell
mkdir C:\Apps\token-queue-nest\logs
```

Adjust `cwd` if the app is installed elsewhere.

### 7.3 Start the app with PM2

```powershell
cd C:\Apps\token-queue-nest
pm2 start ecosystem.config.cjs
```

Or without an ecosystem file:

```powershell
cd C:\Apps\token-queue-nest
pm2 start dist/main.js --name TokenQueue
```

Verify:

```powershell
pm2 status
pm2 logs TokenQueue --lines 20
```

You should see `TokenQueue` with status **online**.

### 7.4 Save the process list

PM2 must remember this app so it can restore it after reboot:

```powershell
pm2 save
```

### 7.5 Auto-start PM2 on Windows boot

PM2 has no built-in Windows startup command. Use one of the options below.

#### Option A — Clinic PC with auto-login (simplest)

Best when the server is a dedicated clinic PC that signs in automatically after boot.

```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

Reboot once, then confirm the app is already running **before** anyone logs in (if possible) or immediately after auto-login:

```powershell
pm2 status
```

> **Note:** `pm2-windows-startup` hooks into the user login session. Enable **Windows auto-login** for the account that runs PM2, or the app will not start until someone signs in.

#### Option B — Headless Windows Server (Windows Service)

Use when the server must run **without** an interactive user login (typical Windows Server).

```powershell
npm install -g pm2-windows-service
```

Run the installer **as Administrator**:

```powershell
pm2-service-install -n PM2
```

When prompted:

| Prompt | Recommended answer |
|--------|-------------------|
| Perform environment setup? | **Yes** |
| Set PM2_HOME? | **Yes** — use a system path such as `C:\pm2` (not `%APPDATA%`) |
| Set PM2_SERVICE_SCRIPTS? | **No** (uses `dump.pm2` from `pm2 save`) |
| Set PM2_SERVICE_PM2_DIR? | **Yes** — path to global PM2, e.g. `C:\Users\Administrator\AppData\Roaming\npm\node_modules\pm2` |

Find your global PM2 path:

```powershell
npm root -g
```

The PM2 dir is `<npm-root>\pm2` (not `pm2\index.js`).

After install, confirm a **PM2** service exists in **Services** (`services.msc`) with start type **Automatic**.

Reboot and run `pm2 status` — `TokenQueue` should show uptime from boot, not from your login.

### 7.6 PM2 daily commands

```powershell
pm2 status
pm2 logs TokenQueue
pm2 restart TokenQueue
pm2 stop TokenQueue
pm2 start TokenQueue
pm2 delete TokenQueue
pm2 save
```

To remove PM2 from Windows startup (Option A):

```powershell
pm2-startup uninstall
```

To remove the PM2 Windows service (Option B):

```powershell
pm2-service-uninstall
```

---

## Step 8 — Configure client devices (clinic LAN)

Replace `SERVER_IP` with your server’s LAN IP (example: `192.168.1.10`).

| Device | URL | Notes |
|--------|-----|--------|
| **Hall display (TV)** | `http://SERVER_IP:3000/display` | Chrome/Edge fullscreen (F11) |
| **Room 1 staff** | `http://SERVER_IP:3000/room1` | Tablet or PC at consultation desk |
| **Room 2 staff** | `http://SERVER_IP:3000/room2` | Tablet or PC at checkup desk |

### Display TV setup

1. Open Chrome or Edge.
2. Go to `http://SERVER_IP:3000/display`
3. Click **Enable Speaker** once (browser policy).
4. Press **F11** for fullscreen.
5. Optional: set browser to **Open at startup** / kiosk mode so the display survives reboot.

### Staff panels

Bookmark Room 1 and Room 2 URLs on each tablet. No speaker enable is required on staff devices unless you test audio there.

---

## Step 9 — Daily operation

1. PM2 process **TokenQueue** should be **online** (automatic after Step 7).
2. Display page shows **Live** when connected.
3. Staff enter token number in Room 1 or Room 2 panel and click **Call Token**.
4. Display updates instantly; Urdu announcement plays if speaker is enabled on the display.

---

## Updating the app after code changes

1. Stop the app:

```powershell
pm2 stop TokenQueue
```

2. Replace updated files (or `git pull`) in `C:\Apps\token-queue-nest`

3. Reinstall/build if `package.json` changed:

```powershell
cd C:\Apps\token-queue-nest
npm install
npm run build
```

4. Restart the app:

```powershell
pm2 restart TokenQueue
pm2 save
```

5. Hard-refresh browsers on display and staff devices (**Ctrl+F5**).

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| Cannot open URLs from other PCs | Firewall rule for port 3000; server and clients on same subnet |
| Page loads but tokens don’t update | `pm2 status` — is TokenQueue **online**? Check `logs\pm2-error.log`; refresh browser |
| No Urdu voice | Click **Enable Speaker** on display; server needs **internet** for TTS |
| “Check server internet” on display | Outbound HTTPS from server (Edge TTS); try opening TTS URL in browser on server |
| Wrong IP after reboot | Set static IP or DHCP reservation on server |
| PM2 app won’t start | Run `node dist\main.js` manually; then `pm2 logs TokenQueue --err --lines 50` |
| PM2 not running after reboot | Re-run Step 7.5; confirm `pm2 save` was run; check PM2 Windows service or auto-login |
| Port 3000 in use | `netstat -ano \| findstr :3000` — stop conflicting app or change port in `src\main.ts` and rebuild |

### Test TTS from the server browser

Open:

```
http://localhost:3000/api/tts?token=5&room=room1
```

An MP3 download or playback means TTS is working.

### View PM2 logs

```powershell
pm2 logs TokenQueue --lines 50
Get-Content C:\Apps\token-queue-nest\logs\pm2-error.log -Tail 50
```

---

## Security notes (clinic LAN)

- This app is intended for a **trusted local network**, not public internet exposure.
- Do not port-forward 3000 to the internet without a reverse proxy, HTTPS, and authentication.
- Keep Windows Server patched; restrict physical access to the server room.

---

## Quick reference — production commands

```powershell
# Install & build (first time or after update)
cd C:\Apps\token-queue-nest
npm install
npm run build

# Manual run (testing only)
npm run start:prod

# PM2 (after Step 7 setup)
pm2 start ecosystem.config.cjs
pm2 status
pm2 restart TokenQueue
pm2 logs TokenQueue
pm2 save
```

---

## Support checklist before go-live

- [ ] Node.js installed and in PATH
- [ ] `npm install` and `npm run build` completed without errors
- [ ] Windows Firewall allows inbound TCP 3000 on LAN
- [ ] Server has stable LAN IP
- [ ] PM2 installed; `TokenQueue` process saved and auto-start configured (Step 7.5)
- [ ] Display opens `/display` and shows **Live**
- [ ] Speaker enabled once on display; sample Urdu plays from speaker icon
- [ ] Room 1 and Room 2 panels call tokens successfully
- [ ] Server has internet access for Urdu announcements
