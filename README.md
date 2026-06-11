# 👁 Eye Hospital Token Queue System

Real-time LAN-based token display with Urdu voice announcements.

---

## Setup

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Install dependencies
```bash
cd eye-hospital-token-queue
npm install
```

### 3. Run the server
```bash
npm start
```

---

## Access URLs

Find your MacBook's LAN IP:
```bash
ipconfig getifaddr en0
# Example: 192.168.1.10
```

| Screen | URL |
|---|---|
| 📺 Display Hall (TV/projector) | `http://192.168.1.10:3000/display` |
| 🩺 Room 1 Panel (staff tablet) | `http://192.168.1.10:3000/room1` |
| 👨‍⚕️ Room 2 Panel (staff tablet) | `http://192.168.1.10:3000/room2` |

---

## Features
- ✅ Real-time token update via WebSocket
- ✅ Urdu voice announcement on each token call (`ur-PK`)
- ✅ Quick Next / Previous token buttons
- ✅ Custom + preset announcements (ticker on display)
- ✅ No internet required — fully LAN-based

---

## Notes
- Voice works best in Chrome/Edge (best `ur-PK` voice support)
- Display screen should be opened in Chrome fullscreen (F11)
- Server must stay running on the MacBook
