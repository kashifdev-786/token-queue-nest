# Zahid Clinic Token Queue — Windows Server Deployment Guide

Development happens on your **Mac**. Production runs on a **Windows Server** PC at the clinic. Clinic TVs and tablets connect over the LAN.

This guide labels every step with the machine where it runs:

| Label | Machine |
|-------|---------|
| **Mac** | Your development computer |
| **Windows Server** | Clinic server PC (runs Node.js on port **4789**) |
| **Clinic devices** | Hall TV, Room 1 tablet, Room 2 tablet (same LAN as server) |

---

## Deployment roadmap

| Step | Machine | What you do |
|------|---------|-------------|
| 1 | Mac | Install Node.js; develop and test locally |
| 2 | Mac | Prepare project files to copy to the server |
| 3 | Windows Server | Install Node.js |
| 4 | Windows Server | Copy project from Mac; `npm install`; `npm run build` |
| 5 | Windows Server | Test run, open firewall, set static LAN IP |
| 6 | Windows Server | Install PM2; auto-start on boot |
| 7 | Clinic devices | Open display and staff panel URLs |
| 8 | Mac → Windows Server | Repeat Steps 2 and 4–6 when you release updates |

---

## Architecture overview

| Component | Role |
|-----------|------|
| **Windows Server** | Runs Node.js app on port **4789** |
| **Hall TV / projector** | Opens `/display` in Chrome or Edge (fullscreen) |
| **Room 1 tablet/PC** | Opens `/room1` for consultation tokens |
| **Room 2 tablet/PC** | Opens `/room2` for checkup tokens |

All clinic devices must be on the **same local network** as the server.

**Internet:** Required only for **Urdu voice announcements** (Microsoft Edge TTS). Token updates and the display work fully offline on the LAN.

---

## Requirements

### Mac (development)

| Item | Recommendation |
|------|----------------|
| OS | macOS (current version) |
| Node.js | **v20 LTS** or **v22 LTS** ([https://nodejs.org](https://nodejs.org)) |
| Git | Optional — for pulling updates on Mac before copying to server |

### Windows Server (production)

| Item | Recommendation |
|------|----------------|
| OS | Windows Server 2019, 2022, or Windows 10/11 Pro (standalone clinic PC) |
| RAM | 2 GB minimum, 4 GB recommended |
| Disk | 500 MB free for Node.js + app |
| Node.js | **v20 LTS** or **v22 LTS** ([https://nodejs.org](https://nodejs.org)) |
| Network | Static LAN IP for the server (example: `192.168.1.10`) |

### Clinic devices

| Item | Recommendation |
|------|----------------|
| Browsers | **Google Chrome** or **Microsoft Edge** on display and staff devices |

---

# Part A — Development on Mac

Run these steps on your **Mac** while building and testing the app.

---

## Step 1 — Install Node.js on Mac

1. Download the **LTS macOS Installer (.pkg)** from [https://nodejs.org](https://nodejs.org).
2. Run the installer and accept defaults.
3. Open **Terminal** and verify:

```bash
node -v
npm -v
```

You should see versions such as `v20.x.x` and `10.x.x`.

---

## Step 2 — Develop and test on Mac

Clone or open the project on your Mac, then install dependencies and start the dev server:

```bash
cd ~/Backend/token-queue-nest   # adjust to your local path
npm install
npm start
```

Open in your Mac browser:

| Test | URL |
|------|-----|
| Display page | `http://localhost:4789/display` |
| Room 1 panel | `http://localhost:4789/room1` |
| Room 2 panel | `http://localhost:4789/room2` |
| Urdu TTS sample | `http://localhost:4789/api/tts?token=1&room=room1` |

Stop the dev server with **Ctrl+C** when finished testing.

> **Note:** Urdu TTS on Mac also needs internet access, same as on Windows Server.

---

## Step 3 — Verify production build on Mac (optional)

Before copying to the server, confirm the project builds cleanly on your Mac:

```bash
cd ~/Backend/token-queue-nest
npm run build
ls dist/main.js
```

This is a sanity check only. The **production build that actually runs in the clinic must be built again on Windows Server** (Step 6).

---

## Step 4 — Prepare files to copy to Windows Server

On your **Mac**, gather the project folder to transfer to the clinic server.

### What to include

Copy the full project **except** `node_modules`, `dist`, and `.env` files:

```
token-queue-nest\
  package.json
  package-lock.json
  tsconfig.json
  ecosystem.config.cjs
  src\
  public\
```

`ecosystem.config.cjs` is included in the repo — PM2 uses it on the server.

### What NOT to copy

| Exclude | Reason |
|---------|--------|
| `node_modules\` | Built for your Mac — reinstall on Windows with `npm install` |
| `dist\` | Rebuild on Windows with `npm run build` |
| `.env` | Not used by this app; avoid copying secrets by habit |

### How to transfer Mac → Windows Server

Use any method that works on your clinic network:

| Method | Notes |
|--------|-------|
| USB drive | Copy the folder to `C:\Apps\token-queue-nest` on the server |
| LAN file share | Share a folder from Mac or copy via Windows shared folder |
| Remote Desktop | Copy/paste or map a network drive while logged into the server |
| Git | `git clone` or `git pull` directly on Windows Server if Git is installed there |

Target path on Windows Server:

```
C:\Apps\token-queue-nest
```

---

# Part B — Windows Server setup (first-time)

Run these steps on the **Windows Server** at the clinic. You need physical or Remote Desktop access to this machine.

---

## Step 5 — Install Node.js on Windows Server

1. On the **Windows Server**, download the **LTS Windows Installer (.msi)** from [https://nodejs.org](https://nodejs.org).
2. Run the installer as Administrator.
3. Accept defaults; ensure **“Add to PATH”** is checked.
4. Open **PowerShell** and verify:

```powershell
node -v
npm -v
```

You should see versions such as `v20.x.x` and `10.x.x`.

---

## Step 6 — Install dependencies and build on Windows Server

Open **PowerShell** on the **Windows Server** (Administrator not required unless folder permissions block writes):

```powershell
cd C:\Apps\token-queue-nest
npm install
npm run build
```

Verify the build output:

```powershell
dir dist\main.js
```

> **Important:** Always run `npm install` and `npm run build` on the **Windows Server**, even if you already built on Mac. Do not copy `node_modules` or `dist` from your Mac.

---

## Step 7 — Test run on Windows Server (manual)

On the **Windows Server**, start the app once to confirm it works before setting up PM2:

```powershell
cd C:\Apps\token-queue-nest
npm run start:prod
```

You should see output similar to:

```
✅ Token Queue Server (NestJS) running
   Local:   http://localhost:4789
   Display: http://192.168.1.10:4789/display
   Room 1:  http://192.168.1.10:4789/room1
   Room 2:  http://192.168.1.10:4789/room2
```

Note the **Display / Room URLs** and your server LAN IP.

### Quick checks on Windows Server

Open these in a browser **on the Windows Server**:

| Test | URL |
|------|-----|
| Display page | `http://localhost:4789/display` |
| Room 1 panel | `http://localhost:4789/room1` |
| Room 2 panel | `http://localhost:4789/room2` |
| Urdu TTS sample | `http://localhost:4789/api/tts?token=1&room=room1` |

Stop the test with **Ctrl+C** before setting up PM2 (Step 9).

---

## Step 8 — Open Windows Firewall and set LAN IP

On the **Windows Server**, allow other clinic PCs and tablets to reach port **4789**.

### 8.1 Firewall rule (PowerShell — recommended)

Run **PowerShell as Administrator** on the **Windows Server**:

```powershell
New-NetFirewallRule `
  -DisplayName "Zahid Clinic Token Queue" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 4789 `
  -Action Allow `
  -Profile Domain,Private
```

Use `-Profile Domain,Private,Public` only if you understand the security impact on public networks. For a clinic LAN, **Private** is usually enough.

### 8.2 Firewall rule (GUI alternative)

On the **Windows Server**:

1. Open **Windows Defender Firewall with Advanced Security**.
2. **Inbound Rules** → **New Rule…**
3. **Port** → TCP → **4789**
4. **Allow the connection**
5. Name: `Zahid Clinic Token Queue`

### 8.3 Find and fix the server LAN IP

On the **Windows Server**:

```powershell
ipconfig
```

Look for **IPv4 Address** on the active Ethernet/Wi‑Fi adapter (example: `192.168.1.10`).

Assign a **static IP** or DHCP reservation so this address does not change after reboot. Use this IP as `SERVER_IP` in all clinic device URLs.

---

## Step 9 — Run with PM2 on Windows Server (auto-start on boot)

On the **Windows Server**, use **PM2** to keep the app running 24/7, restart it on crash, and restore it after reboot.

### 9.1 Install PM2 globally

Run **PowerShell as Administrator** on the **Windows Server**:

```powershell
npm install -g pm2
pm2 -v
```

### 9.2 Create logs folder

On the **Windows Server**:

```powershell
mkdir C:\Apps\token-queue-nest\logs
```

The project already includes `ecosystem.config.cjs` at the app root. If you installed the app elsewhere, edit `cwd` inside that file to match your path.

### 9.3 Start the app with PM2

On the **Windows Server**:

```powershell
cd C:\Apps\token-queue-nest
pm2 start ecosystem.config.cjs
```

Or without the ecosystem file:

```powershell
cd C:\Apps\token-queue-nest
pm2 start dist/main.js --name TokenQueue
```

Verify on the **Windows Server**:

```powershell
pm2 status
pm2 logs TokenQueue --lines 20
```

You should see `TokenQueue` with status **online**.

### 9.4 Save the process list

On the **Windows Server**:

```powershell
pm2 save
```

PM2 must remember this app so it can restore it after reboot.

### 9.5 Auto-start PM2 on Windows boot

PM2 has no built-in Windows startup command. On the **Windows Server**, use one of the options below.

#### Option A — Clinic PC with auto-login (simplest)

Best when the server is a dedicated clinic PC that signs in automatically after boot.

On the **Windows Server**:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

Reboot the **Windows Server** once, then sign in (or wait for auto-login) and confirm:

```powershell
pm2 status
```

`TokenQueue` should be **online**.

> **Note:** `pm2-windows-startup` starts PM2 when a user logs in. Enable **Windows auto-login** for the account that runs PM2, or the app will not start until someone signs in.

#### Option B — Headless Windows Server (Windows Service)

Use when the server must run **without** an interactive user login (typical Windows Server).

On the **Windows Server**:

```powershell
npm install -g pm2-windows-service
```

Run the installer **as Administrator** on the **Windows Server**:

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

Find your global PM2 path on the **Windows Server**:

```powershell
npm root -g
```

The PM2 dir is `<npm-root>\pm2` (not `pm2\index.js`).

After install, confirm a **PM2** service exists in **Services** (`services.msc`) with start type **Automatic**.

Reboot the **Windows Server** and run `pm2 status` — `TokenQueue` should show uptime from boot.

> **Note:** `pm2-windows-service` is an older community package. It still works on many Windows Server installs, but if the installer fails on newer Windows versions, use Option A with auto-login instead.

### 9.6 PM2 daily commands (Windows Server)

Run these on the **Windows Server**:

```powershell
pm2 status
pm2 logs TokenQueue
pm2 restart TokenQueue
pm2 stop TokenQueue
pm2 start TokenQueue
pm2 delete TokenQueue
pm2 save
```

To remove PM2 from Windows startup (Option A), on the **Windows Server**:

```powershell
pm2-startup uninstall
```

To remove the PM2 Windows service (Option B), on the **Windows Server**:

```powershell
pm2-service-uninstall
```

---

# Part C — Clinic LAN devices

Run these steps on the **hall TV** and **staff tablets** — not on your Mac or necessarily on the Windows Server console.

Replace `SERVER_IP` with the Windows Server LAN IP from Step 8.3 (example: `192.168.1.10`).

---

## Step 10 — Configure clinic devices

| Device | URL | Notes |
|--------|-----|--------|
| **Hall display (TV)** | `http://SERVER_IP:4789/display` | Chrome/Edge fullscreen (F11) |
| **Room 1 staff** | `http://SERVER_IP:4789/room1` | Tablet or PC at consultation desk |
| **Room 2 staff** | `http://SERVER_IP:4789/room2` | Tablet or PC at checkup desk |

### Hall display (TV) setup

On the **hall TV** or PC connected to the projector:

1. Open Chrome or Edge.
2. Go to `http://SERVER_IP:4789/display`
3. Confirm the badge shows **Speaker on** (speaker is on by default).
4. **Tap the screen once** if the badge says **Tap screen once to play** — browsers require one user interaction before audio.
5. Press **F11** for fullscreen (or use the fullscreen button in the page header).
6. Optional: set the browser to **Open at startup** / kiosk mode so the display survives reboot.

### Staff panels

On each **Room 1** and **Room 2** tablet:

1. Open the room URL in Chrome or Edge.
2. Bookmark the page for daily use.

Staff panels do not need speaker setup unless you are testing audio there.

---

# Part D — Daily operation

| What | Where | Expected state |
|------|-------|----------------|
| Queue server | **Windows Server** | PM2 process `TokenQueue` is **online** |
| Hall display | **Clinic TV** | Page shows **Live** when connected |
| Token calls | **Staff tablets** | Staff enter token number and click **Call Token** |
| Urdu voice | **Hall display** | Plays when speaker is not muted and server has internet |

---

# Part E — Updating after code changes

When you change code on your **Mac**, deploy the update to the **Windows Server** and refresh clinic browsers.

### On Mac

1. Finish development and test locally (`npm start`).
2. Prepare updated files using Step 4 (copy to USB, share, or push to Git).

### On Windows Server

1. Stop the app:

```powershell
pm2 stop TokenQueue
```

2. Replace updated files in `C:\Apps\token-queue-nest` (USB copy, file share, or `git pull`).

3. Reinstall and rebuild (always rebuild after any `src\` or `public\` change; run `npm install` only if `package.json` changed):

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

### On clinic devices

5. Hard-refresh browsers on the display and staff tablets (**Ctrl+F5**).

---

## Troubleshooting

| Problem | Machine | What to check |
|---------|---------|----------------|
| Build fails on Mac | **Mac** | `npm install`; read TypeScript errors in Terminal |
| Build fails on server | **Windows Server** | Run `npm run build` manually; do not use Mac `dist\` |
| Cannot open URLs from other PCs | **Windows Server** | Firewall rule for port 4789; server and clients on same subnet |
| Page loads but tokens don’t update | **Windows Server** | `pm2 status` — is TokenQueue **online**? Check `logs\pm2-error.log` |
| No Urdu voice | **Windows Server** + **display** | Server needs **internet** for TTS; display speaker not muted; tap screen once if needed |
| “TTS unavailable” on display | **Windows Server** | Outbound HTTPS for Edge TTS; open TTS URL in server browser |
| Wrong IP after reboot | **Windows Server** | Set static IP or DHCP reservation |
| PM2 app won’t start | **Windows Server** | Run `node dist\main.js` manually; then `pm2 logs TokenQueue --err --lines 50` |
| PM2 not running after reboot | **Windows Server** | Re-run Step 9.5; confirm `pm2 save`; check auto-login or PM2 service |
| Port 4789 in use | **Windows Server** | `netstat -ano \| findstr :4789` — stop conflicting app or change `APP_PORT` in `src\app.config.ts`, rebuild on server |

### Test TTS from Windows Server browser

On the **Windows Server**, open:

```
http://localhost:4789/api/tts?token=5&room=room1
```

Audio playback or download means TTS is working.

### View PM2 logs on Windows Server

```powershell
pm2 logs TokenQueue --lines 50
Get-Content C:\Apps\token-queue-nest\logs\pm2-error.log -Tail 50
```

---

## Security notes (clinic LAN)

- This app is intended for a **trusted local network**, not public internet exposure.
- Do not port-forward 4789 to the internet without a reverse proxy, HTTPS, and authentication.
- Keep Windows Server patched; restrict physical access to the server room.

---

## Quick reference by machine

### Mac (development)

```bash
cd ~/Backend/token-queue-nest
npm install
npm start              # dev server
npm run build          # optional sanity check before deploy
```

### Windows Server (production)

```powershell
cd C:\Apps\token-queue-nest
npm install
npm run build
npm run start:prod     # manual test only

pm2 start ecosystem.config.cjs
pm2 status
pm2 restart TokenQueue
pm2 logs TokenQueue
pm2 save
```

### Clinic devices

```
http://SERVER_IP:4789/display
http://SERVER_IP:4789/room1
http://SERVER_IP:4789/room2
```

---

## Support checklist before go-live

### Mac

- [ ] Node.js installed; `npm start` works locally
- [ ] Optional: `npm run build` succeeds on Mac

### Windows Server

- [ ] Node.js installed and in PATH
- [ ] Project copied from Mac (without `node_modules` or `dist`)
- [ ] `npm install` and `npm run build` completed without errors on Windows
- [ ] Windows Firewall allows inbound TCP 4789 on LAN
- [ ] Server has stable LAN IP
- [ ] PM2 installed; `TokenQueue` process saved and auto-start configured (Step 9.5)
- [ ] TTS sample URL plays or downloads from server browser
- [ ] Server has internet access for Urdu announcements

### Clinic devices

- [ ] Display opens `/display` and shows **Live**
- [ ] Display speaker not muted; one screen tap done if browser required it
- [ ] Sample Urdu announcement plays on token call
- [ ] Room 1 and Room 2 panels call tokens successfully
