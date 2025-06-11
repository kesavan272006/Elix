const GEMINI_API_KEY = "AIzaSyBXV-FGg8hpDOfp1VfiHKHFeWzBZkedk4g";
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error(
    'Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file'
  );
}

export const sendMessageToGemini = async (
  userMessage,
  conversationHistory = [],
  systemPrompt = '',
  imageData = null
) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const contents = [];

    if (systemPrompt) {
      contents.push({
        role: 'assistant',
        parts: [{ text: systemPrompt.trim() }],
      });
    }

    conversationHistory.forEach((msg) => {
      if (msg.image) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          parts: [
            { text: msg.text },
            { inline_data: { mime_type: msg.image.mimeType, data: msg.image.data } }
          ],
        });
      } else {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          parts: [{ text: msg.text }],
        });
      }
    });

    if (imageData) {
      contents.push({
        role: 'user',
        parts: [
          { text: userMessage },
          { inline_data: { mime_type: imageData.mimeType, data: imageData.data } }
        ],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(
        `Failed to get response from Gemini API: ${
          errorData.error?.message || 'Unknown error'
        }`
      );
    }

    const data = await response.json();
    const rawResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedResponse = rawResponse
      .replace(/\*{1,}/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    return cleanedResponse;
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
  }
};