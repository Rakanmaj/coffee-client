let audio_context = null;
let audio_primed = false;
let audio_element = null;
let audio_element_primed = false;
let cashier_loop = null;
let last_customer_tone_at = 0;

function get_context() {
  if (typeof window === "undefined") return null;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audio_context) {
    audio_context = new AudioContext();
  }

  return audio_context;
}

export async function unlockAudio() {
  const ctx = get_context();
  if (!ctx) return prime_media_audio();

  if (ctx.state === "suspended") {
    try {
      await Promise.race([
        ctx.resume(),
        new Promise((resolve) => window.setTimeout(resolve, 300)),
      ]);
    } catch {
      return false;
    }
  }

  if (ctx.state === "running") {
    prime_output(ctx);
  }

  const media_ready = await prime_media_audio();
  return ctx.state === "running" || media_ready;
}

function prime_output(ctx) {
  if (audio_primed) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;
    const end = start + 0.03;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.00001, end);
    osc.frequency.setValueAtTime(440, start);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
    audio_primed = true;
  } catch {
    audio_primed = false;
  }
}

function tone(freq, duration_ms, delay_ms = 0, volume = 0.08) {
  const ctx = get_context();
  if (!ctx || ctx.state !== "running") return false;

  const start = ctx.currentTime + delay_ms / 1000;
  const end = start + duration_ms / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
  return true;
}

function get_media_audio() {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;

  if (!audio_element) {
    audio_element = new Audio(build_alert_wav_url());
    audio_element.preload = "auto";
    audio_element.volume = 1;
    audio_element.setAttribute("playsinline", "true");
  }

  return audio_element;
}

async function prime_media_audio() {
  const audio = get_media_audio();
  if (!audio || audio_element_primed) return Boolean(audio_element_primed);

  try {
    audio.volume = 0.01;
    audio.currentTime = 0;
    await Promise.race([
      audio.play(),
      new Promise((resolve) => window.setTimeout(resolve, 350)),
    ]);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    audio_element_primed = true;
    return true;
  } catch {
    audio.volume = 1;
    return false;
  }
}

async function play_media_alert() {
  const audio = get_media_audio();
  if (!audio) return false;

  try {
    audio.pause();
    audio.volume = 1;
    audio.currentTime = 0;
    await audio.play();
    audio_element_primed = true;
    return true;
  } catch {
    return false;
  }
}

function build_alert_wav_url() {
  const sample_rate = 44100;
  const duration_seconds = 0.58;
  const sample_count = Math.floor(sample_rate * duration_seconds);
  const data_size = sample_count * 2;
  const buffer = new ArrayBuffer(44 + data_size);
  const view = new DataView(buffer);

  write_string(view, 0, "RIFF");
  view.setUint32(4, 36 + data_size, true);
  write_string(view, 8, "WAVE");
  write_string(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sample_rate, true);
  view.setUint32(28, sample_rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write_string(view, 36, "data");
  view.setUint32(40, data_size, true);

  for (let i = 0; i < sample_count; i += 1) {
    const time = i / sample_rate;
    const active =
      (time >= 0 && time < 0.18) ||
      (time >= 0.26 && time < 0.5);
    const freq = time < 0.22 ? 880 : 660;
    const fade = Math.min(1, time * 50, (duration_seconds - time) * 50);
    const sample = active
      ? Math.sin(2 * Math.PI * freq * time) * 0.74 * fade
      : 0;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:audio/wav;base64,${window.btoa(binary)}`;
}

function write_string(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

export async function playCustomerTone() {
  const ready = await unlockAudio();
  if (!ready || !allowCustomerTone()) return;

  if (!tone(760, 180, 0, 0.18)) {
    play_media_alert();
  }
}

export async function playReadyTone() {
  const ready = await unlockAudio();
  if (!ready || !allowCustomerTone()) return;

  if (!tone(1040, 210, 0, 0.18)) {
    play_media_alert();
  }
}

function allowCustomerTone() {
  const now = Date.now();
  if (now - last_customer_tone_at < 750) return false;

  last_customer_tone_at = now;
  return true;
}

export async function playCashierAlert() {
  const ready = await unlockAudio();
  if (!ready) return;

  tone(880, 190, 0, 0.22);
  tone(660, 240, 260, 0.2);
  play_media_alert();

  if (navigator.vibrate) {
    navigator.vibrate([120, 80, 160]);
  }
}

export function startCashierLoop() {
  if (cashier_loop) return;

  playCashierAlert();
  cashier_loop = window.setInterval(playCashierAlert, 1400);
}

export function stopCashierLoop() {
  if (!cashier_loop) return;

  window.clearInterval(cashier_loop);
  cashier_loop = null;
}
