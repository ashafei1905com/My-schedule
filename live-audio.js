class LiveAudioClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.isPlaying = false;
    this.onStatus = () => {};
    this.audioQueue = [];
    this.nextPlayTime = 0;
  }

  async start() {
    this.onStatus('connecting');
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = async () => {
      this.onStatus('connected');
      await this.startRecording();
    };

    this.ws.onmessage = async (event) => {
      let data = event.data;
      if (data instanceof Blob) {
        data = await data.text();
      }
      try {
        const msg = JSON.parse(data);
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const parts = msg.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              this.playAudioChunk(part.inlineData.data);
            }
          }
        }
      } catch(e) {
        console.error('WS MSG err', e);
      }
    };

    this.ws.onclose = () => {
      this.stop();
    };
  }

  async startRecording() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(binary);
        
        this.ws.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
              data: base64
            }]
          }
        }));
      };
      
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error('Mic err:', err);
      this.onStatus('error');
    }
  }

  async playAudioChunk(base64Data) {
    if (!this.audioContext) return;
    const binary = atob(base64Data);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(buffer.buffer);
    const audioBuffer = this.audioContext.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  stop() {
    this.onStatus('disconnected');
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
window.LiveAudioClient = LiveAudioClient;
