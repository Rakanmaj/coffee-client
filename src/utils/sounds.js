let audio_context = null;
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
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  return ctx.state === "running";
}

function tone(freq, duration_ms, delay_ms = 0, volume = 0.08) {
  const ctx = get_context();
  if (!ctx || ctx.state !== "running") return;

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
}

export async function playCustomerTone() {
  const ready = await unlockAudio();
  if (!ready || !allowCustomerTone()) return;

  tone(760, 140, 0, 0.065);
}

export async function playReadyTone() {
  const ready = await unlockAudio();
  if (!ready || !allowCustomerTone()) return;

  tone(1040, 170, 0, 0.065);
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

  tone(740, 130, 0, 0.09);
  tone(540, 170, 170, 0.08);
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
