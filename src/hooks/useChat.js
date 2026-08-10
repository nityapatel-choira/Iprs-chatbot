import { useCallback, useState } from "react";

const WELCOME = {
  id: "welcome",
  sender: "bot",
  text: "Namaste! Main IPRS Assist hoon. Membership registration, required documents, fees, ya DigiLocker verification ke baare mein kuch bhi pooch sakte hain.",
  timestamp: Date.now(),
  status: "sent",
};

let idCounter = 1;

export function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((text) => {
    const userMsg = {
      id: `msg-${idCounter++}`,
      sender: "user",
      text,
      timestamp: Date.now(),
      status: "sent",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Placeholder response — replace with a real API call once the
    // backend/chat service is wired up. A failed call should set the
    // triggering message's status to "error" instead of adding a bot reply.
    setTimeout(() => {
      const botMsg = {
        id: `msg-${idCounter++}`,
        sender: "bot",
        text: "Ye ek scaffolded response hai. Actual chatbot logic yahan connect karein.",
        timestamp: Date.now(),
        status: "sent",
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  }, []);

  return { messages, isTyping, sendMessage };
}
