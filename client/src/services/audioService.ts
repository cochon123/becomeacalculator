// Sound effects
import plusOnePoint from '../assets/plusonepoint.mp3';
import minusOnePoint from '../assets/minusonepoint.mp3';
import gameOver from '../assets/game-over-417465.mp3';
import winnerSound from '../assets/winner-game-sound-404167.mp3';

class AudioService {
  private audioContext: AudioContext | null = null;
  private volumeLevel: number = 0.5; // Volume by default (0-1)
  private soundsEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', () => this.initAudioContext(), { once: true });
      document.addEventListener('keydown', () => this.initAudioContext(), { once: true });
    }
  }

  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (audioContext) {
          this.audioContext = new audioContext();
        }
      } catch (e) {
        console.warn('Audio context initialization failed:', e);
      }
    }
  }

  private playAudio(audioPath: string) {
    if (!this.soundsEnabled) return;

    try {
      const audio = new Audio(audioPath);
      audio.volume = this.volumeLevel;
      audio.play().catch((e) => console.warn('Audio playback failed:', e));
    } catch (e) {
      console.warn('Error playing audio:', e);
    }
  }

  public playCorrectAnswer() {
    this.playAudio(plusOnePoint);
  }

  public playIncorrectAnswer() {
    this.playAudio(minusOnePoint);
  }

  public playGameOver() {
    this.playAudio(gameOver);
  }

  public playWinner() {
    this.playAudio(winnerSound);
  }

  public setVolume(level: number) {
    this.volumeLevel = Math.max(0, Math.min(1, level));
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  public toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    return this.soundsEnabled;
  }

  public isSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }
}

export const audioService = new AudioService();
