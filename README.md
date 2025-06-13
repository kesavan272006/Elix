# 🚀 Elix - Executive Learning Interface eXpert

<div align="center">
  <img src="renderer/src/assets/Elix-logo.png" alt="Elix Logo" width="200"/>
  
  *Your Words, Our Execution*
</div>

## 🌟 Overview

Elix is a cutting-edge desktop AI assistant that revolutionizes how you interact with your computer. Built with modern technologies and a focus on user experience, Elix combines voice-first interaction with powerful AI capabilities to make your digital life more efficient and enjoyable.

## ✨ Key Features

### 🎙️ Voice-First Interface
- **Natural Voice Commands**: Activate with "Elix" followed by your command and "dot"
- **Voice-to-Text**: Seamless speech recognition for hands-free operation
- **Text-to-Speech**: Natural-sounding responses with customizable voice settings
- **Developer Mode**: 
  - Continuous voice recording when enabled
  - Only executes commands between "Elix" and "dot" keywords
  - Real-time voice command processing
  - Visual feedback during recording

### 🤖 AI-Powered Assistance
- **Smart Chat Interface**: Engage in natural conversations with AI
- **Image Analysis**: Upload and analyze images with AI-powered insights
- **Context-Aware Responses**: Maintains conversation context for coherent interactions
- **Natural Language Processing**: Understands and responds to complex queries
- **Google Gemini AI Integration**: Powered by state-of-the-art AI technology
- **Chat History Management**:
  - Persistent chat history storage in Firebase
  - Multiple chat sessions support
  - Sidebar navigation for chat history
  - Real-time chat updates
  - Chat session persistence across app restarts
  - Easy switching between different conversations
  - Automatic chat organization by date/time

### 📱 Smart Application Control
- **Intelligent App Launcher**: 
  - Extensive app mapping system
  - Supports 100+ applications
  - Handles both desktop apps and web protocols
  - Smart path resolution for Windows applications
  - Fallback mechanisms for missing applications
  - Browser protocol support (http, https)
  - Communication app protocols (whatsapp://, discord://, etc.)

- **Supported Categories**:
  - 🌐 Browsers (Chrome, Firefox, Edge, Opera, Brave)
  - 📝 Office Suite (Word, Excel, PowerPoint, Access)
  - 💻 Development Tools (VS Code, Git, Terminal)
  - 🎵 Media Players (VLC, Spotify, iTunes)
  - 💬 Communication Apps (WhatsApp, Discord, Slack, Teams)
  - 🎮 Gaming Platforms (Steam, Epic, Origin)
  - 🛠️ System Tools (Control Panel, Task Manager)
  - And many more...

### ⏰ Intelligent Reminder System
- **Natural Language Processing**:
  - Understands various time formats
  - Handles relative time expressions
  - Supports recurring reminders
  - Smart date parsing

- **Reminder Features**:
  - Time-based notifications
  - Message extraction from commands
  - Automatic timezone handling
  - Persistent storage in Firebase
  - Real-time reminder checks
  - Visual and audio notifications

- **Example Commands**:
  ```
  "Elix remind me to call John at 3pm dot"
  "Elix set a reminder for team meeting tomorrow at 10am dot"
  "Elix remind me about the project deadline in 2 days dot"
  ```

### 🎨 Modern UI/UX
- **Elegant Dark Theme**: Eye-friendly dark mode interface
- **Responsive Design**: Adapts to different screen sizes
- **Real-time Chat Interface**: Smooth message updates
- **Image Preview**: Visual feedback for image uploads
- **Animated Transitions**: Smooth and engaging user experience
- **Customizable Interface**: Personalize your experience

### 🔒 Security & Privacy
- **Firebase Authentication**: Secure user authentication
- **Data Encryption**: Secure data storage and transmission
- **Local-First Approach**: Optional cloud sync for privacy
- **Secure File Handling**: Safe image and file processing

## 🛠️ Technical Architecture

### Frontend
- **React**: Modern UI framework
- **Material-UI**: Component library
- **Framer Motion**: Smooth animations
- **SCSS**: Advanced styling

### Backend
- **Electron**: Cross-platform desktop framework
- **Firebase**: Authentication and database
- **Google Gemini AI**: AI processing
- **AssemblyAI**: Speech recognition

### Development Tools
- **Vite**: Fast development server
- **Electron Packager**: Application packaging
- **Concurrently**: Parallel task execution

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- npm or yarn
- Windows 10/11

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/elix.git
cd elix
```

2. Install dependencies:
```bash
npm install
cd renderer
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm run package
```

## 💡 Usage Examples

### Chat History Management
1. **Accessing Chat History**:
   - Click the menu icon to open the sidebar
   - View all your previous conversations
   - Switch between different chat sessions
   - Continue conversations from where you left off

2. **Chat Organization**:
   - Chats are automatically organized by date
   - Each chat maintains its full context
   - Easy navigation through past conversations
   - Real-time updates as you chat

3. **Example Usage**:
   ```
   - Open sidebar to view chat history
   - Click on any previous chat to continue
   - Start new chat with the "+" button
   - All conversations are saved automatically
   ```

### Voice Commands
```
"Elix open calculator dot"
"Elix search for AI trends dot"
"Elix set reminder for meeting at 3pm dot"
"Elix open whatsapp dot"
"Elix summarize this article dot"
```

### Image Analysis
1. Click the image upload button
2. Select an image
3. Ask questions about the image
4. Get AI-powered insights

### Setting Reminders
```
"Elix remind me to call John at 3pm dot"
"Elix set a reminder for team meeting tomorrow at 10am dot"
```

## 🔧 Developer Mode
The Developer Mode is a powerful feature that enables continuous voice command processing:

1. **Activation**:
   - Toggle the Developer Mode switch in the interface
   - Visual indicator shows recording status
   - "🎙️ Listening..." appears when active

2. **How it Works**:
   - Continuously records audio when enabled
   - Processes speech in real-time
   - Only executes commands between "Elix" and "dot"
   - Provides visual feedback during recording

3. **Use Cases**:
   - Hands-free operation
   - Continuous command processing
   - Testing voice commands
   - Debugging voice recognition

## 📝 License
ISC License

## 👨‍💻 Author
Created by Kesavan G

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 🌟 Future Enhancements
- Multi-language support
- Custom voice commands
- Advanced task automation
- Plugin system
- Cross-platform support 
## 📸 Screenshots & Demo

<div align="center">
  <img src="Images/elix1.png" width="300" alt="Main Interface">
  <img src="Images/elix2.jpg" width="300" alt="Voice Command">
  <img src="Images/elix3.png" width="300" alt="Settings Panel">
  <img src="Images/elix4.png" width="300" alt="Reminder System">
  
  <video width="300" controls>
    <source src="Images/elix_vid1.mp4" type="video/mp4">
  </video>
  <video width="300" controls>
    <source src="Images/elix_vid2.mp4" type="video/mp4">
  </video>
</div>