# Zahid Clinic Eye & Dental — Token Queue System

Real-time LAN token display for **Zahid clinic Eye & Dental**, with staff panels for Room 1 and Room 2 and **Urdu voice announcements** on the hall display.

This product is deployed on **Windows Server** in the clinic. See the full deployment guide:

**→ [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md)**

---

## Quick start (development / testing)

Requires **Node.js v20+**.

```powershell
cd token-queue-nest
npm install
npm start
```

Production on Windows Server uses `npm run build` and `npm run start:prod` — details are in [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md).

---

## Access URLs

Replace `SERVER_IP` with your Windows Server LAN address (example: `192.168.1.10`).

| Screen | URL |
|--------|-----|
| Hall display (TV) | `http://SERVER_IP:3000/display` |
| Room 1 — Consultation (Dr. Zahid Chaudhry) | `http://SERVER_IP:3000/room1` |
| Room 2 — Basic eye checkup & counseling | `http://SERVER_IP:3000/room2` |

---

## Features

- Real-time token updates via WebSocket
- Urdu announcements on token call (clear **Swara** voice — natural Urdu-like speech)
- Room 1 & Room 2 staff panels with Next / Previous
- Custom and preset announcements on the hall ticker
- Runs on clinic LAN; server needs internet only for voice synthesis

---

## Client browsers

- **Display TV:** Chrome or Edge, fullscreen (F11), enable speaker once
- **Staff tablets:** Chrome or Edge; bookmark Room 1 / Room 2 URLs

---

## Documentation

| Document | Purpose |
|----------|---------|
| [WINDOWS-SERVER-DEPLOYMENT.md](./WINDOWS-SERVER-DEPLOYMENT.md) | Full Windows Server install, firewall, PM2 process manager, troubleshooting |
