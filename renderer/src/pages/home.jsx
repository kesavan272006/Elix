import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, database } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendMessageToGemini } from '../services/geminiService';
import axios from 'axios';
import './Home.scss';
import { useNavigate } from 'react-router-dom';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
const Home = () => {
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  
  const ASSEMBLY_API_KEY = 'fb0efc8b13234005bf664012ec39542c';
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(database, 'Users', auth.currentUser?.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUsername(docSnap.data().username);
        else navigate('/');
      } catch {
        navigate('/');
      }
    };
    fetchProfile();
  }, []);
  
  const SYSTEM_PROMPT = useMemo(() => `
        You are ELIX — the Executive Learning Interface eXpert — a proactive, voice-first AI assistant designed to help users get things done quickly and naturally on their mobile device.

        You live inside a desktop app created by Kesavan G. Today's date is ${new Date().toLocaleDateString()}, and the current time is ${new Date().toLocaleTimeString()}.

        Your goal is to be a smart, calm, and efficient digital coworker. Greet the user warmly **once per session**, and then assist them with voice or text as needed.

        You can answer questions, generate text, write code, open apps, set reminders, suggest replies, and help with daily tasks. Be concise, friendly, and clear in your responses. Keep replies short unless asked to elaborate.

        If you're unsure about something or can't perform an action, respond honestly and suggest an alternative.

        Always respond as if you are speaking directly to the user — you're their helpful, voice-powered assistant.
        If some one ask who created you tell them that its Kesavan G who is the creator of Elix.
  `, [username]);

  useEffect(() => {
    if (username) {
      const welcomeMsg = {
        text: `Hi ${username}! I'm Elix. How can I support you today?`,
        sender: 'Elix',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
      speakText(welcomeMsg.text);
    }
  }, [username]);
  async function openApplication(appName) {
        try {
          const isElectron = (
            window.electronAPI?.isElectron ||
            (window.process && window.process.versions && window.process.versions.electron) ||
            navigator.userAgent.toLowerCase().includes(' electron/')
          );

          if (isElectron && window.electronAPI?.openApplication) {
            await window.electronAPI.openApplication(appName);
          } else {
            console.warn('Electron API not available - running in browser');
            if (process.env.NODE_ENV === 'development') {
              alert(`In Electron, this would open: ${appName}\n\n` +
                    `Current command: "open ${appName}"`);
            }
          }
        } catch (error) {
          console.error('Failed to open application:', error);
          alert(`Failed to open ${appName}. Please ensure the application is installed.`);
        }
      }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const speakText = (text) => {
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesisRef.current.getVoices();
    const femaleVoice = voices.find(v => /female|zira|hazel|linda|victoria/i.test(v.name));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesisRef.current.speak(utterance);
  };

  useEffect(() => {
    const loadVoices = () => speechSynthesisRef.current.getVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const handleSubmit = async (text = inputText) => {
        if (!text.trim()) return;
        
        const openAppCommand = extractOpenCommand(text);
        if (openAppCommand) {
          const userMsg = { text, sender: 'user', timestamp: new Date().toISOString() };
          setMessages(prev => [...prev, userMsg]);
          setInputText('');
          
          try {
            await openApplication(openAppCommand);
            const successMsg = { text: `Opening ${openAppCommand}...`, sender: 'Elix', timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, successMsg]);
            speakText(successMsg.text);
          } catch (error) {
            const errMsg = { text: `Failed to open ${openAppCommand}. Please ensure the app exists.`, sender: 'Elix', timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, errMsg]);
            speakText(errMsg.text);
          }
          return;
        }
        const userMsg = { text, sender: 'user', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
          const reply = await sendMessageToGemini(text, messages, SYSTEM_PROMPT);
          const botMsg = { text: reply, sender: 'Elix', timestamp: new Date().toISOString() };
          setMessages(prev => [...prev, botMsg]);
          speakText(reply);
        } catch {
          const errMsg = { text: 'Oops, something went wrong.', sender: 'Elix', timestamp: new Date().toISOString() };
          setMessages(prev => [...prev, errMsg]);
          speakText(errMsg.text);
        } finally {
          setIsLoading(false);
        }
      };
      const extractOpenCommand = (text) => {
        const lowerText = text.toLowerCase();
        const openPattern = /(?:^|\s)(?:open|start|launch)\s+(?:the\s+)?([^\s,.]+)/i;
        const match = lowerText.match(openPattern);
        
        if (match && match[1]) {
          return match[1].trim();
        }
        
        return null;
      };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  useEffect(() => {
  if (!isDeveloperMode) return;
  const startRecordingLoop = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];

      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      try {
        const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
          headers: {
            authorization: 'fb0efc8b13234005bf664012ec39542c',
            'Content-Type': 'application/octet-stream',
          },
        });

        const transcriptRes = await axios.post(
          'https://api.assemblyai.com/v2/transcript',
          { audio_url: uploadRes.data.upload_url, speech_model: 'universal' },
          { headers: { authorization: 'fb0efc8b13234005bf664012ec39542c' } }
        );

        const id = transcriptRes.data.id;

        let found = false;
        while (!found) {
          const res = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { authorization: 'fb0efc8b13234005bf664012ec39542c' },
          });

          if (res.data.status === 'completed') {
            const transcript = res.data.text.toLowerCase();
            console.log("Transcript:", transcript);

            const wakeWords = ['elix', 'alex'];
            const wakeIndex = wakeWords.reduce((idx, word) => {
              const i = transcript.indexOf(word);
              return (i !== -1 && (idx === -1 || i < idx)) ? i : idx;
            }, -1);
            
            if (wakeIndex !== -1) {
              const afterWake = transcript.slice(wakeIndex);
              const dotIndex = afterWake.indexOf('dot');

              if (dotIndex !== -1) {
                const wakeWord = wakeWords.find(w => afterWake.startsWith(w));
                const fullCommand = afterWake.slice(wakeWord.length, dotIndex).trim();
                const commandParts = fullCommand.split(/\s+/);
                if (commandParts.length >= 1) {
                  const mainCommand = commandParts[1].toLowerCase();
                  const args = commandParts.slice(1).join(' ');

                  if (mainCommand === 'open' && args) {
                    console.log(`Attempting to open: ${args}`);
                    setInputText(fullCommand);
                    handleSubmit(fullCommand);
                    await openApplication(args);
                  }
                  else if (fullCommand.length > 0) {
                    setInputText(fullCommand);
                    handleSubmit(fullCommand);
                  }
                }
              }
            }
            found = true;
          }

          await new Promise((res) => setTimeout(res, 2000));
        }
      } catch (err) {
        console.warn("Wake word error", err);
      }
    };

    mediaRecorderRef.current.start();

    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.start();
      }
    }, 10000);
  };

  startRecordingLoop();

  return () => {
    clearInterval(intervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
}, [isDeveloperMode]);
  const toggleVoiceInput = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        const transcribingMsg = {
          text: 'Transcribing...',
          sender: 'user',
          timestamp: new Date().toISOString(),
          isTranscribing: true,
        };
        setMessages(prev => [...prev, transcribingMsg]);

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);

        try {
          const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
            headers: {
              authorization: ASSEMBLY_API_KEY,
              'Content-Type': 'application/octet-stream',
            },
          });

          const transcriptRes = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            { audio_url: uploadRes.data.upload_url, speech_model: 'universal' },
            { headers: { authorization: ASSEMBLY_API_KEY } }
          );

          const transcriptId = transcriptRes.data.id;
          let transcriptText = '';

          while (true) {
            const polling = await axios.get(
              `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
              { headers: { authorization: ASSEMBLY_API_KEY } }
            );

            if (polling.data.status === 'completed') {
              transcriptText = polling.data.text;
              break;
            } else if (polling.data.status === 'error') {
              throw new Error(`Transcription failed: ${polling.data.error}`);
            }

            await new Promise(res => setTimeout(res, 3000));
          }

          setMessages(prev => prev.filter(m => !m.isTranscribing));
          setInputText(transcriptText);
          handleSubmit(transcriptText);

        } catch (err) {
          alert('Transcription failed.');
          setMessages(prev => prev.filter(m => !m.isTranscribing));
        }
      };

      mediaRecorder.start();
    } catch {
      alert('Microphone access denied or unsupported.');
    }
  };

  return (
    <div className="home-container">
      <div className="chat-header">
        <img src="/circlelogo.png" alt="Elix" />
        <h1>Elix - Executive Learning Interface eXpert</h1>
        <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: '#9e9e9e',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#d32f2f',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: '#bdbdbd',
                    },
                    '& .Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ef5350',
                    },
                  }}
                  onChange={(e) => setIsDeveloperMode(e.target.checked)}
                />
              }
              label="Developer's Mode"
            />
          </FormGroup>

        <span>{isRecording ? '🎙️ Listening...' : 'AI Assistant'}</span>
      </div>

      <div className="chat-body">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.sender}`}>
            <div className={`bubble ${msg.isTranscribing ? 'transcribing' : ''}`}>{msg.text}</div>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-footer">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={toggleVoiceInput} className={`mic ${isRecording ? 'on' : ''}`}>
          {isRecording ? '⏹️' : '🎤'}
        </button>
        <button onClick={() => handleSubmit()} disabled={!inputText.trim() || isLoading}>➡️</button>
      </div>
    </div>
  );
};

export default Home;
