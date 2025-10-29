import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from "@expo/vector-icons";

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: `Justice AI - Legal Rights Assistant

Welcome! I’m your AI-powered assistant for Indian legal rights.  
Ask me about laws, rights, or procedures.

1️⃣ My salary hasn’t been paid — what can I do?  
2️⃣ Someone is harassing me online — how to report?`,
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const loadingMsg = {
      id: (Date.now() + 1).toString(),
      sender: "bot",
      text: "⏳ Analyzing your query...",
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const backendURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5000/predict"
          : "http://127.0.0.1:5000/predict";
      const localNetworkURL = "http://192.168.159.164:5000/predict";

      const activeURL =
        Platform.OS === "android" || Platform.OS === "ios"
          ? localNetworkURL
          : backendURL;

      const res = await fetch(activeURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      let botResponse = `
⚖️ Justice AI - Legal Rights Assistant

✅ Section: ${data.section}

⚖️ Offense: ${data.offense}

📝 Description:  
${data.description}

🚔 Punishment:  
${data.punishment}

📚 More Details:  
${data.moreDetails}

💡 Remember: This is for educational awareness. Consult a professional for serious legal matters.
`;

      // ✅ Remove all asterisks (*) before rendering
      botResponse = botResponse.replace(/\*/g, "");

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsg.id ? { ...msg, text: botResponse } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsg.id
            ? { ...msg, text: "❌ Network error: " + error.message }
            : msg
        )
      );
    }
  };

  /** 📘 Markdown-like formatter for bot messages */
  const formatMarkdown = (text) => {
    const cleanedText = text.replace(/\*/g, ""); // remove all * characters
    const lines = cleanedText.trim().split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("⚖️")) {
        return (
          <Text key={index} style={styles.botTitle}>
            {trimmed}
          </Text>
        );
      }

      if (
        trimmed.startsWith("✅") ||
        trimmed.startsWith("⚖️") ||
        trimmed.startsWith("📝") ||
        trimmed.startsWith("🚔") ||
        trimmed.startsWith("📚")
      ) {
        return (
          <Text key={index} style={styles.botHeading}>
            {trimmed}
          </Text>
        );
      }

      if (/^\d+️⃣/.test(trimmed)) {
        return (
          <Text key={index} style={styles.botNumbered}>
            {trimmed}
          </Text>
        );
      }

      if (trimmed.startsWith("💡")) {
        return (
          <Text key={index} style={styles.botNote}>
            {trimmed}
          </Text>
        );
      }

      return (
        <Text key={index} style={styles.botParagraph}>
          {trimmed}
        </Text>
      );
    });
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userContainer : styles.botContainer,
      ]}
    >
      {item.sender === "bot" && (
        <View style={styles.botIconContainer}>
          <MaterialIcons name="balance" size={22} color="#1c2b4d" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          item.sender === "user" ? styles.userBubble : styles.botBubble,
        ]}
      >
        {item.sender === "bot" ? (
          <View style={styles.botMessage}>{formatMarkdown(item.text)}</View>
        ) : (
          <Text style={styles.userText}>{item.text}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image
          source={require('./assets/icon.png')}
          style={styles.headerIcon}
        />
        <View>
          <Text style={styles.headerTitle}>Justice AI</Text>
          <Text style={styles.headerSubtitle}>
            Legal Rights Assistant for India
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatArea}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your legal rights..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <MaterialIcons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ This is an informational tool — not a substitute for professional
          legal advice.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fa" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 3,
  },
  headerIcon: { width: 40, height: 40, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1c2b4d" },
  headerSubtitle: { fontSize: 13, color: "#666" },

  chatArea: { paddingHorizontal: 16, paddingVertical: 10 },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-start",
  },
  botContainer: { justifyContent: "flex-start" },
  userContainer: { justifyContent: "flex-end", alignSelf: "flex-end" },
  botIconContainer: { marginRight: 8, marginTop: 6 },

  bubble: { maxWidth: "85%", padding: 12, borderRadius: 14, elevation: 1 },
  botBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: "#1c2b4d",
    borderTopRightRadius: 0,
    alignSelf: "flex-end",
  },

  botMessage: { flexDirection: "column" },
  botTitle: {
    color: "#1c2b4d",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  botHeading: {
    color: "#1c2b4d",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 3,
  },
  botNumbered: {
    color: "#1c2b4d",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 10,
    marginBottom: 4,
  },
  botParagraph: {
    color: "#333",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  botNote: {
    color: "#0d6efd",
    fontStyle: "italic",
    marginTop: 8,
    fontSize: 14,
  },
  userText: { color: "#fff", fontSize: 15, lineHeight: 22 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 15,
    height: 42,
    color: "#333",
  },
  sendBtn: {
    backgroundColor: "#1c2b4d",
    padding: 10,
    borderRadius: 25,
    marginLeft: 8,
    elevation: 2,
  },

  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    paddingVertical: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    lineHeight: 18,
  },
});
