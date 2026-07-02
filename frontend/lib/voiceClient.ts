"use client";
/**
 * VoiceClient — manages WebSocket connection to the backend voice proxy,
 * mic capture via AudioWorklet, and audio playback of Gemini's responses.
 *
 * Gemini Live expects:  PCM16 mono at 16000 Hz (input)
 * Gemini Live outputs:  PCM16 mono at 24000 Hz (output)
 */

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export type VoiceClientEvents = {
  onReady?: (remainingSeconds: number | null) => void;
  onLimitReached?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
  onTranscript?: (role: "user" | "model", text: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
};

function downsampleFloat32(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === INPUT_SAMPLE_RATE) return input;
  const ratio = fromRate / INPUT_SAMPLE_RATE;
  const length = Math.round(input.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = input[Math.floor(i * ratio)];
  return out;
}

function floatToInt16(input: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(input.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let b = "";
  for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i]);
  return btoa(b);
}

function base64ToInt16(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

export class VoiceClient {
  private ws: WebSocket | null = null;
  private captureCtx: AudioContext | null = null;
  private playCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private nextPlayTime = 0;
  private events: VoiceClientEvents;
  private _connected = false;

  constructor(events: VoiceClientEvents = {}) {
    this.events = events;
  }

  get isConnected() { return this._connected; }

  async connect(wsUrl: string, accessToken: string, language: "ne" | "en") {
    const url = `${wsUrl}?token=${encodeURIComponent(accessToken)}&language=${language}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = async () => {
      this._connected = true;
      await this._startMic();
    };
    this.ws.onmessage = e => this._onMessage(e.data);
    this.ws.onerror = () => this.events.onError?.("Connection error. Check your internet and try again.");
    this.ws.onclose = () => {
      this._connected = false;
      this._cleanup();
      this.events.onClose?.();
    };
  }

  private _onMessage(raw: string) {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "ready") { this.events.onReady?.(msg.remaining_seconds ?? null); return; }
    if (msg.type === "limit_reached") { this.events.onLimitReached?.(msg.message); this.disconnect(); return; }
    if (msg.type === "error") { this.events.onError?.(msg.message); return; }

    // Gemini serverContent relay
    const sc = msg.serverContent;
    if (!sc) return;
    if (sc.inputTranscription?.text) this.events.onTranscript?.("user", sc.inputTranscription.text);
    if (sc.outputTranscription?.text) this.events.onTranscript?.("model", sc.outputTranscription.text);

    for (const part of sc.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) this._playChunk(part.inlineData.data);
    }
    if (sc.turnComplete) this.events.onSpeakingChange?.(false);
  }

  private async _startMic() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true } });
    this.captureCtx = new AudioContext();
    await this.captureCtx.audioWorklet.addModule("/audio/capture-worklet.js");
    this.sourceNode = this.captureCtx.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.captureCtx, "capture-processor");
    const nativeRate = this.captureCtx.sampleRate;

    this.workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const int16 = new Int16Array(e.data);
      const f32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000;
      const resampled = downsampleFloat32(f32, nativeRate);
      const pcm = floatToInt16(resampled);
      this.ws.send(JSON.stringify({
        realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: bufToBase64(pcm) }] }
      }));
    };
    this.sourceNode.connect(this.workletNode);
    // Do NOT connect workletNode to destination (would echo mic to speaker)
  }

  private _playChunk(b64: string) {
    if (!this.playCtx) {
      this.playCtx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.nextPlayTime = this.playCtx.currentTime;
    }
    this.events.onSpeakingChange?.(true);
    const int16 = base64ToInt16(b64);
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000;
    const buf = this.playCtx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
    buf.copyToChannel(f32, 0);
    const src = this.playCtx.createBufferSource();
    src.buffer = buf;
    src.connect(this.playCtx.destination);
    const at = Math.max(this.nextPlayTime, this.playCtx.currentTime);
    src.start(at);
    this.nextPlayTime = at + buf.duration;
  }

  disconnect() {
    this.ws?.close();
    this._cleanup();
  }

  private _cleanup() {
    this.workletNode?.disconnect();
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.captureCtx?.close().catch(() => {});
    this.playCtx?.close().catch(() => {});
    this.workletNode = null;
    this.sourceNode = null;
    this.stream = null;
    this.captureCtx = null;
    this.playCtx = null;
  }
}
