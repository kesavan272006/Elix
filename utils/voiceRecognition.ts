import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class VoiceRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private permissionGranted: boolean = false;
  private permissionRequested: boolean = false;

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

  private async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'web') return false;
    if (this.permissionRequested) return this.permissionGranted;

    try {
      this.permissionRequested = true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      this.permissionGranted = true;
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      this.permissionGranted = false;
      return false;
    }
  }

  async startListening(
    onResult: (text: string) => void,
    onError: (error: Error) => void
  ) {
    if (Platform.OS === 'web') {
      if (!this.recognition) {
        onError(new Error('Speech recognition not available'));
        return;
      }

      // Check if we already have permission
      if (!this.permissionGranted) {
        const hasPermission = await this.requestMicrophonePermission();
        if (!hasPermission) {
          onError(new Error('Microphone permission denied'));
          return;
        }
      }

      try {
        this.isListening = true;
        this.recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          onResult(transcript);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            this.permissionGranted = false;
            this.permissionRequested = false;
          }
          onError(new Error(event.error));
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              this.isListening = false;
            }
          }
        };

        await this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        this.isListening = false;
        onError(error as Error);
      }
    } else {
      // For mobile platforms, we'll implement this later
      onError(new Error('Voice recognition not implemented for mobile yet'));
    }
  }

  stopListening() {
    this.isListening = false;
    if (Platform.OS === 'web' && this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }

  async speak(text: string) {
    if (Platform.OS === 'web') {
      // For web, use the browser's speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new (window as any).SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        (window as any).speechSynthesis.speak(utterance);
      }
    } else {
      // For mobile, use Expo's Speech API
      try {
        await Speech.speak(text, {
          language: 'en',
          pitch: 1,
          rate: 0.9,
        });
      } catch (error) {
        console.error('Error speaking text:', error);
      }
    }
  }

  resetPermissions() {
    this.permissionGranted = false;
    this.permissionRequested = false;
  }
}

export const voiceRecognition = new VoiceRecognitionService(); 