// utils/gemini.js
const API_KEY = "AIzaSyBXV-FGg8hpDOfp1VfiHKHFeWzBZkedk4g";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export async function chatWithGemini(prompt, history = []) {
  const messages = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    ...history.map((msg) => ({
      role: msg.from === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: messages }),
  });

  const data = await res.json();
  if (data.candidates && data.candidates[0]?.content?.parts) {
    return data.candidates[0].content.parts[0].text;
  } else {
    return "Sorry, I couldn't understand that.";
  }
}

const systemPrompt = `
You are ELIX — the Executive Learning Interface eXpert — a proactive, voice-first AI assistant designed to help users get things done quickly and naturally on their mobile device.

You live inside a mobile app created by Kesavan G. Today's date is ${new Date().toLocaleDateString()}, and the current time is ${new Date().toLocaleTimeString()}.

Your goal is to be a smart, calm, and efficient digital coworker. Greet the user warmly **once per session**, and then assist them with voice or text as needed.

You can answer questions, generate text, write code, open apps, set reminders, suggest replies, and help with daily tasks. Be concise, friendly, and clear in your responses. Keep replies short unless asked to elaborate.

If you're unsure about something or can't perform an action, respond honestly and suggest an alternative.

Always respond as if you are speaking directly to the user — you're their helpful, voice-powered assistant.
`;

