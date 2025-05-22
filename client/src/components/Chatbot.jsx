import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your legal assistant. Ask me any legal questions you have, and I'll do my best to help you.", isUser: false }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: inputMessage })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from server');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { text: data.response || 'I apologize, but I was unable to process your request.', isUser: false }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { text: 'I apologize, but I encountered an error. Please try again later.', isUser: false }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chat-header">
                <div className="logo">
                    <i className="fas fa-balance-scale"></i>
                    <h1>Legal Chatbot</h1>
                </div>
                <p className="tagline">Your AI Legal Assistant</p>
            </div>
            
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
                        <div className="message-content">
                            {message.isUser ? (
                                <p>{message.text}</p>
                            ) : (
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message bot">
                        <div className="message-content typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
                <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your legal question here..."
                    rows={1}
                />
                <button onClick={handleSendMessage}>
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    );
};

export default Chatbot; 