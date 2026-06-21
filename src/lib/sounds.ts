// ============================================================
// Sistema de sonidos con Web Audio API
// No requiere archivos externos — genera tonos programáticos
// ============================================================

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Tono base: frecuencia, duración, tipo de onda, volumen
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0,
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // Silenciar errores de audio (navegador sin soporte)
  }
}

// Navegación entre tabs — clic suave
export function playNavSound() {
  playTone(800, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(1000, 0.06, 'sine', 0.06), 60);
}

// Subida en el podio — escala ascendente
export function playPodiumRiseSound() {
  const notes = [262, 330, 392, 523]; // Do Mi Sol Do (escala ascendente)
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'triangle', 0.12, i * 0.12);
  });
}

// Cambio de posición en ranking — tono corto ascendente
export function playRankChangeSound() {
  playTone(440, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(554, 0.1, 'triangle', 0.1), 80);
  setTimeout(() => playTone(659, 0.15, 'triangle', 0.12), 160);
}

// Apuesta registrada — sonido potente (combinación de ondas)
export function playBetSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Bajo profundo
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 110; // A2
  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Golpe seco (cuadrado)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.value = 220;
  gain2.gain.setValueAtTime(0.12, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.25);

  // Brillante (triángulo agudo)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'triangle';
  osc3.frequency.value = 880;
  gain3.gain.setValueAtTime(0.1, now + 0.1);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.start(now + 0.1);
  osc3.stop(now + 0.4);

  // Sweep ascendente (para dar sensación de "logro")
  const osc4 = ctx.createOscillator();
  const gain4 = ctx.createGain();
  osc4.type = 'sine';
  osc4.frequency.setValueAtTime(400, now + 0.05);
  osc4.frequency.linearRampToValueAtTime(1200, now + 0.35);
  gain4.gain.setValueAtTime(0.06, now + 0.05);
  gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc4.connect(gain4);
  gain4.connect(ctx.destination);
  osc4.start(now + 0.05);
  osc4.stop(now + 0.4);
}

// Error / acción bloqueada
export function playErrorSound() {
  playTone(200, 0.15, 'square', 0.08);
  setTimeout(() => playTone(160, 0.2, 'square', 0.06), 120);
}

// Inicializar audio (requiere interacción del usuario)
export function initAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {
    console.warn('Audio not available');
  }
}
