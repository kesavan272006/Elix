import React, { useState, useRef } from "react";
import {
  StyleSheet, TextInput, Button, View,
  ScrollView, Text, KeyboardAvoidingView, Platform
} from "react-native";
import { chatWithGemini } from "../../utils/gemini";

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey! I am Elix- Executive Learning Interface eXpert, a proactive, voice-first AI assistant designed to help users get things done quickly and naturally on their mobile device." },
  ]);
  const scrollRef = useRef(null);

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const reply = await chatWithGemini(userMsg.text, messages);
      const botMsg = { from: "bot", text: reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Oops, something went wrong." },
      ]);
      console.error(err);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Elix</Text>
      </View>

      <ScrollView style={styles.scrollArea} ref={scrollRef}>
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              m.from === "user" && { backgroundColor: "#330000", alignSelf: "flex-end" },
            ]}
          >
            <Text style={styles.messageText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type something..."
          placeholderTextColor="#aa6666"
          onSubmitEditing={send}
        />
        <Button title="Send" color="#ff4444" onPress={send} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d", paddingHorizontal: 12, paddingTop: 40 },
  header: { alignItems: "center", justifyContent: "center", backgroundColor: "#1a0000", paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: "bold", color: "#ff3333", fontStyle: "italic" },
  scrollArea: { flex: 1, marginBottom: 10 },
  messageBubble: { backgroundColor: "#1a1a1a", padding: 12, borderRadius: 10, marginVertical: 6, maxWidth: "80%" },
  messageText: { color: "#ff9999", fontSize: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a0000", padding: 8, borderRadius: 10 },
  input: { flex: 1, backgroundColor: "#2b0000", color: "#fff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10, borderColor: "#ff4444", borderWidth: 1 },
});
