import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, database } from '../config/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { sendMessageToGemini } from '../services/geminiService';
import axios from 'axios';
import './Home.scss';
import { useNavigate } from 'react-router-dom';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { signOut } from 'firebase/auth';
import logo from '../assets/Elix-logo.png'
import Sidebar from '../components/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Home = () => {
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const [reminders, setReminders] = useState([]);
  const reminderCheckInterval = useRef(null);
  
  const ASSEMBLY_API_KEY = 'fb0efc8b13234005bf664012ec39542c';
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(database, 'Users', auth.currentUser?.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username);
          createInitialChat();
        } else {
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!isDeveloperMode) return;

    const startRecordingLoop = async () => {
      try {
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
                authorization: ASSEMBLY_API_KEY,
                'Content-Type': 'application/octet-stream',
              },
            });

            const transcriptRes = await axios.post(
              'https://api.assemblyai.com/v2/transcript',
              { audio_url: uploadRes.data.upload_url, speech_model: 'universal' },
              { headers: { authorization: ASSEMBLY_API_KEY } }
            );

            const id = transcriptRes.data.id;
            let found = false;

            while (!found) {
              const res = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { authorization: ASSEMBLY_API_KEY },
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
                    const reminderInfo = extractReminderInfo(fullCommand);
                    if (reminderInfo) {
                      await addReminder(reminderInfo);
                      setInputText(fullCommand);
                      handleSubmit(fullcommand);
                    } else {
                      setInputText(fullCommand);
                      handleSubmit(fullCommand);
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
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    };

    startRecordingLoop();

    return () => {
      clearInterval(intervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isDeveloperMode]);

  const createInitialChat = async () => {
    if (!auth.currentUser) return;

    const chatsRef = collection(database, 'Users', auth.currentUser.uid, 'chats');
    const newChat = {
      title: 'New Chat',
      lastMessage: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(chatsRef, newChat);
    setCurrentChatId(docRef.id);

      const welcomeMsg = {
        text: `Hi ${username}! I'm Elix. How can I support you today?`,
        sender: 'Elix',
        timestamp: new Date().toISOString()
      };

      const messagesRef = collection(database, 'Users', auth.currentUser.uid, 'chats', docRef.id, 'messages');
      await addDoc(messagesRef, welcomeMsg);
      speakText(welcomeMsg.text);
  };

  useEffect(() => {
    if (!currentChatId || !auth.currentUser) return;

    const messagesRef = collection(database, 'Users', auth.currentUser.uid, 'chats', currentChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [currentChatId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    setIsSidebarOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        setSelectedImage({
          data: base64Data,
          mimeType: file.type
        });
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (text = inputText) => {
    if ((!text.trim() && !selectedImage) || !auth.currentUser) return;
    
    if (!currentChatId) {
      const chatsRef = collection(database, 'Users', auth.currentUser.uid, 'chats');
      const newChat = {
        title: 'New Chat',
        lastMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(chatsRef, newChat);
      setCurrentChatId(docRef.id);
    }

    const userMsg = { 
      text, 
      sender: 'user', 
      timestamp: new Date().toISOString(),
      image: selectedImage ? {
        data: selectedImage.data,
        mimeType: selectedImage.mimeType
      } : null
    };
    setMessages(prev => [...prev, userMsg]);
    await addMessageToFirebase(userMsg);
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const reminderInfo = extractReminderInfo(text);
    if (reminderInfo) {
      await addReminder(reminderInfo);
      return;
    }
    const appToOpen = extractOpenCommand(text);
    if (appToOpen) {
      await openApplication(appToOpen);
      return;
    }

    setIsLoading(true);

    try {
      const reply = await sendMessageToGemini(text, messages, SYSTEM_PROMPT, selectedImage);
      const botMsg = { 
        text: reply, 
        sender: 'Elix', 
        timestamp: new Date().toISOString() 
      };
      await addMessageToFirebase(botMsg);
      speakText(reply);
    } catch {
      const errMsg = { 
        text: 'Oops, something went wrong.', 
        sender: 'Elix', 
        timestamp: new Date().toISOString() 
      };
      await addMessageToFirebase(errMsg);
      speakText(errMsg.text);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessageToFirebase = async (message) => {
    if (!currentChatId || !auth.currentUser) return;

    const messagesRef = collection(database, 'Users', auth.currentUser.uid, 'chats', currentChatId, 'messages');
    const chatRef = doc(database, 'Users', auth.currentUser.uid, 'chats', currentChatId);

    await addDoc(messagesRef, message);
    await updateDoc(chatRef, {
      lastMessage: message.text,
      updatedAt: serverTimestamp()
    });
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

  const SYSTEM_PROMPT = useMemo(() => `
        You are ELIX — the Executive Learning Interface eXpert — a proactive, voice-first AI assistant designed to help users get things done quickly and naturally on their mobile device.

        You live inside a desktop app created by Kesavan G. Today's date is ${new Date().toLocaleDateString()}, and the current time is ${new Date().toLocaleTimeString()}.
        The user's name is ${username}

        Your goal is to be a smart, calm, and efficient digital coworker. Greet the user warmly **once per session**, and then assist them with voice or text as needed.

        You can answer questions, generate text, write code, open apps, set reminders, suggest replies, and help with daily tasks. Be concise, friendly, and clear in your responses. Keep replies short unless asked to elaborate.

        If you're unsure about something or can't perform an action, respond honestly and suggest an alternative.

        Always respond as if you are speaking directly to the user — you're their helpful, voice-powered assistant.
        If some one ask who created you tell them that its Kesavan G who is the creator of Elix.
  `, [username]);

  async function openApplication(appName) {
    try {
      const isElectron = (
        window.electronAPI?.isElectron ||
        (window.process && window.process.versions && window.process.versions.electron) ||
        navigator.userAgent.toLowerCase().includes(' electron/')
      );

      if (isElectron && window.electronAPI?.openApplication) {
        const result = await window.electronAPI.openApplication(appName);
        if (result.success) {
          const successMsg = {
            text: `Opening ${appName}...`,
            sender: 'Elix',
            timestamp: new Date().toISOString()
          };
          await addMessageToFirebase(successMsg);
          speakText(successMsg.text);
        } else {
          throw new Error(result.error || 'Failed to open application');
        }
      } else {
        console.warn('Electron API not available - running in browser');
        if (isDeveloperMode) {
          const devMsg = {
            text: `[Developer Mode] Would open: ${appName}\nCommand: "open ${appName}"`,
            sender: 'Elix',
            timestamp: new Date().toISOString()
          };
          await addMessageToFirebase(devMsg);
          speakText(devMsg.text);
        } else {
          const errorMsg = {
            text: `Sorry, I can't open applications in browser mode. Please use the desktop app for this feature.`,
            sender: 'Elix',
            timestamp: new Date().toISOString()
          };
          await addMessageToFirebase(errorMsg);
          speakText(errorMsg.text);
        }
      }
    } catch (error) {
      console.error('Failed to open application:', error);
      const errorMsg = {
        text: `Failed to open ${appName}. ${error.message || 'Please ensure the application is installed.'}`,
        sender: 'Elix',
        timestamp: new Date().toISOString()
      };
      await addMessageToFirebase(errorMsg);
      speakText(errorMsg.text);
    }
  }

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
  const parseTimeString = (timeStr) => {
    const now = new Date();
    const lowerTimeStr = timeStr.toLowerCase().trim();
    const relativeMatch = lowerTimeStr.match(/in\s+(\d+)\s+(minute|hour|min|hr)s?/i);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].startsWith('min') ? 'minute' : 'hour';
      const reminderTime = new Date(now);
      if (unit === 'minute') {
        reminderTime.setMinutes(now.getMinutes() + amount);
      } else {
        reminderTime.setHours(now.getHours() + amount);
      }
      return reminderTime;
    }
    const timeFormats = [
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
      /(\d{1,2})(?::(\d{2}))?/,         
      /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, 
      /(\d{1,2})(?::(\d{2}))?(am|pm)/i   
    ];

    for (const format of timeFormats) {
      const match = lowerTimeStr.match(format);
      if (match) {
        const reminderTime = new Date(now);
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const isPM = match[3]?.toLowerCase() === 'pm';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        reminderTime.setHours(hours, minutes, 0, 0);
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        return reminderTime;
      }
    }

    return null;
  };

  const extractReminderInfo = (text) => {
    const reminderMatch = text.match(/remind(?:er|ing|s)?\s+(?:me\s+)?(?:at|in|to|about)?\s+(.+)/i);
    if (!reminderMatch) return null;

    const timeStr = reminderMatch[1].trim();
    const reminderTime = parseTimeString(timeStr);
    
    if (!reminderTime) return null;
    const messageMatch = timeStr.match(/(?:at|in|to|about)\s+(.+?)(?:\s+to\s+|\s+about\s+|\s+that\s+|\s+to\s+remember\s+|\s+to\s+do\s+)(.+)/i);
    const reminderMessage = messageMatch ? messageMatch[2].trim() : 'Reminder';

    return {
      time: reminderTime,
      message: reminderMessage,
      originalText: text
    };
  };

  const addReminder = async (reminderInfo) => {
    if (!auth.currentUser || !currentChatId) return;

    const reminder = {
      userId: auth.currentUser.uid,
      chatId: currentChatId,
      time: reminderInfo.time.toISOString(),
      message: reminderInfo.message,
      originalText: reminderInfo.originalText,
      createdAt: serverTimestamp(),
      isCompleted: false
    };

    const remindersRef = collection(database, 'reminders');
    await addDoc(remindersRef, reminder);

    const confirmationMsg = {
      text: `I'll remind you at ${reminderInfo.time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })} about: ${reminderInfo.message}`,
      sender: 'Elix',
      timestamp: new Date().toISOString()
    };

    await addMessageToFirebase(confirmationMsg);
    speakText(confirmationMsg.text);
  };
  useEffect(() => {
    const checkReminders = async () => {
      if (!auth.currentUser) return;

      const now = new Date();
      const remindersRef = collection(database, 'reminders');
      const q = query(
        remindersRef,
        where('userId', '==', auth.currentUser.uid),
        where('isCompleted', '==', false)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => {
        const reminder = doc.data();
        const reminderTime = new Date(reminder.time);
        const nowHours = now.getHours();
        const nowMinutes = now.getMinutes();
        const reminderHours = reminderTime.getHours();
        const reminderMinutes = reminderTime.getMinutes();
        
        if (nowHours === reminderHours && nowMinutes === reminderMinutes) {
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification({
              title: 'Elix Reminder',
              body: `You asked me to remind you at ${reminderTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              })} about: ${reminder.message}`,
              originalText: reminder.originalText
            });
          } else {
            if (Notification.permission === 'granted') {
              new Notification('Elix Reminder', {
                body: `You asked me to remind you at ${reminderTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true
                })} about: ${reminder.message}`,
                icon: logo
              });
            }
          }
          await updateDoc(doc.ref, { isCompleted: true });
        }
      });
    };
    reminderCheckInterval.current = setInterval(checkReminders, 60000);
    checkReminders(); 

    return () => {
      if (reminderCheckInterval.current) {
        clearInterval(reminderCheckInterval.current);
      }
    };
  }, [auth.currentUser]);

  return (
    <div className="home-container">
      <Sidebar 
        open={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
      />
      <div className="chat-header">
        <IconButton 
          onClick={() => setIsSidebarOpen(true)}
          sx={{ 
            color: '#ff4444',
            '&:hover': {
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <img src={logo} alt="Elix" />
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
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="chat-body" ref={chatContainerRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.sender}`}>
            <div className={`bubble ${msg.isTranscribing ? 'transcribing' : ''}`}>
              {msg.image && (
                <div className="message-image">
                  <img 
                    src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                    alt="Uploaded content"
                    style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
                  />
                </div>
              )}
              {msg.text}
            </div>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
        {showScrollButton && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <IconButton
              onClick={scrollToBottom}
              sx={{
                backgroundColor: 'rgba(255, 68, 68, 0.9)',
                color: 'white',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 68, 68, 1)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </div>
        )}
      </div>

      <div className="chat-footer">
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button 
              className="remove-image" 
              onClick={() => {
                setImagePreview(null);
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              ✕
            </button>
          </div>
        )}
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="image-upload"
          title="Upload Image"
          style={{justifyContent:'center', alignItems:'center'}}
        >
          📷
        </button>
        <button onClick={toggleVoiceInput} className={`mic ${isRecording ? 'on' : ''}`}>
          {isRecording ? '⏹️' : '🎤'}
        </button>
        <button 
          onClick={() => handleSubmit()} 
          disabled={(!inputText.trim() && !selectedImage) || isLoading}
        >
          ➡️
        </button>
      </div>
    </div>
  );
};

export default Home;
