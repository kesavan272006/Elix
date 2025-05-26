import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class WakeWordService {
  private isListening: boolean = false;
  private recognition: any = null;
  private wakeWord: string = 'elix';
  private onWakeWordDetected: (() => void) | null = null;
  private isStarting: boolean = false;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
    }
  }

  async startListening(onWakeWordDetected: () => void) {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }

    if (this.isStarting) {
      return;
    }

    this.isStarting = true;
    this.onWakeWordDetected = onWakeWordDetected;
    this.isListening = true;

    try {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (transcript.includes(this.wakeWord)) {
          this.onWakeWordDetected?.();
          // Play a subtle sound to indicate wake word detection
          Speech.speak('', {
            language: 'en',
            pitch: 1,
            rate: 0.9,
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Wake word detection error:', event.error);
        if (this.isListening && event.error !== 'no-speech') {
          this.restartRecognition();
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.restartRecognition();
        }
      };

      await this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    } finally {
      this.isStarting = false;
    }
  }

  private async restartRecognition() {
    if (!this.isListening || this.isStarting) return;
    
    try {
      this.isStarting = true;
      await this.recognition.start();
    } catch (error) {
      console.error('Error restarting recognition:', error);
    } finally {
      this.isStarting = false;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }
}

export const wakeWordService = new WakeWordService(); 