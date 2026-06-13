/**
 * Token announcer — server TTS only (Microsoft Swara: hi-IN-SwaraNeural).
 * Speaker is ON by default; user mutes with one button. Preference persists in localStorage.
 */
(function (global) {
  const URDU_NUMBERS = [
    'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
    'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس', 'بیس',
    'اکیس', 'بائیس', 'تئیس', 'چوبیس', 'پچیس', 'چھبیس', 'ستائیس', 'اٹھائیس', 'انتیس', 'تیس',
    'اکتیس', 'بتیس', 'تینتیس', 'چونتیس', 'پینتیس', 'چھتیس', 'سینتیس', 'اڑتیس', 'انتالیس', 'چالیس',
    'اکتالیس', 'بیالیس', 'تینتالیس', 'چوالیس', 'پینتالیس', 'چھیالیس', 'سینتالیس', 'اڑتالیس', 'انچاس', 'پچاس',
    'اکاون', 'باون', 'ترپن', 'چون', 'پچپن', 'چھپن', 'ستاون', 'اٹھاون', 'انسٹھ', 'ساٹھ',
    'اکسٹھ', 'باسٹھ', 'تریسٹھ', 'چونسٹھ', 'پینسٹھ', 'چھاسٹھ', 'سڑسٹھ', 'اڑسٹھ', 'انہتر', 'ستر',
    'اکہتر', 'بہتر', 'تہتر', 'چوہتر', 'پچھتر', 'چھہتر', 'ستتر', 'اٹھتر', 'اناسی', 'اسی',
    'اکاسی', 'بیاسی', 'تراسی', 'چوراسی', 'پچاسی', 'چھیاسی', 'ستاسی', 'اٹاسی', 'نواسی', 'نوے',
    'اکانوے', 'بانوے', 'ترانوے', 'چورانوے', 'پچانوے', 'چھیانوے', 'ستانوے', 'اٹھانوے', 'ننانوے',
  ];
  const ROOM_PHRASES = {
    room1: 'کمرہ نمبر ایک',
    room2: 'کمرہ نمبر دو',
  };
  const SILENT_WAV =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  const TTS_VOICE = 'hi-IN-SwaraNeural';
  const TTS_RETRIES = 2;
  const MUTE_STORAGE_KEY = 'tokenQueueSpeakerMuted';

  let muted = false;
  let unlocked = false;
  let pending = null;
  let pendingBlob = null;
  let currentAudio = null;
  let currentObjectUrl = null;
  let audioCtx = null;
  let unlockListenerAttached = false;
  const blobCache = new Map();

  const MAX_TOKEN_NUMBER = 1000;

  function loadMuted() {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function saveMuted(value) {
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, value ? '1' : '0');
    } catch (_) { /* private mode */ }
  }

  function tokenToUrduNumber(tokenNumber) {
    const n = parseInt(tokenNumber, 10);
    if (Number.isNaN(n) || n < 0) return String(tokenNumber);
    if (n === MAX_TOKEN_NUMBER) return 'ایک ہزار';
    if (n < 100) return URDU_NUMBERS[n];
    if (n < MAX_TOKEN_NUMBER) {
      const hundreds = Math.floor(n / 100);
      const rest = n % 100;
      const hundredPart = hundreds === 1 ? 'سو' : `${URDU_NUMBERS[hundreds]} سو`;
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
    const el = document.getElementById('speakerMuteBtn');
    if (!el) return;
    el.classList.toggle('speaking', active);
  }

  function syncMuteUi() {
    const muteBtn = document.getElementById('speakerMuteBtn');
    const statusEl = document.getElementById('audioStatus');

    if (muteBtn) {
      muteBtn.classList.toggle('is-muted', muted);
      muteBtn.title = muted ? 'Unmute announcements' : 'Mute announcements';
      muteBtn.setAttribute('aria-label', muted ? 'Unmute speaker' : 'Mute speaker');
    }

    if (statusEl && !statusEl.classList.contains('error')) {
      if (muted) {
        statusEl.textContent = 'Speaker muted';
        statusEl.className = 'audio-badge muted';
      } else if (pendingBlob) {
        statusEl.textContent = 'Tap screen once to play';
        statusEl.className = 'audio-badge warn';
      } else {
        statusEl.textContent = 'Speaker on';
        statusEl.className = 'audio-badge ready';
      }
    }
  }

  function updateVoiceStatus(state) {
    const el = document.getElementById('audioStatus');
    if (!el) return;

    if (muted) {
      syncMuteUi();
      return;
    }

    if (state === 'ready') {
      el.textContent = 'Speaker on';
      el.className = 'audio-badge ready';
      return;
    }

    if (state === 'ttsFailed') {
      el.textContent = 'TTS unavailable — check server internet';
      el.className = 'audio-badge error';
      return;
    }

    if (state === 'serverFailed') {
      el.textContent = 'Cannot reach queue server';
      el.className = 'audio-badge error';
      return;
    }

    if (state === 'playbackFailed') {
      el.textContent = 'Playback failed — tap mute to retry';
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

  async function resumeAudioContext() {
    const Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  }

  async function unlockAudioPlayback() {
    await resumeAudioContext();
    const audio = new Audio(SILENT_WAV);
    audio.volume = 0;
    audio.preload = 'auto';
    await audio.play();
    unlocked = true;
    return true;
  }

  async function tryPlayPending() {
    if (muted || !pendingBlob) return false;
    try {
      if (!unlocked) await unlockAudioPlayback();
      const blob = pendingBlob;
      pendingBlob = null;
      pending = null;
      await playBlob(blob);
      updateVoiceStatus('ready');
      syncMuteUi();
      return true;
    } catch (err) {
      console.warn('Pending playback failed:', err);
      unlocked = false;
      return false;
    }
  }

  function tryUnlockSilently() {
    if (unlocked || muted) {
      if (unlocked) tryPlayPending();
      return;
    }
    unlockAudioPlayback()
      .then(() => tryPlayPending())
      .catch(() => {});
  }

  function setupAutoUnlockOnInteraction() {
    if (unlockListenerAttached) return;
    unlockListenerAttached = true;

    const unlockOnce = () => {
      if (muted) return;
      unlockAudioPlayback()
        .then(() => tryPlayPending())
        .catch(() => {});
      if (unlocked && !pendingBlob) {
        document.removeEventListener('pointerdown', unlockOnce, true);
        document.removeEventListener('keydown', unlockOnce, true);
      }
    };

    document.addEventListener('pointerdown', unlockOnce, true);
    document.addEventListener('keydown', unlockOnce, true);
  }

  function classifyTtsError(err) {
    const message = err && err.message ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return 'serverFailed';
    }
    if (/TTS HTTP|not audio|audio empty|unavailable/i.test(message)) {
      return 'ttsFailed';
    }
    if (/playback|play\(\)|Silent unlock/i.test(message)) {
      return 'playbackFailed';
    }
    return 'ttsFailed';
  }

  async function fetchTtsBlob(url, useCache) {
    let res;
    try {
      res = await fetch(url, useCache ? {} : { cache: 'no-store' });
    } catch (err) {
      throw new Error(`Network error: ${err.message || err}`);
    }

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

  async function fetchTtsAudio(tokenNumber, roomKey) {
    const key = `${roomKey}:${tokenNumber}`;
    const cached = blobCache.get(key);
    if (cached) return cached;

    const url =
      `/api/tts?token=${encodeURIComponent(tokenNumber)}&room=${encodeURIComponent(roomKey)}`;
    const blob = await fetchTtsBlob(url, true);
    blobCache.set(key, blob);
    return blob;
  }

  async function ensureUnlockedIfNeeded() {
    if (unlocked || muted) return;
    try {
      await unlockAudioPlayback();
    } catch (_) {
      unlocked = false;
    }
  }

  async function speakViaServer(tokenNumber, roomKey) {
    if (muted) return false;

    let blob;
    try {
      const fetchPromise = fetchTtsAudio(tokenNumber, roomKey);
      const unlockPromise = ensureUnlockedIfNeeded();
      [blob] = await Promise.all([fetchPromise, unlockPromise]);
    } catch (err) {
      updateVoiceStatus(classifyTtsError(err));
      throw err;
    }

    let lastError;
    let lastState = 'playbackFailed';

    for (let attempt = 1; attempt <= TTS_RETRIES; attempt++) {
      try {
        if (!unlocked) {
          await unlockAudioPlayback();
        }
        pendingBlob = null;
        pending = null;
        await playBlob(blob);
        updateVoiceStatus('ready');
        syncMuteUi();
        return true;
      } catch (err) {
        lastError = err;
        lastState = classifyTtsError(err);
        console.warn(`TTS playback attempt ${attempt}/${TTS_RETRIES} failed:`, err);
        if (lastState === 'playbackFailed') {
          unlocked = false;
          pendingBlob = blob;
          pending = { tokenNumber, roomKey };
          syncMuteUi();
          return false;
        }
        if (attempt < TTS_RETRIES) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    updateVoiceStatus(lastState);
    throw lastError;
  }

  async function speakNow(tokenNumber, roomKey) {
    return speakViaServer(tokenNumber, roomKey);
  }

  function speak(tokenNumber, roomKey) {
    if (muted) return;
    speakNow(tokenNumber, roomKey).catch(() => {});
  }

  async function speakSample() {
    if (muted) return false;
    return speakNow(1, 'room1');
  }

  function toggleMute() {
    muted = !muted;
    saveMuted(muted);

    if (muted) {
      stopAllAudio();
      pending = null;
      pendingBlob = null;
    } else {
      tryUnlockSilently();
      if (pending) {
        setTimeout(() => tryPlayPending().catch(() => {}), 200);
      }
    }

    syncMuteUi();
    return muted;
  }

  function setMuted(value) {
    if (muted === value) return;
    muted = value;
    saveMuted(muted);
    if (muted) {
      stopAllAudio();
      pending = null;
      pendingBlob = null;
    } else {
      tryUnlockSilently();
    }
    syncMuteUi();
  }

  function init() {
    muted = loadMuted();
    syncMuteUi();
    setupAutoUnlockOnInteraction();
    tryUnlockSilently();

    const muteBtn = document.getElementById('speakerMuteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', async () => {
        const wasMuted = muted;
        toggleMute();
        if (!wasMuted && muted) return;
        if (!muted) {
          try {
            await unlockAudioPlayback();
            await tryPlayPending();
            updateVoiceStatus('ready');
            syncMuteUi();
          } catch (err) {
            console.warn('Speaker unlock failed:', err);
          }
        }
      });
    }
  }

  global.TokenAnnouncer = {
    init,
    speak,
    buildAnnouncement,
    speakSample,
    toggleMute,
    setMuted,
    isMuted: () => muted,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
