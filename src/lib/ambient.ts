// Generative soundscapes on the Web Audio API. No audio files, nothing to
// license, zero download. Must be started from a user gesture.

export type SoundscapeId = "drift" | "night" | "rain" | "ocean";

export const SOUNDSCAPES: {
  id: SoundscapeId;
  name: string;
  description: string;
}[] = [
  { id: "drift", name: "Drift", description: "Warm major chords and soft bells" },
  { id: "night", name: "Night", description: "Slow, dreamy minor pads" },
  { id: "rain", name: "Rain", description: "Gentle rainfall over a quiet pad" },
  { id: "ocean", name: "Ocean", description: "Waves rolling in and out" },
];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// `aux` is an extra gain (routed elsewhere) that fades together with `gain`
type Layer = { gain: GainNode; aux?: GainNode; stop: () => void };

type PadOptions = {
  chords: number[][];
  seconds: number;
  bells: number[];
  bellGap: [number, number];
  level: number;
};

const PADS: Record<"drift" | "night", PadOptions> = {
  drift: {
    chords: [
      [48, 55, 59, 64], // Cmaj7
      [45, 52, 59, 60], // Am9
      [41, 48, 52, 57], // Fmaj7
      [43, 50, 52, 59], // G6
    ],
    seconds: 9,
    bells: [72, 74, 76, 79, 81, 84],
    bellGap: [2200, 6400],
    level: 1,
  },
  night: {
    chords: [
      [45, 52, 55, 60], // Am7
      [41, 48, 52, 57], // Fmaj7
      [38, 50, 53, 57], // Dm9
      [40, 50, 55, 59], // Em7
    ],
    seconds: 11,
    bells: [69, 72, 74, 76, 79],
    bellGap: [4000, 9000],
    level: 0.9,
  },
};

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private current: Layer | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.7;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;

  private setup() {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Musical layers: warm breathing low-pass plus a soft feedback echo
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1400;
    tone.Q.value = 0.4;
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoDepth.gain.value = 500;
    lfo.connect(lfoDepth).connect(tone.frequency);
    lfo.start();
    tone.connect(master);

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.48;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(tone);

    const musicBus = ctx.createGain();
    musicBus.connect(tone);
    musicBus.connect(delay);

    // Shared 4s pink-ish noise loop for rain and waves
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
    }

    this.ctx = ctx;
    this.master = master;
    this.musicBus = musicBus;
    this.noiseBuffer = buffer;
  }

  // HDR: Layers

  private pad(opts: PadOptions, into: AudioNode, level = 1): () => void {
    const ctx = this.ctx!;
    let step = 0;

    const chord = () => {
      const now = ctx.currentTime;
      const notes = opts.chords[step++ % opts.chords.length];
      const peak = 0.07 * opts.level * level;
      notes.forEach((note, i) => {
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(peak, now + 3);
        env.gain.setValueAtTime(peak, now + opts.seconds - 1);
        env.gain.linearRampToValueAtTime(0, now + opts.seconds + 3);
        env.connect(into);
        [-4, 4].forEach((cents, v) => {
          const osc = ctx.createOscillator();
          osc.type = v === 0 ? "sine" : "triangle";
          osc.frequency.value = hz(note + (i === 0 ? -12 : 0));
          osc.detune.value = cents;
          osc.connect(env);
          osc.start(now);
          osc.stop(now + opts.seconds + 3.2);
        });
      });
    };

    let bellTimer: ReturnType<typeof setTimeout>;
    const bell = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz(opts.bells[Math.floor(Math.random() * opts.bells.length)]);
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.045 * level, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      osc.connect(env).connect(into);
      osc.start(now);
      osc.stop(now + 4.1);
      const [min, max] = opts.bellGap;
      bellTimer = setTimeout(bell, min + Math.random() * (max - min));
    };

    chord();
    const chordTimer = setInterval(chord, opts.seconds * 1000);
    bellTimer = setTimeout(bell, 3000);
    return () => {
      clearInterval(chordTimer);
      clearTimeout(bellTimer);
    };
  }

  private noise(into: AudioNode): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.connect(into);
    src.start();
    return src;
  }

  private build(id: SoundscapeId): Layer {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;

    if (id === "drift" || id === "night") {
      gain.connect(this.musicBus!);
      return { gain, stop: this.pad(PADS[id], gain) };
    }

    gain.connect(this.master!);

    if (id === "rain") {
      // Hiss band for the rain body
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2600;
      band.Q.value = 0.6;
      const rainLevel = ctx.createGain();
      rainLevel.gain.value = 0.55;
      band.connect(rainLevel).connect(gain);
      const src = this.noise(band);

      // Scattered droplets
      let dropTimer: ReturnType<typeof setTimeout>;
      const drop = () => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 1800 + Math.random() * 2600;
        env.gain.setValueAtTime(0.012 * Math.random(), now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(env).connect(gain);
        osc.start(now);
        osc.stop(now + 0.06);
        dropTimer = setTimeout(drop, 60 + Math.random() * 240);
      };
      drop();

      // A quiet pad underneath, through the music bus for its echo
      const padInput = ctx.createGain();
      padInput.gain.value = 0;
      padInput.connect(this.musicBus!);
      const stopPad = this.pad(PADS.drift, padInput, 0.35);

      return {
        gain,
        aux: padInput,
        stop: () => {
          clearTimeout(dropTimer);
          stopPad();
          src.stop(ctx.currentTime + 1.5);
        },
      };
    }

    // Ocean: low-passed noise whose level and brightness swell like waves
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 600;
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    low.connect(swell).connect(gain);
    const src = this.noise(low);

    const wave = ctx.createOscillator();
    wave.frequency.value = 0.08;
    const waveToFilter = ctx.createGain();
    waveToFilter.gain.value = 450;
    const waveToLevel = ctx.createGain();
    waveToLevel.gain.value = 0.35;
    wave.connect(waveToFilter).connect(low.frequency);
    wave.connect(waveToLevel).connect(swell.gain);
    wave.start();

    return {
      gain,
      stop: () => {
        src.stop(ctx.currentTime + 1.5);
        wave.stop(ctx.currentTime + 1.5);
      },
    };
  }

  // HDR: Public API

  async play(id: SoundscapeId) {
    if (!this.ctx) this.setup();
    const ctx = this.ctx!;
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    await ctx.resume();

    // Crossfade from whatever was playing
    const old = this.current;
    if (old) {
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      old.aux?.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        old.stop();
        old.gain.disconnect();
        old.aux?.disconnect();
      }, 2500);
    }
    const layer = this.build(id);
    layer.gain.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    layer.aux?.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    this.current = layer;

    const g = this.master!.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setTargetAtTime(this.volume, ctx.currentTime, 0.6);
  }

  setVolume(v: number) {
    this.volume = v;
    if (!this.ctx || !this.master || !this.current) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const layer = this.current;
    this.current = null;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    // Tear down after the fade so the audio thread can idle
    this.suspendTimer = setTimeout(() => {
      layer?.stop();
      layer?.gain.disconnect();
      layer?.aux?.disconnect();
      if (!this.current) ctx.suspend();
    }, 1600);
  }
}
