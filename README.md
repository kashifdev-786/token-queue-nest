# Zahid Clinic Eye & Dental — Token Queue System

Real-time LAN token display for **Zahid clinic Eye & Dental**, with staff panels for Room 1 and Room 2 and **Urdu voice announcements** on the hall display.

This product is deployed on a **Windows PC** in the clinic. See the deployment guide for your OS:

| OS | Guide |
|----|-------|
| Windows 10 / Windows Server | [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md) |
| **Windows 7** (no PowerShell) | [WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md) — use **`windows\*.bat`** scripts |

---

## Quick start (development / testing)

Requires **Node.js 12+** (use **Node 12 or 13** on Windows 7).

```bash
cd token-queue-nest
npm install
npm start
```

The server is plain JavaScript (`server.js`) — no TypeScript build step.

On **Windows 7** (Command Prompt only — no PowerShell): copy the project to the server, then double-click `windows\install-and-build.bat` and `windows\start-server.bat`. See [WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md).

Production runs on **Windows Server** at the clinic (develop on Mac, deploy to Windows). See [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md) for the full Mac → Windows step-by-step guide.

## Project structure

| Path | Purpose |
|------|---------|
| `server.js` | Main server (Express + Socket.IO + TTS) |
| `lib/` | Announcement and Edge TTS helpers |
| `public/` | Display and staff panel pages |
| `windows/` | Windows `.bat` install/start scripts |
| `ecosystem.config.cjs` | PM2 config for Windows Server |

---

## Access URLs

Replace `SERVER_IP` with your Windows Server LAN address (example: `192.168.1.10`).

| Screen | URL |
|--------|-----|
| Hall display (TV) | `http://SERVER_IP:4789/display` |
| Room 1 — Consultation (Dr. Zahid Chaudhry) | `http://SERVER_IP:4789/room1` |
| Room 2 — Basic eye checkup & counseling | `http://SERVER_IP:4789/room2` |

---

## Features

- Real-time token updates via WebSocket
- Urdu announcements on token call (clear **Swara** voice — natural Urdu-like speech)
- Room 1 & Room 2 staff panels with Next / Previous
- Custom and preset announcements on the hall ticker
- Runs on clinic LAN; server needs internet only for voice synthesis

---

## Client browsers

- **Display TV:** Chrome or Edge, fullscreen (F11); speaker on by default — tap screen once if browser blocks audio
- **Staff tablets:** Chrome or Edge; bookmark Room 1 / Room 2 URLs

---

## Documentation

| Document | Purpose |
|----------|---------|
| [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md) | Windows 10/Server install, firewall, PM2, troubleshooting |
| [WINDOWS-7-DEPLOYMENT.md](./WINDOWS-7-DEPLOYMENT.md) | Windows 7 + Command Prompt (`.bat` scripts, no PowerShell) |
