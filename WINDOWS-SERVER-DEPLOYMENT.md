# Zahid Clinic Token Queue — Windows Server Deployment Guide

Development happens on your **Mac**. Production runs on a **Windows Server** PC at the clinic. Clinic TVs and tablets connect over the LAN.

The server is **plain JavaScript** (`server.js`) — no TypeScript, **no build step**. Run `npm install` then `npm start`.

> **Windows 7 or PowerShell not working?** Use [WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md) instead. It uses **Command Prompt** and the **`windows\*.bat`** scripts (no PowerShell, no PM2 required).

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
| 4 | Windows Server | Copy project from Mac; `npm install` |
| 5 | Windows Server | Test run (`npm start`), open firewall, set static LAN IP |
| 6 | Windows Server | Install PM2; auto-start on boot |
| 7 | Clinic devices | Open display and staff panel URLs |
| 8 | Mac → Windows Server | Repeat Steps 2 and 4–6 when you release updates |

---

## Architecture overview

| Component | Role |
|-----------|------|
| **Windows Server** | Runs `server.js` (Node.js) on port **4789** |
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
| Node.js | **v18 LTS** or newer ([https://nodejs.org](https://nodejs.org)); any **v12+** works |
| Git | Optional — for pulling updates on Mac before copying to server |

### Windows Server (production)

| Item | Recommendation |
|------|----------------|
| OS | Windows Server 2019, 2022, or Windows 10/11 Pro (standalone clinic PC) |
| RAM | 2 GB minimum, 4 GB recommended |
| Disk | 500 MB free for Node.js + app |
| Node.js | **v18 LTS** or **v20 LTS** ([https://nodejs.org](https://nodejs.org)); minimum **v12** |
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

You should see versions such as `v18.x.x` or `v20.x.x`.

---

## Step 2 — Develop and test on Mac

Clone or open the project on your Mac, then install dependencies and start the server:

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

Stop the server with **Ctrl+C** when finished testing.

> **Note:** Urdu TTS on Mac also needs internet access, same as on Windows Server. There is **no compile step** — the same `server.js` runs on Mac and Windows.

---

## Step 3 — Prepare files to copy to Windows Server

On your **Mac**, gather the project folder to transfer to the clinic server.

### What to include

Copy the full project **except** `node_modules` and `.env` files:

```
token-queue-nest\
  server.js
  lib\
  package.json
  package-lock.json
  ecosystem.config.cjs
  windows\
  public\
```

| Folder / file | Purpose |
|---------------|---------|
| `server.js` | Main entry — Express + Socket.IO + TTS API |
| `lib\` | Announcement text and Edge TTS helpers |
| `public\` | Display and staff panel HTML |
| `ecosystem.config.cjs` | PM2 config (optional; points to `server.js`) |
| `windows\` | `.bat` scripts when PowerShell is unavailable ([WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md)) |

### What NOT to copy

| Exclude | Reason |
|---------|--------|
| `node_modules\` | Built for your Mac — reinstall on Windows with `npm install` |
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

You should see versions such as `v18.x.x` and `10.x.x`.

**Alternative (no PowerShell):** double-click `windows\check-environment.bat` in Command Prompt.

---

## Step 6 — Install dependencies on Windows Server

Open **PowerShell** or **Command Prompt** on the **Windows Server** (Administrator not required unless folder permissions block writes):

```powershell
cd C:\Apps\token-queue-nest
npm install
```

**Or** double-click `windows\install-and-build.bat` (runs `npm install` only — no build step).

Verify the main file exists:

```powershell
dir server.js
```

> **Important:** Always run `npm install` on the **Windows Server**. Do not copy `node_modules` from your Mac.

---

## Step 7 — Test run on Windows Server (manual)

On the **Windows Server**, start the app once to confirm it works before setting up PM2:

```powershell
cd C:\Apps\token-queue-nest
npm start
```

**Or** double-click `windows\start-server.bat`.

You should see output similar to:

```
Token Queue Server running
   Local:   http://localhost:4789
   Display: http://192.168.1.10:4789/display
   Room 1:  http://192.168.1.10:4789/room1
   Room 2:  http://192.168.1.10:4789/room2
   Urdu TTS: http://192.168.1.10:4789/api/tts?test=1
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

## Step 8 — Open Windows Firewall and set static LAN IP

On the **Windows Server**, open port **4789** for clinic devices, then assign a **fixed LAN IP** so display and staff URLs never break after reboot.

---

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

**Alternative (Command Prompt as Administrator):**

```cmd
cd /d C:\Apps\token-queue-nest
windows\open-firewall.bat
```

Or:

```cmd
netsh advfirewall firewall add rule name="Zahid Clinic Token Queue" dir=in action=allow protocol=TCP localport=4789
```

### 8.2 Firewall rule (GUI alternative)

On the **Windows Server**:

1. Open **Windows Defender Firewall with Advanced Security**.
2. **Inbound Rules** → **New Rule…**
3. **Port** → TCP → **4789**
4. **Allow the connection**
5. Name: `Zahid Clinic Token Queue`

---

### 8.3 Record current network settings (do this first)

Before changing anything, collect the server’s existing network details on the **Windows Server**.

#### 8.3.1 Open PowerShell

On the **Windows Server**, open **PowerShell** (Administrator not required for `ipconfig`).

#### 8.3.2 Run ipconfig

```powershell
ipconfig
```

Find the adapter the clinic server actually uses:

| Clinic setup | Adapter name in `ipconfig` |
|--------------|----------------------------|
| Server plugged into wall/network port | **Ethernet** |
| Server on Wi‑Fi (not recommended for production) | **Wi-Fi** |

Write down these values from that adapter’s section:

| Setting | Example | Your value |
|---------|---------|------------|
| **IPv4 Address** | `192.168.1.45` | __________ |
| **Subnet Mask** | `255.255.255.0` | __________ |
| **Default Gateway** | `192.168.1.1` | __________ |

#### 8.3.3 Record DNS servers

In the same `ipconfig` output, note **DNS Servers** (if shown). If not listed, your gateway is usually the DNS server.

```powershell
ipconfig /all
```

Look for **DNS Servers** under the same adapter. Example: `192.168.1.1` or `8.8.8.8`.

| Setting | Example | Your value |
|---------|---------|------------|
| **DNS server 1** | `192.168.1.1` | __________ |
| **DNS server 2** (optional) | `8.8.8.8` | __________ |

#### 8.3.4 Choose the static IP address

Pick an address on the **same subnet** as the gateway that is **not** already used by another device.

| Rule | Example |
|------|---------|
| Same first three numbers as gateway | Gateway `192.168.1.1` → use `192.168.1.x` |
| Avoid router DHCP range if possible | If DHCP is `.100`–`.200`, pick `.10` or `.210` |
| Recommended for this server | `192.168.1.10` (easy to remember) |

**Your chosen static IP (`SERVER_IP`):** __________

> **Tip:** If the server already has a working DHCP address (e.g. `192.168.1.45`), you can keep that exact address as the static IP — just make sure nothing else will claim it after reboot (Step 8.4 Option A or B).

---

### 8.4 Set a static LAN IP

Use **one** of the two options below on the **Windows Server** (or clinic router). **Option A** is preferred when you have access to the clinic router.

#### Option A — DHCP reservation on the clinic router (recommended)

The router always assigns the same IP to the server by MAC address. Windows can stay on automatic (DHCP) — simpler and fewer mistakes.

**On the Windows Server** — get the MAC address:

```powershell
getmac /v /fo list
```

Find the **Physical Address** for the active **Ethernet** (or Wi‑Fi) adapter. Example: `AA-BB-CC-DD-EE-FF`.

**On the clinic router** (any PC browser on the LAN):

1. Open the router admin page (common addresses: `192.168.1.1`, `192.168.0.1`, or `192.168.100.1` — use your **Default Gateway** from Step 8.3).
2. Sign in (clinic IT or ISP sticker on the router).
3. Find a menu named **DHCP Reservation**, **Address Reservation**, **Static DHCP**, or **LAN → DHCP Server**.
4. Add a new reservation:
   - **MAC address:** from `getmac` above
   - **Reserved IP:** your chosen `SERVER_IP` (e.g. `192.168.1.10`)
   - **Enable / Save**
5. Save and apply router settings.

**Back on the Windows Server** — refresh the lease:

```powershell
ipconfig /release
ipconfig /renew
ipconfig
```

Confirm **IPv4 Address** matches your reserved `SERVER_IP`.

If the address does not update, on the **Windows Server**:

```powershell
# Run in PowerShell as Administrator
Restart-NetAdapter -Name "Ethernet"
```

Replace `"Ethernet"` with your adapter name from `ipconfig` if different. Then run `ipconfig` again.

---

#### Option B — Static IP configured on Windows Server

Use when you **cannot** access the router. Set the IP directly on the **Windows Server**.

##### B.1 — Settings app (Windows Server 2022 / Windows 10 / 11)

On the **Windows Server**:

1. Press **Win + I** to open **Settings**.
2. Go to **Network & Internet** → **Ethernet** (or **Wi-Fi** if that is what you use).
3. Click the active network connection name.
4. Next to **IP assignment**, click **Edit**.
5. Change **Automatic (DHCP)** to **Manual**.
6. Turn **IPv4** **On** and enter:

| Field | Value |
|-------|-------|
| **IP address** | Your `SERVER_IP` (e.g. `192.168.1.10`) |
| **Subnet mask** | From Step 8.3 (usually `255.255.255.0`) |
| **Gateway** | From Step 8.3 (e.g. `192.168.1.1`) |
| **Preferred DNS** | From Step 8.3 (e.g. `192.168.1.1` or `8.8.8.8`) |
| **Alternate DNS** | Optional second DNS (e.g. `8.8.4.4`) |

7. Click **Save**.

##### B.2 — Classic control panel (alternative GUI)

On the **Windows Server**:

1. Press **Win + R**, type `ncpa.cpl`, press **Enter**.
2. Right-click the active adapter (**Ethernet**) → **Properties**.
3. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**.
4. Select **Use the following IP address** and enter:

| Field | Value |
|-------|-------|
| **IP address** | Your `SERVER_IP` (e.g. `192.168.1.10`) |
| **Subnet mask** | `255.255.255.0` (or value from Step 8.3) |
| **Default gateway** | e.g. `192.168.1.1` |

5. Select **Use the following DNS server addresses**:

| Field | Value |
|-------|-------|
| **Preferred DNS server** | e.g. `192.168.1.1` |
| **Alternate DNS server** | optional, e.g. `8.8.8.8` |

6. Click **OK** → **Close**.

##### B.3 — PowerShell (advanced)

On the **Windows Server**, run **PowerShell as Administrator**. Replace placeholders with your values from Step 8.3:

```powershell
# List adapters to find the exact InterfaceAlias (e.g. "Ethernet")
Get-NetAdapter | Format-Table Name, Status, MacAddress

# Set static IP — edit InterfaceAlias, IPAddress, DefaultGateway, PrefixLength
New-NetIPAddress `
  -InterfaceAlias "Ethernet" `
  -IPAddress "192.168.1.10" `
  -PrefixLength 24 `
  -DefaultGateway "192.168.1.1"

# Set DNS — edit InterfaceAlias and ServerAddresses
Set-DnsClientServerAddress `
  -InterfaceAlias "Ethernet" `
  -ServerAddresses ("192.168.1.1", "8.8.8.8")
```

| `PrefixLength` | Subnet mask |
|----------------|-------------|
| `24` | `255.255.255.0` (most home/clinic LANs) |
| `16` | `255.255.0.0` |

If you get “address already exists”, the adapter may still have a DHCP address. Remove it first (same admin PowerShell):

```powershell
Remove-NetIPAddress -InterfaceAlias "Ethernet" -Confirm:$false
Remove-NetRoute -InterfaceAlias "Ethernet" -Confirm:$false
```

Then run the `New-NetIPAddress` and `Set-DnsClientServerAddress` commands again.

---

### 8.5 Verify static IP and LAN access

Run these checks on the **Windows Server** after Step 8.4.

#### 8.5.1 Confirm IP address

```powershell
ipconfig
```

**IPv4 Address** must match your chosen `SERVER_IP` (e.g. `192.168.1.10`).

#### 8.5.2 Ping the gateway

```powershell
ping 192.168.1.1
```

Replace with your gateway. You should see replies. If ping fails, recheck gateway and subnet mask in Step 8.4.

#### 8.5.3 Ping the internet (for Urdu TTS)

```powershell
ping 8.8.8.8
```

Replies mean the server has outbound connectivity (needed for voice announcements).

#### 8.5.4 Confirm the queue app is reachable on the LAN

With the app running (Step 7 test or Step 9 PM2), on **another clinic PC or tablet** (not the server), open a browser:

```
http://SERVER_IP:4789/display
```

Example: `http://192.168.1.10:4789/display`

The display page should load. If it fails, recheck the firewall rule (Step 8.1 or 8.2).

#### 8.5.5 Reboot test (important)

On the **Windows Server**:

1. Restart the machine: **Start** → **Restart**
2. After login, run `ipconfig` — IP must still be `SERVER_IP`
3. Run `pm2 status` (after Step 9) — `TokenQueue` should be **online**
4. From a clinic tablet, open `http://SERVER_IP:4789/display` again

Use this `SERVER_IP` in all clinic device URLs in Step 10.

---

### 8.6 Static IP troubleshooting

| Problem | Machine | Fix |
|---------|---------|-----|
| “IP conflict” or no network after static setup | **Windows Server** | Another device uses the same IP — pick a different `SERVER_IP` or add DHCP reservation (Option A) |
| Can ping gateway but not other PCs | **Windows Server** | Wrong subnet mask — use `255.255.255.0` and `PrefixLength 24` on `/24` networks |
| IP reverts after reboot | **Windows Server** / router | Option B not saved; or DHCP overrides — prefer Option A (router reservation) |
| No internet / TTS fails | **Windows Server** | DNS missing — set Preferred DNS to gateway or `8.8.8.8` |
| `New-NetIPAddress` error | **Windows Server** | Run `Remove-NetIPAddress` / `Remove-NetRoute` first; confirm **InterfaceAlias** name |
| Display URL works on server but not tablets | **Windows Server** | Firewall (Step 8.1); confirm tablets use `http://SERVER_IP:4789` not `localhost` |


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
pm2 start server.js --name TokenQueue
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

Replace `SERVER_IP` with the Windows Server LAN IP you set in **Step 8** (example: `192.168.1.10`).

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

3. Reinstall dependencies (run `npm install` only if `package.json` changed; always re-copy `server.js`, `lib\`, and `public\` when those change):

```powershell
cd C:\Apps\token-queue-nest
npm install
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
| `npm install` fails on Mac | **Mac** | Read errors in Terminal; confirm Node.js v12+ |
| `npm install` fails on server | **Windows Server** | Run `npm install` manually; do not copy Mac `node_modules` |
| Cannot open URLs from other PCs | **Windows Server** | Firewall rule for port 4789; server and clients on same subnet |
| Page loads but tokens don’t update | **Windows Server** | `pm2 status` — is TokenQueue **online**? Check `logs\pm2-error.log` |
| No Urdu voice | **Windows Server** + **display** | Server needs **internet** for TTS; display speaker not muted; tap screen once if needed |
| “TTS unavailable” on display | **Windows Server** | Outbound HTTPS for Edge TTS; open TTS URL in server browser |
| Wrong IP after reboot | **Windows Server** | Complete **Step 8.4** (static IP or DHCP reservation); run reboot test **Step 8.5.5** |
| PM2 app won’t start | **Windows Server** | Run `node server.js` manually; then `pm2 logs TokenQueue --err --lines 50` |
| PM2 not running after reboot | **Windows Server** | Re-run Step 9.5; confirm `pm2 save`; check auto-login or PM2 service |
| Port 4789 in use | **Windows Server** | `netstat -ano \| findstr :4789` — stop conflicting app or set `PORT` env var (see below) |

### Test TTS from Windows Server browser

On the **Windows Server**, open:

```
http://localhost:4789/api/tts?token=5&room=room1
```

Audio playback or download means TTS is working.

### Change the server port

Default port is **4789**. To use another port:

- Set environment variable `PORT` before starting (e.g. `set PORT=4790` in cmd, then `npm start`), **or**
- Edit `APP_PORT` at the top of `server.js` and restart.

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
npm start              # runs server.js on port 4789
```

### Windows Server (production)

```powershell
cd C:\Apps\token-queue-nest
npm install
npm start              # manual test only

pm2 start ecosystem.config.cjs
pm2 status
pm2 restart TokenQueue
pm2 logs TokenQueue
pm2 save
```

**Command Prompt alternative:** use `windows\install-and-build.bat`, `windows\start-server.bat`, and `windows\setup-autostart.bat` (see [WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md)).

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
- [ ] Display, Room 1, and Room 2 URLs load in browser
- [ ] TTS test URL plays or downloads audio

### Windows Server

- [ ] Node.js installed and in PATH
- [ ] Project copied from Mac (without `node_modules`)
- [ ] `npm install` completed without errors on Windows
- [ ] `server.js` present; `npm start` shows running URLs
- [ ] Windows Firewall allows inbound TCP 4789 on LAN
- [ ] Static LAN IP configured and verified (Step 8.3–8.5; reboot test passed)
- [ ] PM2 installed; `TokenQueue` process saved and auto-start configured (Step 9.5)
- [ ] TTS sample URL plays or downloads from server browser
- [ ] Server has internet access for Urdu announcements

### Clinic devices

- [ ] Display opens `/display` and shows **Live**
- [ ] Display speaker not muted; one screen tap done if browser required it
- [ ] Sample Urdu announcement plays on token call
- [ ] Room 1 and Room 2 panels call tokens successfully
