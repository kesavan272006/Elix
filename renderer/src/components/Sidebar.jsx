import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { auth, database } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const SidebarContainer = styled(Box)(({ theme, open }) => ({
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: open ? '260px' : '0',
  backgroundColor: '#1a0f0f',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflow: 'hidden',
  zIndex: 1000,
  borderRight: '1px solid rgba(255, 0, 0, 0.1)',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '8px',
  top: '8px',
  color: '#ff4444',
  '&:hover': {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
}));

const NewChatButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 16px',
  margin: '16px',
  backgroundColor: '#2a1a1a',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#3a2a2a',
  },
}));

const ChatList = styled(Box)(({ theme }) => ({
  marginTop: '20px',
  overflowY: 'auto',
  height: 'calc(100vh - 100px)',
}));

const ChatItem = styled(Box)(({ theme, active }) => ({
  padding: '12px 16px',
  margin: '4px 16px',
  backgroundColor: active ? '#3a2a2a' : '#2a1a1a',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#3a2a2a',
  },
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}));

const ChatTitle = styled(Box)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const LastMessage = styled(Box)(({ theme }) => ({
  fontSize: '12px',
  color: '#888',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const Sidebar = ({ open, onToggle, onChatSelect, currentChatId }) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const chatsRef = collection(database, 'Users', auth.currentUser.uid, 'chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, []);

  const handleNewChat = async () => {
    if (!auth.currentUser) return;

    const chatsRef = collection(database, 'Users', auth.currentUser.uid, 'chats');
    const newChat = {
      title: 'New Chat',
      lastMessage: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(chatsRef, newChat);
    onChatSelect(docRef.id);
  };

  return (
    <SidebarContainer open={open}>
      <CloseButton onClick={onToggle} size="small">
        <CloseIcon />
      </CloseButton>
      <NewChatButton onClick={handleNewChat} style={{marginTop: '50px'}}>
        <AddIcon />
        New Chat
      </NewChatButton>
      <ChatList>
        {chats.map((chat) => (
          <ChatItem 
            key={chat.id} 
            active={chat.id === currentChatId}
            onClick={() => onChatSelect(chat.id)}
          >
            <ChatTitle>{chat.title}</ChatTitle>
            <LastMessage>{chat.lastMessage || 'No messages yet'}</LastMessage>
          </ChatItem>
        ))}
      </ChatList>
    </SidebarContainer>
  );
};

export default Sidebar; 