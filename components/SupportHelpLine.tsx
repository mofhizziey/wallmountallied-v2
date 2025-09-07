"use client"
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Phone, Mail, Clock, ChevronDown } from 'lucide-react';

const SupportHelpLine = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm here to help you. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      options: ['Technical Support', 'Billing Questions', 'General Inquiry', 'Report a Bug']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // chat, contact, faq
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-generated replies based on keywords
  const generateAutoReply = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('technical') || message.includes('bug') || message.includes('error')) {
      return {
        text: "I understand you're experiencing a technical issue. Let me help you troubleshoot this. Can you please describe what exactly is happening?",
        options: ['Page won\'t load', 'Feature not working', 'Error message', 'Something else']
      };
    } else if (message.includes('billing') || message.includes('payment') || message.includes('subscription')) {
      return {
        text: "I can help you with billing questions. What specific billing issue are you experiencing?",
        options: ['Cancel subscription', 'Update payment method', 'View invoice', 'Refund request']
      };
    } else if (message.includes('account') || message.includes('login') || message.includes('password')) {
      return {
        text: "Having trouble with your account? I'm here to help. What account-related issue are you facing?",
        options: ['Reset password', 'Update profile', 'Account locked', 'Delete account']
      };
    } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return {
        text: "Hello! Great to hear from you. What can I help you with today?",
        options: ['Technical Support', 'Billing Questions', 'General Inquiry', 'Contact Human Agent']
      };
    } else if (message.includes('human') || message.includes('agent') || message.includes('representative')) {
      return {
        text: "I'll connect you with one of our human agents. Please hold on while I transfer you. In the meantime, could you briefly describe your issue?",
        options: []
      };
    } else {
      return {
        text: "Thank you for your message. I'm processing your request and will provide you with the best assistance possible. Is there anything specific you'd like me to help you with?",
        options: ['Get more help', 'Contact support team', 'View FAQ', 'Start over']
      };
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botReply = generateAutoReply(inputMessage);
      const newBotMessage = {
        id: messages.length + 2,
        text: botReply.text,
        sender: 'bot',
        timestamp: new Date(),
        options: botReply.options
      };
      
      setMessages(prev => [...prev, newBotMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (option) => {
    const newUserMessage = {
      id: messages.length + 1,
      text: option,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botReply = generateAutoReply(option);
      const newBotMessage = {
        id: messages.length + 2,
        text: botReply.text,
        sender: 'bot',
        timestamp: new Date(),
        options: botReply.options
      };
      
      setMessages(prev => [...prev, newBotMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking 'Forgot Password' on the login page, or contact our support team."
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach us through this chat, email us at support@company.com, or call us at +1-800-SUPPORT."
    },
    {
      question: "What are your support hours?",
      answer: "Our support team is available 24/7 for chat support, and phone support is available Monday-Friday 9AM-6PM EST."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription from your account settings, or contact our billing team for assistance."
    }
  ];

  return (
    <>
      {/* Support Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {/* Support Widget */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-semibold">Support Chat</h3>
                <p className="text-xs opacity-90">We're here to help!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('chat')}
                className={`p-1 rounded ${currentView === 'chat' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={() => setCurrentView('contact')}
                className={`p-1 rounded ${currentView === 'contact' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                <Phone size={16} />
              </button>
              <button
                onClick={() => setCurrentView('faq')}
                className={`p-1 rounded ${currentView === 'faq' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Chat View */}
          {currentView === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white ml-4' 
                          : 'bg-gray-100 text-gray-800 mr-4'
                      }`}>
                        <div className="flex items-start gap-2">
                          {message.sender === 'bot' && <Bot size={16} className="mt-0.5" />}
                          {message.sender === 'user' && <User size={16} className="mt-0.5" />}
                          <div>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Reply Options */}
                    {message.options && message.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickReply(option)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full border border-blue-200 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg mr-4 flex items-center gap-2">
                      <Bot size={16} />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Contact View */}
          {currentView === 'contact' && (
            <div className="flex-1 p-4 space-y-4">
              <h4 className="font-semibold text-gray-800 mb-4">Contact Information</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">+1-800-SUPPORT</p>
                    <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@company.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600">Available 24/7</p>
                    <p className="text-xs text-gray-500">Instant responses</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setCurrentView('chat')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Start Chat Support
              </button>
            </div>
          )}

          {/* FAQ View */}
          {currentView === 'faq' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 mb-4">Frequently Asked Questions</h4>
              
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-2">{item.question}</h5>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setCurrentView('chat')}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Still need help? Start a chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SupportHelpLine;