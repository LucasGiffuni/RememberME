class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) {
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Silent fail if audio not supported
    }
  }

  // Satisfying completion sound (ascending two-note chime)
  complete() {
    this.playTone(523.25, 0.15, "sine", 0.08); // C5
    setTimeout(() => this.playTone(659.25, 0.2, "sine", 0.08), 100); // E5
  }

  // Undo / uncomplete
  undo() {
    this.playTone(440, 0.1, "sine", 0.05); // A4
    setTimeout(() => this.playTone(349.23, 0.15, "sine", 0.05), 80); // F4
  }

  // Tap / selection
  tap() {
    this.playTone(800, 0.05, "sine", 0.03);
  }

  // Success (3-note ascending)
  success() {
    this.playTone(523.25, 0.12, "sine", 0.07);
    setTimeout(() => this.playTone(659.25, 0.12, "sine", 0.07), 100);
    setTimeout(() => this.playTone(783.99, 0.2, "sine", 0.07), 200);
  }

  // Error
  error() {
    this.playTone(200, 0.15, "square", 0.05);
    setTimeout(() => this.playTone(180, 0.2, "square", 0.05), 100);
  }

  // Delete (descending)
  delete() {
    this.playTone(400, 0.08, "sine", 0.04);
    setTimeout(() => this.playTone(300, 0.1, "sine", 0.04), 60);
  }

  // Start recording
  startRecording() {
    this.playTone(600, 0.08, "sine", 0.06);
    setTimeout(() => this.playTone(900, 0.12, "sine", 0.06), 80);
  }

  // Stop recording
  stopRecording() {
    this.playTone(900, 0.08, "sine", 0.05);
    setTimeout(() => this.playTone(600, 0.1, "sine", 0.05), 80);
  }

  // Level up / achievement
  levelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "sine", 0.08), i * 120);
    });
  }

  // Notification received
  notification() {
    this.playTone(880, 0.08, "triangle", 0.06);
    setTimeout(() => this.playTone(1100, 0.12, "triangle", 0.06), 100);
  }
}

export const sounds = new SoundManager();
