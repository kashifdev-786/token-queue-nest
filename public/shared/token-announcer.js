/**
 * Token announcer — server TTS only (Microsoft Swara: hi-IN-SwaraNeural).
 * On-screen captions stay Urdu; spoken audio uses clear Urdu-like pronunciation.
 */
(function (global) {
  const URDU_ONES = [
    'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
    'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
  ];
  const URDU_TENS = ['', '', 'بیس', 'تیس', 'چالیس', 'پچاس', 'ساٹھ', 'ستر', 'اسی', 'نوے'];
  const ROOM_PHRASES = {
    room1: 'کمرہ نمبر ایک',
    room2: 'کمرہ نمبر دو',
  };
  const SILENT_WAV =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  const TTS_VOICE = 'hi-IN-SwaraNeural';
  const TTS_RETRIES = 2;

  let enabled = false;
  let pending = null;
  let currentAudio = null;
  let currentObjectUrl = null;

  function tokenToUrduNumber(tokenNumber) {
    const n = parseInt(tokenNumber, 10);
    if (Number.isNaN(n) || n < 0) return String(tokenNumber);
    if (n < 20) return URDU_ONES[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o ? `${URDU_TENS[t]} ${URDU_ONES[o]}` : URDU_TENS[t];
    }
    if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const rest = n % 100;
      const hundredPart = hundreds === 1 ? 'سو' : `${URDU_ONES[hundreds]} سو`;
      if (!rest) return hundredPart;
      return `${hundredPart} ${tokenToUrduNumber(rest)}`;
    }
    return String(tokenNumber);
  }

  function buildAnnouncement(tokenNumber, roomKeyOrName) {
    const token = tokenToUrduNumber(tokenNumber);
    const room = ROOM_PHRASES[roomKeyOrName] || roomKeyOrName;
    return `ٹوکن نمبر ${token}، ${room} میں آ جائیں`;
  }

  function setSpeakerActive(active) {
    const el = document.getElementById('speakerIndicator');
    if (!el) return;
    el.classList.toggle('speaking', active);
    el.setAttribute('aria-label', active ? 'Announcement playing' : 'Speaker ready');
  }

  function updateVoiceStatus(state) {
    const el = document.getElementById('audioStatus');
    if (!el) return;

    if (!enabled) {
      el.textContent = 'Speaker off — tap to enable';
      el.className = 'audio-badge muted';
      return;
    }

    if (state === 'ready') {
      el.textContent = 'Hindi speaker on';
      el.className = 'audio-badge ready';
      return;
    }

    if (state === 'error') {
      el.textContent = 'Speaker unavailable — check internet';
      el.className = 'audio-badge error';
    }
  }

  function revokeObjectUrl() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  function stopAllAudio() {
    setSpeakerActive(false);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
    revokeObjectUrl();
  }

  function playBlob(blob) {
    stopAllAudio();
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      currentObjectUrl = objectUrl;
      const audio = new Audio(objectUrl);
      currentAudio = audio;
      audio.volume = 1;
      audio.onplay = () => setSpeakerActive(true);
      audio.onended = () => {
        setSpeakerActive(false);
        revokeObjectUrl();
        resolve(true);
      };
      audio.onerror = () => {
        setSpeakerActive(false);
        revokeObjectUrl();
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch((err) => {
        setSpeakerActive(false);
        revokeObjectUrl();
        reject(err);
      });
    });
  }

  function unlockAudioPlayback() {
    return new Promise((resolve, reject) => {
      const audio = new Audio(SILENT_WAV);
      audio.volume = 0;
      audio.onended = () => resolve(true);
      audio.onerror = () => reject(new Error('Silent unlock failed'));
      audio.play().then(resolve).catch(reject);
    });
  }

  async function fetchTtsAudio(tokenNumber, roomKey) {
    const url =
      `/api/tts?token=${encodeURIComponent(tokenNumber)}&room=${encodeURIComponent(roomKey)}&_=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`TTS HTTP ${res.status}`);
    }

    const voice = res.headers.get('X-TTS-Voice');
    if (voice && voice !== TTS_VOICE) {
      console.warn('Unexpected TTS voice header:', voice);
    }

    const contentType = res.headers.get('Content-Type') || '';
    if (!contentType.includes('audio')) {
      throw new Error('TTS response is not audio');
    }

    const blob = await res.blob();
    if (!blob.size) {
      throw new Error('TTS audio empty');
    }
    return blob;
  }

  async function speakViaServer(tokenNumber, roomKey) {
    let lastError;

    for (let attempt = 1; attempt <= TTS_RETRIES; attempt++) {
      try {
        const blob = await fetchTtsAudio(tokenNumber, roomKey);
        await playBlob(blob);
        updateVoiceStatus('ready');
        return true;
      } catch (err) {
        lastError = err;
        console.warn(`TTS attempt ${attempt}/${TTS_RETRIES} failed:`, err);
        if (attempt < TTS_RETRIES) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    updateVoiceStatus('error');
    throw lastError;
  }

  async function speakNow(tokenNumber, roomKey) {
    return speakViaServer(tokenNumber, roomKey);
  }

  function speak(tokenNumber, roomKey) {
    if (!enabled) {
      pending = { tokenNumber, roomKey };
      showUnlockOverlay(true);
      return;
    }
    speakNow(tokenNumber, roomKey).catch(() => {});
  }

  async function speakSample() {
    return speakNow(1, 'room1');
  }

  async function enableAudio() {
    enabled = true;
    try {
      sessionStorage.setItem('tokenQueueSwara', '1');
    } catch (_) { /* private mode */ }

    hideUnlockOverlay();

    // Silent unlock only — Swara does NOT speak on enable (browser policy).
    try {
      await unlockAudioPlayback();
      updateVoiceStatus('ready');
    } catch (err) {
      console.warn('Silent audio unlock failed:', err);
      updateVoiceStatus('error');
    }

    if (pending) {
      const next = pending;
      pending = null;
      setTimeout(() => speakNow(next.tokenNumber, next.roomKey).catch(() => {}), 400);
    }

    return true;
  }

  function showUnlockOverlay(force) {
    const overlay = document.getElementById('audioUnlock');
    if (!overlay) return;
    if (force || !enabled) overlay.hidden = false;
  }

  function hideUnlockOverlay() {
    const overlay = document.getElementById('audioUnlock');
    if (overlay) overlay.hidden = true;
  }

  function init() {
    let restored = false;
    try {
      restored = sessionStorage.getItem('tokenQueueSwara') === '1';
    } catch (_) { /* private mode */ }

    if (restored) {
      enabled = true;
      hideUnlockOverlay();
      unlockAudioPlayback()
        .then(() => updateVoiceStatus('ready'))
        .catch(() => updateVoiceStatus('error'));
    } else {
      showUnlockOverlay(true);
      updateVoiceStatus();
    }

    const btn = document.getElementById('enableAudioBtn');
    if (btn) btn.addEventListener('click', enableAudio);

    const badge = document.getElementById('audioStatus');
    if (badge) {
      badge.addEventListener('click', () => {
        if (!enabled) showUnlockOverlay(true);
      });
    }

    const speaker = document.getElementById('speakerIndicator');
    if (speaker) {
      speaker.addEventListener('click', () => {
        if (!enabled) showUnlockOverlay(true);
        else speakSample().catch(() => {});
      });
    }
  }

  global.TokenAnnouncer = { init, enableAudio, speak, buildAnnouncement, speakSample };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
