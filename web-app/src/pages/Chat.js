import React, { useState } from "react";
import ChatBox from "../components/ChatBox";

const Chat = () => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (msg) => {
    setMessages([...messages, msg]);
  };

  return (
    <div>
      <h2>Chat</h2>
      <ChatBox messages={messages} onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chat;
