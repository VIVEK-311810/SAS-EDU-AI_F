import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { utils } from '../../utils/api';

const AIAssistant = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const currentUser = utils.getCurrentUser();
  const messagesEndRef = useRef(null);

  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session info and conversation history
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }

    if (!sessionId) {
      navigate('/student/dashboard');
      return;
    }

    // Load session info (optional - not critical if it fails)
    fetchSessionInfo();

    // Load conversation history from localStorage
    const savedMessages = localStorage.getItem(`chat_history_${sessionId}`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error loading chat history:', e);
        // Show welcome message if parsing fails
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          content: 'Hi! I\'m your AI study assistant. Ask me anything about your course materials!',
          timestamp: new Date(),
          searchResults: []
        }]);
      }
    } else {
      // Show welcome message
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: 'Hi! I\'m your AI study assistant. Ask me anything about your course materials!',
        timestamp: new Date(),
        searchResults: []
      }]);
    }
  }, [sessionId]); // Removed currentUser and navigate from dependencies to prevent infinite loops

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome')) {
      localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const fetchSessionInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/sessions/${sessionId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data.session);
      }
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isSearching) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSearching(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/ai-search/session/${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: userMessage.content, top_k: 5 })
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Create assistant message with search results
        const assistantMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: data.results.length > 0
            ? `I found ${data.results.length} relevant ${data.results.length === 1 ? 'section' : 'sections'} in your course materials:`
            : "I couldn't find any relevant information about that in your session materials. Try rephrasing your question or asking about a different topic.",
          timestamp: new Date(),
          searchResults: data.results || []
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);

      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching. Please try again.',
        timestamp: new Date(),
        searchResults: []
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSearching) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800',
      'document': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-green-100 text-green-800',
      'spreadsheet': 'bg-yellow-100 text-yellow-800',
      'url': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600">
                {sessionInfo ? `Helping you with: ${sessionInfo.session_name}` : 'Your personal learning companion'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[700px]">

        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Study Assistant</h3>
              <p className="text-sm text-blue-100">Powered by semantic search</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'max-w-[70%]' : ''}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                      {message.content}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {formatTime(message.timestamp)}
                  </p>

                  {/* Search Results (for assistant messages) */}
                  {message.type === 'assistant' && message.searchResults && message.searchResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.searchResults.map((result, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {/* Result Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-600 mb-1">
                                {result.resource_title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Page {result.pageNumber} • Relevance: {(result.similarityScore * 100).toFixed(1)}%
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.resource_type)}`}>
                              {result.resource_type}
                            </span>
                          </div>

                          {/* Result Content */}
                          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                            {result.text}
                          </p>

                          {/* View Document Link */}
                          <a
                            href={result.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View Document
                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isSearching && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Searching course materials...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your course materials..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !inputMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
