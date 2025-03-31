"use client";
import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    // 내 메시지 추가
    setMessages((prev) => [...prev, `👤: ${input}`]);

    const response = await fetch("https://findyourwave.uk/webhook/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input }),
    });

    const result = await response.json();
    setMessages((prev) => [...prev, `🤖: ${result.reply}`]);
    setInput("");
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="질문을 입력하세요"
      />
      <button onClick={sendMessage}>보내기</button>
    </div>
  );
}
