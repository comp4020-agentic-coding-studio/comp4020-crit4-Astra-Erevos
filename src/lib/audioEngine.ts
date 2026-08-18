// Orbit's sound: one AudioContext created lazily on the player's first
// gesture (browsers block audio before that), driving a single sustained
// voice that glides between notes as the gesture moves, plus a short delay
// loop so a phrase trails off instead of stopping dead.

const PENTATONIC_STEPS = [0, 2, 4, 7, 9]; // major pentatonic, semitones from root
const ROOT_HZ = 220; // A3
const OCTAVE_SPAN = 3;
const STEPS_PER_TURN = PENTATONIC_STEPS.length * OCTAVE_SPAN;

function noteFrequency(angle: number): number {
  const index = Math.round(angle * (STEPS_PER_TURN - 1));
  const octave = Math.floor(index / PENTATONIC_STEPS.length);
  const step = PENTATONIC_STEPS[index % PENTATONIC_STEPS.length];
  return ROOT_HZ * 2 ** (octave + step / 12);
}

interface Voice {
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export class OrbitEngine {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private voice: Voice | undefined;

  private ensureContext(): { context: AudioContext; master: GainNode } {
    if (!this.context || !this.master) {
      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextCtor();

      const master = context.createGain();
      master.gain.value = 0.9;
      master.connect(context.destination);

      // A short feedback delay: a note that stops still rings on for a beat,
      // so a brief gesture leaves an audible trace instead of just a click.
      const delay = context.createDelay(1);
      delay.delayTime.value = 0.32;
      const feedback = context.createGain();
      feedback.gain.value = 0.32;
      const wet = context.createGain();
      wet.gain.value = 0.35;
      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(master);

      this.context = context;
      this.master = master;
    }
    if (this.context.state === "suspended") void this.context.resume();
    return { context: this.context, master: this.master };
  }

  /** angle: 0..1 around the core, maps to a pentatonic pitch.
   *  distance: 0..1 from the core, maps to filter brightness/register.
   *  intensity: 0..1, from gesture speed, maps to loudness/resonance. */
  play(angle: number, distance: number, intensity: number): void {
    const { context, master } = this.ensureContext();
    this.teardownVoice(0.03);

    const frequency = noteFrequency(angle);
    const oscA = context.createOscillator();
    oscA.type = "triangle";
    oscA.frequency.value = frequency;
    const oscB = context.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = frequency * 2;
    oscB.detune.value = -8;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 5200 - distance * 4400;
    filter.Q.value = 1.5 + intensity * 4;

    const gain = context.createGain();
    const now = context.currentTime;
    const peak = 0.12 + intensity * 0.28;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.02);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    oscA.start();
    oscB.start();
    this.voice = { oscA, oscB, filter, gain };
  }

  /** Glides the held voice toward a new position instead of retriggering it. */
  update(angle: number, distance: number, intensity: number): void {
    if (!this.voice || !this.context) return;
    const now = this.context.currentTime;
    const frequency = noteFrequency(angle);
    this.voice.oscA.frequency.setTargetAtTime(frequency, now, 0.05);
    this.voice.oscB.frequency.setTargetAtTime(frequency * 2, now, 0.05);
    this.voice.filter.frequency.setTargetAtTime(5200 - distance * 4400, now, 0.05);
    const peak = 0.12 + intensity * 0.28;
    this.voice.gain.gain.setTargetAtTime(peak, now, 0.06);
  }

  /** Fades the held voice out gently — never an abrupt cut on release. */
  release(): void {
    this.teardownVoice(0.5);
  }

  private teardownVoice(fade: number): void {
    if (!this.voice || !this.context) return;
    const { oscA, oscB, gain } = this.voice;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fade);
    oscA.stop(now + fade + 0.05);
    oscB.stop(now + fade + 0.05);
    this.voice = undefined;
  }
}
