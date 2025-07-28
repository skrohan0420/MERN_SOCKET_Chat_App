
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socketUrl = "http://localhost:5000";

const Chat = () => {

    const [messages, setMessages] = useState([]);
    const [username] = useState("User" + Math.floor(Math.random() * 100));
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [typingUser, setTypingUser] = useState("");
    const [room, setRoom] = useState("");
    const [joined, setJoined] = useState(false);
    const typingTimeoutRef = useRef();
    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io(socketUrl, {
            transports: ["websocket"],
            reconnectionAttempts: 3,
        });

        socketRef.current.on("connect_error", (err) => {
            setError("Socket connection failed");
        });

        // Listen for new messages
        socketRef.current.on("chat:message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Listen for typing indicator
        socketRef.current.on("typing", (typingUsername) => {
            if (typingUsername !== username) {
                setTypingUser(typingUsername);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 1500);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            clearTimeout(typingTimeoutRef.current);
        };
    }, [username]);

    // Join room and load messages for that room
    const joinRoom = async () => {
        if (!room.trim()) return;
        setJoined(true);
        setMessages([]);
        socketRef.current.emit("joinRoom", room);
        // Optionally, you can filter messages by room from the server
        // For now, just load all messages
        axios.get(`${socketUrl}/messages`)
            .then((res) => setMessages(res.data.filter(m => m.room === room || !m.room)))
            .catch((err) => setError("Failed to load messages"));
    };

    const sendMessage = () => {
        if (text.trim() && joined) {
            socketRef.current.emit("chat:message", { username, text, room });
            setText("");
        }
    };

    const handleInputChange = (e) => {
        setText(e.target.value);
        if (joined) socketRef.current.emit("typing", username);
    };

    return (
        <div>
            {!joined ? (
                <div style={{ marginBottom: 16 }}>
                    <input
                        value={room}
                        onChange={e => setRoom(e.target.value)}
                        placeholder="Enter room name"
                        style={{ marginRight: 8 }}
                    />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Room:</strong> {room}
                    </div>
                    <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc", marginBottom: 8 }}>
                        {messages.map((msg, i) => (
                            <div key={i}>
                                <strong>{msg.username}:</strong> {msg.text}
                            </div>
                        ))}
                    </div>
                    {typingUser && <div style={{ color: "#888", marginBottom: 8 }}>{typingUser} is typing...</div>}
                    {error && <div style={{ color: "red" }}>{error}</div>}
                    <input
                        value={text}
                        onChange={handleInputChange}
                        placeholder="Type a message"
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}
        </div>
    );
};

export default Chat;
