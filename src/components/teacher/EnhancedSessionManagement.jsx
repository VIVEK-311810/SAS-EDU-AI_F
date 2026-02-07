import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, sessionAPI, pollAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import GeneratedMCQs from './GeneratedMCQs';
import AudioRecorder from './AudioRecorder';
import useAudioRecorder from '../../hooks/useAudioRecorder';

// WebSocket URL configuration
const WS_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace('http://', 'ws://' ).replace('https://', 'wss://' ).replace('/api', '') :
  'ws://localhost:3001';

const EnhancedSessionManagement = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [generatedMCQs, setGeneratedMCQs] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    justification: '',
    timeLimit: 60
  });
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [pollStats, setPollStats] = useState({});

  // Activity tracking state
  const [lastSegmentTime, setLastSegmentTime] = useState(null);
  const [segmentCount, setSegmentCount] = useState(0);
  const [newMCQsCount, setNewMCQsCount] = useState(0);
  const [activityPulse, setActivityPulse] = useState(false);

  const wsRef = useRef(null);

  // Initialize audio recorder hook
  const audioRecorder = useAudioRecorder(sessionId);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'teacher') {
      navigate('/auth');
      return;
    }

    fetchSession();
    fetchParticipants();
    fetchPolls();
    fetchGeneratedMCQs();
    setupWebSocketConnection();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, navigate]);

  useEffect(() => {
    if (activeTab === 'existing-polls') {
      polls.forEach(poll => {
        fetchPollStats(poll.id);
      });
    }
  }, [activeTab, polls]);

  // Refresh relative timestamps every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update "Xm ago" displays
      if (lastSegmentTime) {
        setLastSegmentTime(prev => new Date(prev));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSegmentTime]);

  const setupWebSocketConnection = () => {
    try {
      console.log('Setting up teacher WebSocket connection...');
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Teacher WebSocket connected');
        setWsConnected(true);
        window.socket = ws;

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id) {
          ws.send(JSON.stringify({
            type: 'join-session',
            sessionId: sessionId,
            studentId: currentUser.id,
            role: 'teacher'
          }));
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Teacher WebSocket message received:', data);

        switch (data.type) {
          case 'participant-count-updated':
            fetchParticipants();
            break;
          case 'poll-activated':
            setActivePoll(data.poll);
            fetchPolls(); // Refresh polls to see active status
            break;
          case 'transcript-segment-sent':
            if (data.sessionId?.toUpperCase() === sessionId?.toUpperCase()) {
              console.log('Transcript segment sent notification received:', data);
              setLastSegmentTime(new Date(data.timestamp));
              setSegmentCount(prev => prev + 1);
              setActivityPulse(true);
              setTimeout(() => setActivityPulse(false), 2000);
            }
            break;
          case 'mcqs-generated':
            if (data.sessionId?.toUpperCase() === sessionId?.toUpperCase()) {
              console.log('MCQs generated notification received:', data);
              setNewMCQsCount(prev => prev + data.count);
              setActivityPulse(true);
              setTimeout(() => setActivityPulse(false), 2000);
              fetchGeneratedMCQs();
            }
            break;
          case 'mcqs-sent':
            if (data.sessionId?.toUpperCase() === sessionId?.toUpperCase()) {
              fetchGeneratedMCQs();
              fetchPolls();
            }
            break;
          default:
            console.log('Unhandled message type:', data.type);
        }
      };

      ws.onclose = () => {
        console.log('Teacher WebSocket disconnected');
        setWsConnected(false);
        window.socket = null;
        setTimeout(() => setupWebSocketConnection(), 3000);
      };

      ws.onerror = (error) => {
        console.error('Teacher WebSocket error:', error);
        setWsConnected(false);
      };

    } catch (error) {
      console.error('Error setting up teacher WebSocket:', error);
      setWsConnected(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchSession = async () => {
    try {
      const data = await sessionAPI.getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const data = await sessionAPI.getParticipants(sessionId);
      setParticipants(Array.isArray(data) ? data : (data.participants || []));
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    }
  };

  const fetchPolls = async () => {
    try {
      const data = await apiRequest(`/sessions/${sessionId}/polls`);
      const polls = data.polls || data;
      const normalized = Array.isArray(polls) ? polls.map(p => ({
        ...p,
        correctAnswer: p.correctAnswer !== undefined ? p.correctAnswer : p.correct_answer,
        createdAt: p.createdAt || p.created_at,
        isActive: p.isActive !== undefined ? p.isActive : p.is_active,
        options: Array.isArray(p.options) ? p.options : (typeof p.options === 'string' ? JSON.parse(p.options) : []),
      })) : [];
      setPolls(normalized);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setPolls([]);
    }
  };

  const fetchGeneratedMCQs = async () => {
    try {
      const data = await apiRequest(`/sessions/${sessionId}/generated-mcqs`);
      const mcqs = data.mcqs || data;
      setGeneratedMCQs(Array.isArray(mcqs) ? mcqs : []);
    } catch (error) {
      console.error('Error fetching generated MCQs:', error);
      setGeneratedMCQs([]);
    }
  };

  const fetchPollStats = async (pollId) => {
    try {
      const stats = await pollAPI.getPollStats(pollId);
      setPollStats(prev => ({ ...prev, [pollId]: stats.data }));
      
    } catch (error) {
      console.error(`Error fetching stats for poll ${pollId}:`, error);
    }
  };


  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const pollData = {
        session_id: sessionId,
        question: newPoll.question,
        options: newPoll.options.filter(opt => opt.trim() !== ''),
        correct_answer: newPoll.correctAnswer,
        justification: newPoll.justification,
        time_limit: newPoll.timeLimit
      };

      const data = await pollAPI.createPoll(pollData);

      console.log('Poll created and added to queue:', data);
      setNewPoll({ question: '', options: ['', '', '', ''], correctAnswer: 0, justification: '', timeLimit: 60 });
      alert('Poll created and added to queue!');
      await activatePoll(data);
      fetchPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    }
  };

  const activatePoll = async (poll) => {
    try {
      console.log('Activating poll:', poll);
      const activatedPoll = await pollAPI.activatePoll(poll.id);
      console.log('Poll activated successfully:', activatedPoll);

      setActivePoll(activatedPoll);
      fetchPolls(); // Refresh the list to show active status

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = { type: 'activate-poll', sessionId, poll: activatedPoll };
        wsRef.current.send(JSON.stringify(message));
        alert('Poll activated and sent to students!');
      } else {
        alert('Poll activated, but WebSocket is not connected.');
      }
    } catch (error) {
      console.error('Error activating poll:', error);
      alert('Error activating poll: ' + error.message);
    }
  };

  const handleDeactivatePoll = async (pollId) => {
    try {
      await pollAPI.closePoll(pollId);
      setActivePoll(null);
      fetchPolls(); // Refresh list

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'poll-deactivated', sessionId, pollId }));
      }
      alert('Poll deactivated.');
    } catch (error)
    {
      console.error('Error deactivating poll:', error);
      alert('Error deactivating poll');
    }
  };

  const updatePollOption = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleEditMCQ = (mcq) => {
    setEditingMCQ({
      id: mcq.id,
      question: mcq.question,
      options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options),
      correctAnswer: mcq.correct_answer,
      justification: mcq.justification || '',
      timeLimit: mcq.time_limit || 60
    });
    setShowEditModal(true);
  };

  const handleUpdateMCQ = async () => {
    if (!editingMCQ) return;
    try {
      await apiRequest(`/generated-mcqs/${editingMCQ.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          question: editingMCQ.question,
          options: editingMCQ.options,
          correct_answer: editingMCQ.correctAnswer,
          justification: editingMCQ.justification,
          time_limit: editingMCQ.timeLimit
        })
      });
      alert('MCQ updated successfully!');
      setShowEditModal(false);
      setEditingMCQ(null);
      fetchGeneratedMCQs();
    } catch (error) {
      console.error('Error updating MCQ:', error);
      alert('Error updating MCQ');
    }
  };

  const handleDeleteMCQ = async (mcqId) => {
    if (!window.confirm('Are you sure you want to delete this MCQ?')) {
      return;
    }
    try {
      await apiRequest(`/generated-mcqs/${mcqId}`, { method: 'DELETE' });
      alert('MCQ deleted successfully!');
      fetchGeneratedMCQs();
    } catch (error) {
      console.error('Error deleting MCQ:', error);
      alert('Error deleting MCQ');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading session management..." />;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{session.title}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{session.course_name}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 line-clamp-2">{session.description}</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg sm:bg-transparent sm:p-0">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{session.session_id}</div>
                <div className="text-xs sm:text-sm text-gray-500">Session ID</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg sm:bg-transparent sm:p-0">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{participants.filter(p => p.is_active).length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg sm:bg-transparent sm:p-0">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{polls.length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Polls</div>
              </div>
            </div>
            <div className="mt-2 text-center sm:text-right">
              <div className={`text-xs sm:text-sm font-medium ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Poll Alert */}
      {activePoll && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center min-w-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-green-800 font-medium text-sm sm:text-base truncate">Active: {activePoll.question}</span>
            </div>
            <button
              onClick={() => handleDeactivatePoll(activePoll.id)}
              className="text-green-600 hover:text-green-800 active:text-green-900 font-medium text-sm py-1 self-end sm:self-auto"
            >
              End Poll
            </button>
          </div>
        </div>
      )}

      {/* WebSocket Status Alert */}
      {!wsConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start sm:items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-800 font-medium text-xs sm:text-sm">WebSocket Disconnected - Real-time features may not work. Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Activity Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
          {/* Recording Status */}
          <div className="flex items-center space-x-2">
            {audioRecorder.status === 'recording' ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-red-700">🎙️ Recording Active</span>
              </>
            ) : audioRecorder.status === 'paused' ? (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-semibold text-yellow-700">⏸️ Recording Paused</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Recording Idle</span>
              </>
            )}
          </div>

          {/* Segments Sent Counter */}
          {segmentCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                📝 Segments sent:
                <span className="font-bold ml-1 text-blue-600">{segmentCount}</span>
              </span>
            </div>
          )}

          {/* Last Segment Sent Time */}
          {lastSegmentTime && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Last: <span className="font-medium text-gray-800">{formatTimeAgo(lastSegmentTime)}</span>
              </span>
            </div>
          )}

          {/* New MCQs Indicator */}
          {newMCQsCount > 0 && (
            <div className={`flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full ${activityPulse ? 'animate-pulse' : ''}`}>
              <span className="text-sm font-bold text-green-800">
                🤖 {newMCQsCount} new MCQ{newMCQsCount > 1 ? 's' : ''} generated!
              </span>
              <button
                onClick={() => {
                  setActiveTab('generated-mcqs');
                  setNewMCQsCount(0);
                }}
                className="text-xs text-green-600 hover:text-green-800 font-medium underline"
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-4 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              {
                id: 'audio-transcription',
                name: 'Audio Transcription',
                icon: '🎙️',
                badge: segmentCount > 0 ? segmentCount : null,
                badgeColor: 'bg-green-500'
              },
              { id: 'polls', name: 'Polls', icon: '📝' },
              {
                id: 'generated-mcqs',
                name: 'Generated MCQs',
                icon: '🤖',
                badge: newMCQsCount > 0 ? newMCQsCount : null,
                badgeColor: 'bg-red-500'
              },
              { id: 'participants', name: 'Participants', icon: '👥' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'existing-polls', name: 'Existing Polls', icon: '📑' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`relative py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'generated-mcqs') setNewMCQsCount(0);
                }}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                {tab.badge && (
                  <span className={`ml-1 sm:ml-2 ${tab.badgeColor} text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${activityPulse && tab.id === 'generated-mcqs' ? 'animate-pulse' : ''}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Session Status</h3>
                  <p className="text-blue-700 text-sm sm:text-base">
                    {session.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-green-900 mb-1 sm:mb-2 text-sm sm:text-base">Participants</h3>
                  <p className="text-green-700 text-sm sm:text-base">{participants.length} students joined</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">Generated MCQs</h3>
                  <p className="text-purple-700 text-sm sm:text-base">{generatedMCQs.length} available</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Quick Actions</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('polls')}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base"
                  >
                    Create Poll
                  </button>
                  <button
                    onClick={() => setActiveTab('generated-mcqs')}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base"
                  >
                    Send MCQs
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">WebSocket Status</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${wsConnected ? 'text-green-700' : 'text-red-700'}`}>
                    {wsConnected ? 'Connected - Real-time features active' : 'Disconnected - Attempting to reconnect...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audio Transcription Tab */}
          {activeTab === 'audio-transcription' && (
            <AudioRecorder audioRecorder={audioRecorder} sessionId={sessionId} />
          )}

          {/* Polls Tab */}
          {activeTab === 'polls' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Create New Poll Form */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Create New Poll</h3>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={newPoll.question}
                      onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                      className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      rows="3"
                      placeholder="Enter your poll question..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newPoll.correctAnswer === index}
                          onChange={() => setNewPoll({ ...newPoll, correctAnswer: index })}
                          className="text-blue-600 w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          placeholder={`Option ${index + 1}`}
                          required={index < 2}
                        />
                      </div>
                    ))}
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Select the correct answer by clicking the radio button
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Justification
                      </label>
                      <textarea
                        value={newPoll.justification}
                        onChange={(e) => setNewPoll({ ...newPoll, justification: e.target.value })}
                        className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        rows="2"
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (seconds)
                      </label>
                      <input
                        type="number"
                        value={newPoll.timeLimit}
                        onChange={(e) => setNewPoll({ ...newPoll, timeLimit: parseInt(e.target.value) })}
                        className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        min="10"
                        max="300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
                  >
                    Create Poll
                  </button>
                </form>
              </div>

              {/* Active Polls */}
              <div>
                {polls.length === 0 ? (
                  <p className="text-gray-500">No polls created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {polls
                    .filter(poll => poll.isActive)
                    .map((poll) => (
                      <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{poll.question}</h4>
                            <div className="space-y-1">
                              {poll.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                                    index === poll.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className={index === poll.correctAnswer ? 'font-medium text-green-800' : 'text-gray-700'}>
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              Responses: {poll.responses} • Created: {formatTimeAgo(poll.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">                            
                              <button
                                onClick={() => handleDeactivatePoll(poll.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                End Poll
                              </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated MCQs Tab */}
          {activeTab === 'generated-mcqs' && (
            <GeneratedMCQs 
              sessionId={sessionId}
              generatedMCQs={generatedMCQs}
              onMCQsSent={() => {
                fetchGeneratedMCQs();
                fetchPolls();
              }}
            />
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Session Participants</h3>
                <div className="text-sm text-gray-500">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No participants yet.</p>
                  <p className="text-sm text-gray-400">
                    Share session ID <strong>{session.session_id}</strong> with students to join.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant) => (
                        <tr key={participant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {participant.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatTimeAgo(participant.joined_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              participant.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {participant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold">Session Analytics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-xs sm:text-sm">Participants</h4>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">{participants.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-green-900 mb-1 sm:mb-2 text-xs sm:text-sm">Active Polls</h4>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">{polls.filter(p => p.isActive).length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-xs sm:text-sm">Total Polls</h4>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700">{polls.length}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-orange-900 mb-1 sm:mb-2 text-xs sm:text-sm">MCQs</h4>
                  <p className="text-xl sm:text-2xl font-bold text-orange-700">{generatedMCQs.length}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Detailed analytics and reporting features would be implemented here in a full application.
                </p>
              </div>
            </div>
          )}

          {/* Existing Polls Tab */}
          {activeTab === 'existing-polls' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">All Polls & Stats</h3>

              {polls.length === 0 ? (
                <p className="text-gray-500">No polls available.</p>
              ) : (
                <div className="space-y-4">
                  {polls.map(poll => (
                  <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">{poll.question}</h4>

                    <div className="space-y-1">
                      {poll.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                            index === poll.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className={index === poll.correctAnswer ? 'font-medium text-green-800' : 'text-gray-700'}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                    {poll.justification && 
                      <div className="text-sm text-gray-500 mt-1">
                        Justification: {poll.justification}
                      </div>}

                    {pollStats[poll.id] && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <div>Answered: {pollStats[poll.id].answered}</div>
                        <div>Not Answered: {pollStats[poll.id].not_answered}</div>
                        <div>Correct Percentage: {pollStats[poll.id].correct_percentage}%</div>
                        {pollStats[poll.id].first_correct_student_id && (
                          <div>First Correct: {pollStats[poll.id].first_correct_student_id}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit MCQ Modal */}
      {showEditModal && editingMCQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit MCQ</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  value={editingMCQ.question}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, question: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                {editingMCQ.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="editCorrectAnswer"
                      checked={editingMCQ.correctAnswer === index}
                      onChange={() => setEditingMCQ({ ...editingMCQ, correctAnswer: index })}
                      className="text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
// ... (continuation of EnhancedSessionManagement.jsx)
                      const updatedOptions = [...editingMCQ.options];
                        updatedOptions[index] = e.target.value;
                        setEditingMCQ({ ...editingMCQ, options: updatedOptions });
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification
                </label>
                <textarea
                  value={editingMCQ.justification}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, justification: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={editingMCQ.timeLimit}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, timeLimit: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="10"
                  max="300"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMCQ(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMCQ}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Update MCQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSessionManagement;
