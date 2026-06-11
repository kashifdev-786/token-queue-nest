/**
 * Urdu token announcer — uses server TTS (Microsoft Urdu neural voice).
 * Browser speech is only used as fallback when an Urdu system voice exists.
 */
(function (global) {
  const URDU_DIGITS = ['صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو'];
  const URDU_ONES = [
    'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
    'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
  ];
  const URDU_TENS = ['', '', 'بیس', 'تیس', 'چالیس', 'پچاس', 'ساٹھ', 'ستر', 'اسی', 'نوے'];
  const ROOM_PHRASES = {
    room1: 'کمرہ نمبر ایک',
    room2: 'کمرہ نمبر دو',
  };

  const synth = window.speechSynthesis;
  let voices = [];
  let enabled = false;
  let pending = null;
  let currentAudio = null;
  let useServerTts = true;

  function tokenDigitsToUrdu(tokenNumber) {
    return String(tokenNumber)
      .split('')
      .map((d) => URDU_DIGITS[parseInt(d, 10)] || d)
      .join(' ');
  }

  function tokenToUrduNumber(tokenNumber) {
    const n = parseInt(tokenNumber, 10);
    if (Number.isNaN(n) || n < 0) return String(tokenNumber);
    if (n < 20) return URDU_ONES[n];
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return ones ? `${URDU_TENS[tens]} ${URDU_ONES[ones]}` : URDU_TENS[tens];
    }
    if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const rest = n % 100;
      const hundredPart = hundreds === 1 ? 'سو' : `${URDU_ONES[hundreds]} سو`;
      if (!rest) return hundredPart;
      return `${hundredPart} ${tokenToUrduNumber(rest)}`;
    }
    return tokenDigitsToUrdu(tokenNumber);
  }

  function buildAnnouncement(tokenNumber, roomKeyOrName) {
    const token = tokenToUrduNumber(tokenNumber);
    const room = ROOM_PHRASES[roomKeyOrName] || roomKeyOrName;
    return `ٹوکن نمبر ${token}، ${room} میں آ جائیں`;
  }

  function pickUrduVoice() {
    if (!synth) return null;
    if (!voices.length) voices = synth.getVoices();
    return (
      voices.find((v) => v.lang === 'ur-PK') ||
      voices.find((v) => v.lang.startsWith('ur')) ||
      voices.find((v) => /urdu/i.test(v.name)) ||
      null
    );
  }

  function loadVoices() {
    voices = synth ? synth.getVoices() : [];
    updateVoiceStatus();
  }

  function updateVoiceStatus(mode) {
    const el = document.getElementById('audioStatus');
    if (!el) return;

    if (!enabled) {
      el.textContent = 'آڈیو بند — فعال کریں';
      el.className = 'audio-badge muted';
      return;
    }

    if (mode === 'server') {
      el.textContent = 'اردو آڈیو فعال';
      el.className = 'audio-badge ready';
      return;
    }

    if (mode === 'browser') {
      el.textContent = 'اردو آڈیو (سسٹم)';
      el.className = 'audio-badge ready';
      return;
    }

    if (useServerTts) {
      el.textContent = 'اردو آڈیو فعال';
      el.className = 'audio-badge ready';
      return;
    }

    const voice = pickUrduVoice();
    if (voice) {
      el.textContent = 'اردو آڈیو (سسٹم)';
      el.className = 'audio-badge ready';
    } else {
      el.textContent = 'سرور انٹرنیٹ چیک کریں';
      el.className = 'audio-badge error';
    }
  }

  function stopAllAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
    if (synth) synth.cancel();
  }

  function playAudioUrl(url) {
    stopAllAudio();
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      currentAudio = audio;
      audio.volume = 1;
      audio.onended = () => resolve(true);
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    });
  }

  async function speakViaServer(tokenNumber, roomKey, isTest) {
    const url = isTest
      ? `/api/tts?test=1&_=${Date.now()}`
      : `/api/tts?token=${encodeURIComponent(tokenNumber)}&room=${encodeURIComponent(roomKey)}&_=${Date.now()}`;

    await playAudioUrl(url);
    useServerTts = true;
    updateVoiceStatus('server');
    return true;
  }

  function speakViaBrowser(text) {
    const voice = pickUrduVoice();
    if (!voice || !synth) return false;

    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voice.lang || 'ur-PK';
    utter.voice = voice;
    utter.rate = 0.82;
    utter.volume = 1;
    synth.speak(utter);
    useServerTts = false;
    updateVoiceStatus('browser');
    return true;
  }

  async function speakNow(tokenNumber, roomKey, isTest) {
    if (isTest) {
      try {
        return await speakViaServer(null, null, true);
      } catch {
        return speakViaBrowser('آڈیو سسٹم فعال ہے');
      }
    }

    const text = buildAnnouncement(tokenNumber, roomKey);

    try {
      return await speakViaServer(tokenNumber, roomKey, false);
    } catch (err) {
      console.warn('Server Urdu TTS failed, trying browser Urdu voice:', err);
      if (speakViaBrowser(text)) return true;
      updateVoiceStatus('error');
      return false;
    }
  }

  function speak(tokenNumber, roomKey) {
    if (!enabled) {
      pending = { tokenNumber, roomKey };
      showUnlockOverlay(true);
      return;
    }
    speakNow(tokenNumber, roomKey, false);
  }

  async function enableAudio() {
    enabled = true;
    hideUnlockOverlay();
    loadVoices();

    if (synth) {
      const prime = new SpeechSynthesisUtterance(' ');
      prime.volume = 0.01;
      synth.speak(prime);
      synth.cancel();
    }

    await speakNow(null, null, true);

    if (pending) {
      const next = pending;
      pending = null;
      setTimeout(() => speakNow(next.tokenNumber, next.roomKey, false), 800);
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
    loadVoices();
    if (synth) synth.onvoiceschanged = loadVoices;
    showUnlockOverlay(true);
    updateVoiceStatus();

    const btn = document.getElementById('enableAudioBtn');
    if (btn) btn.addEventListener('click', enableAudio);

    const badge = document.getElementById('audioStatus');
    if (badge) {
      badge.addEventListener('click', () => {
        if (!enabled) showUnlockOverlay(true);
      });
    }
  }

  global.TokenAnnouncer = { init, enableAudio, speak, buildAnnouncement };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
