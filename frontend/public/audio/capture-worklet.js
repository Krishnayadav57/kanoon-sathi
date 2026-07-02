/**
 * AudioWorklet processor — captures raw PCM from mic on the audio thread
 * and posts Int16 buffers back to the main thread.
 * Runs at the AudioContext's native sample rate; resampling to 16kHz for
 * Gemini Live is done in voiceClient.ts before sending.
 */
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      const pcm16 = new Int16Array(channel.length);
      for (let i = 0; i < channel.length; i++) {
        const s = Math.max(-1, Math.min(1, channel[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true;
  }
}
registerProcessor("capture-processor", CaptureProcessor);
