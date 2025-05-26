import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { actionService } from "../../utils/actionService";
import { geminiService } from "../../utils/gptService";
import { voiceRecognition } from "../../utils/voiceRecognition";
import { wakeWordService } from "../../utils/wakeWordService";

interface Message {
  id: string;
  text: string;
  type: "user" | "assistant";
  timestamp: Date;
  metadata?: any;
}

export default function HomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [isTextInput, setIsTextInput] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Check if voice recognition is available
    if (Platform.OS === "web") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsVoiceAvailable(!!SpeechRecognition);
    } else {
      // For mobile, we'll implement this later
      setIsVoiceAvailable(false);
    }

    // Add welcome message
    setMessages([
      {
        id: "welcome",
        text: 'Hello! I\'m ELIX, your intelligent digital colleague. Say "Elix" to activate me.',
        type: "assistant",
        timestamp: new Date(),
      },
    ]);

    // Start wake word detection
    if (isVoiceAvailable) {
      wakeWordService.startListening(() => {
        setIsWakeWordActive(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Automatically start listening for command
        startListening();
      });
    }

    return () => {
      wakeWordService.stopListening();
    };
  }, [isVoiceAvailable]);

  const startListening = async () => {
    if (!isVoiceAvailable) {
      Alert.alert(
        "Voice Recognition Unavailable",
        "Voice recognition is not available on this device or browser.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsListening(true);
      setTranscript("");
      setIsProcessing(false);

      await voiceRecognition.startListening(
        async (text) => {
          setTranscript(text);
          if (text.trim()) {
            setIsProcessing(true);
            try {
              const response = await geminiService.processCommand(text);
              handleGeminiResponse(response);
            } catch (error) {
              console.error("Error processing command:", error);
              addMessage(
                "I encountered an error processing your request. Please try again.",
                "assistant"
              );
            } finally {
              setIsProcessing(false);
            }
          }
        },
        (error) => {
          console.error("Voice recognition error:", error);
          if (error.message === "Microphone permission denied") {
            Alert.alert(
              "Microphone Permission Required",
              "Please allow microphone access in your browser settings to use voice commands.",
              [
                {
                  text: "Open Settings",
                  onPress: () => {
                    if (Platform.OS === "web") {
                      // Try to open browser settings
                      window.open(
                        "chrome://settings/content/microphone",
                        "_blank"
                      );
                    }
                  },
                },
                {
                  text: "Try Again",
                  onPress: () => {
                    voiceRecognition.resetPermissions();
                    startListening();
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          } else {
            Alert.alert(
              "Voice Recognition Error",
              "There was an error with voice recognition. Please try again.",
              [{ text: "OK" }]
            );
          }
          setIsListening(false);
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      setIsListening(false);
      setIsProcessing(false);
      Alert.alert(
        "Error",
        "Failed to start voice recognition. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const stopListening = () => {
    voiceRecognition.stopListening();
    setIsListening(false);
    setIsWakeWordActive(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGeminiResponse = async (response: any) => {
    // Add assistant message
    const assistantMessage: Message = {
      id: Date.now().toString(),
      text: response.text,
      type: "assistant",
      timestamp: new Date(),
      metadata: response.metadata,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Speak the response
    await voiceRecognition.speak(response.text);

    // Handle any actions
    if (response.metadata?.action) {
      try {
        switch (response.metadata.action) {
          case "open_app":
            await actionService.openApp(response.metadata.parameters.app);
            break;
          case "open_website":
            await actionService.openWebsite(response.metadata.parameters.url);
            break;
          case "set_reminder":
            const reminderTime = new Date(response.metadata.parameters.time);
            await actionService.setReminder(
              response.metadata.parameters.text,
              reminderTime
            );
            break;
        }
      } catch (error) {
        console.error("Error executing action:", error);
      }
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      type: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Process with Gemini
    const response = await geminiService.processCommand(inputText);

    // Handle the response
    await handleGeminiResponse(response);

    setIsProcessing(false);
    setInputText("");
    setIsTextInput(false);
  };

  const toggleInputMode = () => {
    setIsTextInput(!isTextInput);
    if (!isTextInput) {
      // Switch to text input
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else {
      // Switch to voice input
      setIsWakeWordActive(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.type === "user" ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BlurView intensity={80} style={styles.content}>
        <Text style={[styles.title, { color: Colors.dark.text }]}>ELIX</Text>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map(renderMessage)}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={Colors.dark.text} />
              <Text
                style={[styles.processingText, { color: Colors.dark.text }]}
              >
                Processing...
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          ]}
        >
          {isTextInput ? (
            <>
              <TextInput
                ref={textInputRef}
                style={[styles.textInput, { color: Colors.dark.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.actionButton, styles.sendButton]}
                onPress={handleTextSubmit}
                disabled={!inputText.trim()}
              >
                <MaterialIcons
                  name="send"
                  size={24}
                  color={inputText.trim() ? Colors.dark.text : Colors.dark.tint}
                />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {transcript ? (
                <Text
                  style={[styles.transcriptText, { color: Colors.dark.text }]}
                >
                  {transcript}
                </Text>
              ) : (
                <Text
                  style={[styles.placeholderText, { color: Colors.dark.tint }]}
                >
                  {isWakeWordActive
                    ? "Listening for your command..."
                    : isVoiceAvailable
                    ? "Say 'Elix' to activate"
                    : "Voice recognition is not available"}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isListening && styles.micButtonActive,
                  !isVoiceAvailable && styles.micButtonDisabled,
                ]}
                onPress={isListening ? stopListening : startListening}
                disabled={!isVoiceAvailable}
              >
                <MaterialIcons
                  name={isListening ? "mic" : "mic-none"}
                  size={32}
                  color={
                    isListening
                      ? Colors.dark.icon
                      : isVoiceAvailable
                      ? Colors.dark.text
                      : Colors.dark.tint
                  }
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={toggleInputMode}
          >
            <MaterialIcons
              name={isTextInput ? "mic" : "keyboard"}
              size={24}
              color={Colors.dark.text}
            />
          </TouchableOpacity>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: "rgba(241, 219, 75, 0.2)",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  timestamp: {
    color: Colors.dark.tint,
    fontSize: 12,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  processingText: {
    marginLeft: 10,
  },
  inputContainer: {
    borderRadius: 25,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
    padding: 8,
  },
  transcriptText: {
    flex: 1,
    marginRight: 10,
  },
  placeholderText: {
    flex: 1,
    marginRight: 10,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  micButtonActive: {
    backgroundColor: "rgba(241, 219, 75, 0.2)",
    borderColor: Colors.dark.icon,
  },
  micButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  sendButton: {
    marginRight: 10,
  },
  toggleButton: {
    backgroundColor: "rgba(241, 219, 75, 0.2)",
    borderColor: Colors.dark.icon,
  },
});
