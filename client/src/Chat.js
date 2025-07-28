
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socketUrl = "http://localhost:5000";

const Chat = () => {

    const [messages, setMessages] = useState([]);
    const [username] = useState("User" + Math.floor(Math.random() * 100));
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const socketRef = useRef();

    useEffect(() => {
        // Connect socket
        socketRef.current = io(socketUrl, {
            transports: ["websocket"],
            reconnectionAttempts: 3,
        });

        // Load existing messages
        axios.get(`${socketUrl}/messages`)
            .then((res) => setMessages(res.data))
            .catch((err) => setError("Failed to load messages"));

        // Listen for new messages
        socketRef.current.on("chat:message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socketRef.current.on("connect_error", (err) => {
            setError("Socket connection failed");
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (text.trim()) {
            socketRef.current.emit("chat:message", { username, text });
            setText("");
        }
    };

    return (
        <div>
            <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc", marginBottom: 8 }}>
                {messages.map((msg, i) => (
                    <div key={i}>
                        <strong>{msg.username}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
