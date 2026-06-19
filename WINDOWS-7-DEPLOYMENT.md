# Zahid Clinic Token Queue — Windows 7 Deployment (Command Prompt)

Use this guide when the clinic server runs **Windows 7** and **PowerShell does not open** or is unavailable. Every step uses **Command Prompt (cmd.exe)** or **double-click `.bat` files** — no PowerShell, no build step.

The server is plain **JavaScript** (`server.js`) and runs on **Node.js 12 or 13** (the last versions that install on Windows 7).

For **Windows 10 / Windows Server**, see [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md) (PowerShell + optional PM2). The same `server.js` runs on both — only the Node.js version and startup method differ.

---

## Quick setup (no PowerShell)

1. Copy the project folder to the server, for example:

   ```
   C:\Apps\token-queue-nest
   ```

2. Install **Node.js 12.22.12** or **13.14.0** (last versions for Windows 7) from [https://nodejs.org/dist/](https://nodejs.org/dist/). Check **“Add to PATH”** during setup.

3. Open **Command Prompt** (Start → type `cmd` → Enter).

4. Run the included scripts from the `windows` folder:

   | Action | How |
   |--------|-----|
   | Check Node and install | Double-click `windows\check-environment.bat`, then `windows\install-and-build.bat` |
   | Start server (test) | Double-click `windows\start-server.bat` |
   | Open firewall | Right-click `windows\open-firewall.bat` → **Run as administrator** |
   | Auto-start on login | Double-click `windows\setup-autostart.bat` |

---

## Step-by-step

### 1 — Open Command Prompt

- Press **Win + R**, type `cmd`, press **Enter**  
  **or**
- Start → All Programs → Accessories → **Command Prompt**

Do **not** use PowerShell.

### 2 — Verify Node.js

```cmd
node -v
npm -v
```

You should see version numbers (for example `v12.22.12` or `v13.14.0`). If `node` is not recognized, reinstall Node.js and restart Command Prompt.

### 3 — Install dependencies

**Option A — double-click:** `C:\Apps\token-queue-nest\windows\install-and-build.bat`

**Option B — Command Prompt:**

```cmd
cd /d C:\Apps\token-queue-nest
windows\install-and-build.bat
```

Wait until you see `SUCCESS: Ready to run`. No compile step — the app runs directly from `server.js`.

### 4 — Test the server

Double-click `windows\start-server.bat` or run:

```cmd
cd /d C:\Apps\token-queue-nest
windows\start-server.bat
```

On the **same PC**, open a browser and go to:

| Page | URL |
|------|-----|
| Display | `http://localhost:4789/display` |
| Room 1 | `http://localhost:4789/room1` |
| Room 2 | `http://localhost:4789/room2` |

Stop the test with **Ctrl+C** in the Command Prompt window.

### 5 — Open firewall (port 4789)

Other clinic PCs and tablets need inbound TCP **4789**.

**GUI (Windows 7):**

1. Start → Control Panel → **Windows Firewall**
2. **Advanced settings** → **Inbound Rules** → **New Rule…**
3. **Port** → TCP → **4789** → **Allow** → name: `Zahid Clinic Token Queue`

**Command (run cmd as Administrator):**

Right-click **Command Prompt** → **Run as administrator**, then:

```cmd
cd /d C:\Apps\token-queue-nest
windows\open-firewall.bat
```

Or one line:

```cmd
netsh advfirewall firewall add rule name="Zahid Clinic Token Queue" dir=in action=allow protocol=TCP localport=4789
```

### 6 — Set a static LAN IP (recommended)

Use the **Control Panel** GUI on Windows 7 (PowerShell commands in the main deployment guide do not apply):

1. **Win + R** → `ncpa.cpl` → Enter
2. Right-click **Local Area Connection** (or your adapter) → **Properties**
3. **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
4. **Use the following IP address** (example):

   | Field | Example |
   |-------|---------|
   | IP address | `192.168.1.10` |
   | Subnet mask | `255.255.255.0` |
   | Default gateway | `192.168.1.1` |

5. **Use the following DNS server addresses** → Preferred: `192.168.1.1` or `8.8.8.8`

Check the IP:

```cmd
ipconfig
```

Use this IP in clinic URLs: `http://192.168.1.10:4789/display` (replace with your IP).

### 7 — Auto-start when Windows logs in

PM2 and `pm2-windows-startup` often depend on PowerShell. On Windows 7, use the included **Startup folder** script instead:

```cmd
cd /d C:\Apps\token-queue-nest
windows\setup-autostart.bat
```

This creates a startup entry that runs the server in the background and writes logs to `logs\server.log`.

To remove auto-start:

```cmd
windows\remove-autostart.bat
```

**Note:** The server starts when a user **logs in**. Enable **automatic login** for the clinic account if the PC reboots without anyone signing in.

### 8 — Clinic device URLs

Replace `SERVER_IP` with your server IP from `ipconfig`:

```
http://SERVER_IP:4789/display
http://SERVER_IP:4789/room1
http://SERVER_IP:4789/room2
```

**Browsers on Windows 7:** Use the newest **Google Chrome** you can install. Very old IE will not work reliably with this app.

---

## Daily commands (Command Prompt)

```cmd
cd /d C:\Apps\token-queue-nest

REM Start server (window stays open)
windows\start-server.bat

REM View background log
type logs\server.log

REM After copying updated project files
windows\install-and-build.bat
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| PowerShell will not open | Use **cmd** and the `windows\*.bat` scripts only |
| `node` is not recognized | Reinstall Node.js; restart Command Prompt; confirm PATH |
| Node installer fails on Win7 | Use **Node 12.22.12** or **13.14.0** from [nodejs.org/dist](https://nodejs.org/dist/) |
| `npm install` fails | Run `windows\check-environment.bat`; read errors in the cmd window |
| Page works on server, not on tablets | Run `open-firewall.bat` as admin; use `SERVER_IP`, not `localhost` |
| No voice on display | Server needs **internet** for Urdu TTS; tap display once for browser audio |
| Server not running after reboot | Run `setup-autostart.bat`; enable Windows auto-login |
| Port 4789 in use | `netstat -ano \| findstr :4789` then stop the other program |

### Test TTS

On the server browser:

```
http://localhost:4789/api/tts?token=5&room=room1
```

---

## Project layout (what runs in production)

```
token-queue-nest\
  server.js          ← start this (or use start-server.bat)
  lib\               ← TTS and announcement helpers
  public\            ← display and room HTML
  package.json
  windows\           ← .bat scripts for cmd.exe
```

---

## Script reference

All scripts live in `windows\`:

| Script | Purpose |
|--------|---------|
| `check-environment.bat` | Verify Node, npm, and `server.js` |
| `install-and-build.bat` | `npm install` only (no TypeScript build) |
| `start-server.bat` | Run server in this window (for testing) |
| `start-server-background.bat` | Run server silently (used by auto-start) |
| `open-firewall.bat` | Allow inbound TCP 4789 (admin) |
| `setup-autostart.bat` | Start server when user logs in |
| `remove-autostart.bat` | Remove login auto-start |

---

## Support checklist (Windows 7)

- [ ] Node.js installs and `node -v` works in **cmd**
- [ ] `windows\install-and-build.bat` completes without errors
- [ ] `windows\start-server.bat` shows running URLs
- [ ] Firewall allows port **4789**
- [ ] Static LAN IP set via Control Panel (`ncpa.cpl`)
- [ ] `windows\setup-autostart.bat` run (or server started manually each day)
- [ ] Display and room URLs open from tablets on the LAN
- [ ] Urdu announcement test URL works when internet is available
