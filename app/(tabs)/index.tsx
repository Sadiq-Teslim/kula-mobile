import { useState, useEffect } from "react"; // Added useEffect
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView, // Added for better screen layout
} from "react-native";
// --- Step 1: Import the voice library ---
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

const SERVER_IP = "192.168.57.168";
const SERVER_URL = `http://${SERVER_IP}:3000/interact`;

// Our Kula Brand Colors
const COLORS = {
  background: "#FFF5E1",
  primary: "#4AA8A4",
  accent: "#FABDA5",
  text: "#333333",
};

export default function App() {
  // --- State Variables (with new additions for voice) ---
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [recognizedText, setRecognizedText] = useState("");

  // --- Step 2: Set up voice listeners ---
  useEffect(() => {
    const onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setRecognizedText(e.value[0]);
      }
    };
    const onSpeechEnd = () => {
      setIsListening(false);
      console.log("Speech listening has ended.");
    };
    const onSpeechError = (e: SpeechErrorEvent) => {
      console.error("Speech Error:", e.error);
      setIsListening(false);
    };

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // --- Step 3: Functions to control listening ---
  const startListening = async () => {
    setRecognizedText("");
    setAiReply("");
    setIsListening(true);
    try {
      await Voice.start("en-US"); // You can also try 'en-NG'
    } catch (e) {
      console.error("Failed to start listening:", e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      // The onSpeechEnd handler will set isListening to false
    } catch (e) {
      console.error("Failed to stop listening:", e);
    }
  };

  // --- Step 4: Updated function to handle the entire flow ---
  const handlePress = async () => {
    if (isLoading) return;

    if (isListening) {
      // If we are already listening, stop and send the text
      await stopListening();
      if (recognizedText) {
        sendToServer(recognizedText);
      }
    } else {
      // If not listening, start
      await startListening();
    }
  };

  const sendToServer = async (message: string) => {
    console.log(`Sending this to server: "${message}"`);
    setIsLoading(true);
    setAiReply("");

    try {
      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setAiReply(data.reply || "Sorry, I couldn't get a response.");
    } catch (error) {
      console.error("Network Error:", error);
      setAiReply(
        "I'm having trouble connecting to my brain. Please check the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use SafeAreaView to avoid screen notches
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Image
        source={require("../../assets/images/kula-logo.jpg")}
        style={styles.logo}
      />
      <Text style={styles.title}>Kula</Text>
      <Text style={styles.subtitle}>
        Your AI companion for mother and child
      </Text>

      {/* --- New display for transcribed text --- */}
      <View style={styles.transcriptContainer}>
        <Text style={styles.transcriptText}>
          {isListening
            ? "I'm listening..."
            : recognizedText || "Tap the button to speak"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.talkButton, isListening && styles.listeningButton]} // Style changes when listening
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isListening ? "Send" : "Tap to Talk"}
          </Text>
        )}
      </TouchableOpacity>

      {aiReply ? (
        <ScrollView style={styles.replyContainer}>
          <Text style={styles.replyText}>{aiReply}</Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// --- Styles (with new additions) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 20, // Adjusted margin
  },
  // New Styles
  transcriptContainer: {
    height: 60,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  transcriptText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: "center",
    fontStyle: "italic",
  },
  talkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
    alignItems: "center",
  },
  listeningButton: {
    backgroundColor: COLORS.accent, // Change color when listening
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  replyContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: "30%",
    width: "100%",
  },
  replyText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
