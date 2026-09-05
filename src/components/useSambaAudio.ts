import { useEffect, useRef } from "react";

type SambaAudioOptions = {
  enabled: boolean;
  playing: boolean;
  energy: number;
  tempo?: number;
};

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const LOOK_AHEAD_SECONDS = 0.12;
const SCHEDULER_MS = 25;
const STEPS_PER_BAR = 16;
const BARS = 2;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;
const normalizeEnergy = (value: number) =>
  Math.max(0, Math.min(1, value > 1 ? value / 100 : value));

/**
 * A small, dependency-free samba bed. AudioContext creation is deliberately
 * gated by `enabled`, so callers can tie that flag to an explicit user action.
 */
export function useSambaAudio({
  enabled,
  playing,
  energy,
  tempo = 108,
}: SambaAudioOptions): { supported: boolean } {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const stepRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set());
  const energyRef = useRef(normalizeEnergy(energy));
  const tempoRef = useRef(tempo);

  const supported =
    typeof window !== "undefined" &&
    Boolean(
      (window as AudioWindow).AudioContext ||
      (window as AudioWindow).webkitAudioContext,
    );

  useEffect(() => {
    energyRef.current = normalizeEnergy(energy);
  }, [energy]);

  useEffect(() => {
    tempoRef.current = Math.max(50, Math.min(220, tempo));
  }, [tempo]);

  useEffect(() => {
    if (!enabled || !playing || !supported || contextRef.current) return;

    const AudioContextConstructor =
      (window as AudioWindow).AudioContext ||
      (window as AudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    const master = context.createGain();
    master.gain.value = 0.12;
    compressor.connect(master);
    master.connect(context.destination);

    const noiseBuffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 0.25),
      context.sampleRate,
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    contextRef.current = context;
    compressorRef.current = compressor;
    masterRef.current = master;
    noiseBufferRef.current = noiseBuffer;

    return () => {
      if (schedulerRef.current !== null) {
        window.clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      const stopAt = context.currentTime + 0.015;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(
        Math.max(0.0001, master.gain.value),
        context.currentTime,
      );
      master.gain.linearRampToValueAtTime(0.0001, stopAt);
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop(stopAt);
        } catch {
          // A source may already have ended.
        }
        source.disconnect();
      });
      activeSourcesRef.current.clear();
      master.disconnect();
      compressor.disconnect();
      void context.close();
      contextRef.current = null;
      masterRef.current = null;
      compressorRef.current = null;
      noiseBufferRef.current = null;
    };
  }, [enabled, playing, supported]);

  useEffect(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!enabled || !playing || !context || !master) return;

    const pan = (value: number): StereoPannerNode => {
      const node = context.createStereoPanner();
      node.pan.value = Math.max(-1, Math.min(1, value));
      return node;
    };

    const track = (source: AudioScheduledSourceNode) => {
      activeSourcesRef.current.add(source);
      source.addEventListener(
        "ended",
        () => activeSourcesRef.current.delete(source),
        { once: true },
      );
    };

    const tone = (
      time: number,
      frequency: number,
      duration: number,
      level: number,
      type: OscillatorType,
      stereo: number,
      bend = 0,
    ) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = pan(stereo);
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), time);
      if (bend !== 0)
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(20, frequency + bend),
          time + duration,
        );
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, level),
        time + 0.004,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(gain).connect(panner).connect(compressorRef.current!);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.01);
      track(oscillator);
    };

    const noise = (
      time: number,
      duration: number,
      level: number,
      highPass: number,
      stereo: number,
    ) => {
      if (!noiseBufferRef.current) return;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const panner = pan(stereo);
      source.buffer = noiseBufferRef.current;
      filter.type = "highpass";
      filter.frequency.value = highPass;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, level),
        time + 0.003,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      source
        .connect(filter)
        .connect(gain)
        .connect(panner)
        .connect(compressorRef.current!);
      source.start(time);
      source.stop(time + duration + 0.01);
      track(source);
    };

    const scheduleStep = (step: number, time: number) => {
      const intensity = energyRef.current;
      const barStep = step % STEPS_PER_BAR;
      const beat = barStep % 4;
      const sixteenth = barStep % 4;

      // Deep surdo anchors beats 1 and 3; the higher drum answers on the syncopated offbeats.
      if (barStep === 0) tone(time, 82, 0.22, 0.44, "sine", -0.18, -25);
      if (barStep === 8) tone(time, 88, 0.18, 0.32, "sine", -0.12, -20);
      if (barStep === 4 || barStep === 12)
        tone(time, 145, 0.13, 0.18 + intensity * 0.08, "sine", 0.14, -45);

      // Caixa: crisp backbeat plus quieter ghost notes as the band gets busier.
      if (barStep === 4 || barStep === 12) noise(time, 0.075, 0.24, 1250, 0.2);
      if (
        intensity > 0.3 &&
        sixteenth % 2 === 0 &&
        (barStep === 2 || barStep === 6 || barStep === 10 || barStep === 14)
      ) {
        noise(time, 0.045, 0.07 + intensity * 0.06, 1900, 0.28);
      }

      // Agogo answers across the two bars, with alternating pitched bells.
      if (
        [3, 7, 11, 15].includes(barStep) ||
        (intensity > 0.72 && [2, 10].includes(barStep))
      ) {
        tone(
          time,
          barStep % 8 === 3 ? 880 : 660,
          0.11,
          0.13 + intensity * 0.05,
          "triangle",
          0.35,
          -80,
        );
      }

      // Shaker/tamborim sixteenths keep the pocket moving without dominating it.
      if (barStep % 2 === 1 || (intensity > 0.62 && beat === 3)) {
        noise(
          time,
          0.035,
          0.055 + intensity * 0.04,
          5000,
          barStep % 4 < 2 ? -0.32 : 0.32,
        );
      }
    };

    const scheduleAhead = () => {
      const now = context.currentTime;
      const stepDuration = 60 / tempoRef.current / 4;
      while (nextStepTimeRef.current < now + LOOK_AHEAD_SECONDS) {
        scheduleStep(stepRef.current, nextStepTimeRef.current);
        nextStepTimeRef.current += stepDuration;
        stepRef.current = (stepRef.current + 1) % TOTAL_STEPS;
      }
    };

    if (context.state === "suspended") void context.resume();
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(
      Math.max(0.0001, master.gain.value),
      context.currentTime,
    );
    master.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.025);
    nextStepTimeRef.current = context.currentTime + 0.03;
    schedulerRef.current = window.setInterval(scheduleAhead, SCHEDULER_MS);
    scheduleAhead();

    return () => {
      if (schedulerRef.current !== null) {
        window.clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      const stopAt = context.currentTime + 0.015;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(master.gain.value, context.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, stopAt);
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop(stopAt);
        } catch {
          // A source may already have ended.
        }
      });
    };
  }, [enabled, playing]);

  return { supported };
}
