import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  text: string;
  metadata?: {
    action?: string;
    parameters?: any;
  };
}

class GeminiService {
  private model: any;
  private isInitialized: boolean = false;

  constructor() {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.error('Google AI API key is not set in environment variables');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.isInitialized = true;
      console.log('Gemini service initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
    }
  }

  async processCommand(command: string): Promise<GeminiResponse> {
    if (!this.isInitialized) {
      throw new Error('Gemini service is not initialized. Please check your API key.');
    }

    try {
      console.log('Processing command:', command);
      
      const prompt = `You are ELIX, an intelligent digital colleague. Process the following command and respond naturally: "${command}"`;
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response:', text);

      // Parse the response for any action metadata
      const metadata = this.parseResponseForActions(text);

      return {
        text,
        metadata
      };
    } catch (error) {
      console.error('Error processing command with Gemini:', error);
      return {
        text: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        metadata: {}
      };
    }
  }

  private parseResponseForActions(text: string) {
    // Add logic to parse response for actions like opening apps, setting reminders, etc.
    return {};
  }
}

export const geminiService = new GeminiService(); 