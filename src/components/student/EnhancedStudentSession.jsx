import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
// Corrected Import: Added studentAPI
import { apiRequest, studentAPI } from '../../utils/api';

// WebSocket URL configuration
const WS_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '') :
  'wss://vk-edu-b2.onrender.com';

const EnhancedStudentSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState(null);

  // State related to poll interaction
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);

  // New state for synchronized timer
  const [pollEndTime, setPollEndTime] = useState(null);
  const [clockOffset, setClockOffset] = useState(0); // Difference between server and client time
  const [pendingReveal, setPendingReveal] = useState(null); // Store reveal data until timer hits 0

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [participants, setParticipants] = useState([]);
  const [ws, setWs] = useState(null);

  // Debug logging for sessionId extraction
  useEffect(() => {
    console.log('=== SESSION ID DEBUG ===');
    console.log('useParams sessionId:', sessionId);
    console.log('Current URL:', window.location.href);
    console.log('Location pathname:', location.pathname);

    const pathParts = location.pathname.split('/');
    const sessionIdFromPath = pathParts[pathParts.length - 1];
    console.log('SessionId from path:', sessionIdFromPath);
    console.log('========================');
  }, [sessionId, location]);

  useEffect(() => {
    console.log('Component mounted with sessionId:', sessionId);

    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('Invalid sessionId detected:', sessionId);
      const pathParts = location.pathname.split('/');
      const extractedSessionId = pathParts[pathParts.length - 1];

      if (extractedSessionId && extractedSessionId !== 'undefined' && extractedSessionId !== 'null') {
        console.log('Found sessionId in URL path:', extractedSessionId);
        navigate(`/student/session/${extractedSessionId}`, { replace: true });
        return;
      }
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'student') {
      console.error('Invalid user or role, redirecting to auth');
      navigate('/auth');
      return;
    }

    console.log('Loading session:', sessionId, 'for user:', currentUser.id);
    fetchSession();
    joinSession();
    setupWebSocketConnection();

    return () => {
      if (ws) {
        console.log('Cleaning up WebSocket connection');
        ws.close();
      }
    };
  }, [sessionId, navigate, location]);

  // Timer effect using absolute time for synchronization
  useEffect(() => {
    let timer;
    if (activePoll && pollEndTime) {
      timer = setInterval(() => {
        // Calculate remaining time from absolute end time, accounting for clock offset
        const adjustedNow = Date.now() + clockOffset;
        const remaining = Math.max(0, Math.floor((pollEndTime - adjustedNow) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          // Time's up - show results if we have pending reveal
          if (pendingReveal) {
            setShowResults(true);
            setPendingReveal(null);
          }
          handleTimeUp();
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activePoll, pollEndTime, clockOffset, pendingReveal]);

  // Visibility change handler for background tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activePoll && pollEndTime) {
        // Recalculate remaining time when tab becomes visible
        const adjustedNow = Date.now() + clockOffset;
        const remaining = Math.max(0, Math.floor((pollEndTime - adjustedNow) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0 && pendingReveal) {
          setShowResults(true);
          setPendingReveal(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activePoll, pollEndTime, clockOffset, pendingReveal]);

  const fetchSession = async () => {
    try {
      console.log('Fetching session data for:', sessionId);
      const data = await apiRequest(`/sessions/${sessionId}`);
      console.log('Session data received:', data);
      setSession(data);
      setConnectionStatus('connected');
      fetchParticipants();
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active poll for refresh/reconnection scenarios
  const fetchActivePoll = async () => {
    try {
      console.log('Checking for active poll in session:', sessionId);
      const data = await apiRequest(`/sessions/${sessionId}/active-poll`);

      if (data && data.poll_end_time && data.server_time) {
        // Check if poll hasn't expired
        const localNow = Date.now();
        const offset = data.server_time - localNow;
        const adjustedNow = localNow + offset;
        const remaining = Math.floor((data.poll_end_time - adjustedNow) / 1000);

        if (remaining > 0) {
          console.log(`Found active poll with ${remaining}s remaining`);
          setActivePoll(data);
          setClockOffset(offset);
          setPollEndTime(data.poll_end_time);
          setTimeLeft(remaining);
          setHasResponded(false);
          setSelectedOption(null);
          setShowResults(false);
          setSubmissionResult(null);
          setPendingReveal(null);
        } else {
          console.log('Active poll found but already expired');
        }
      }
    } catch (error) {
      // 404 means no active poll, which is normal
      if (error.message && !error.message.includes('404')) {
        console.error('Error fetching active poll:', error);
      } else {
        console.log('No active poll in session');
      }
    }
  };

  const joinSession = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser || !currentUser.id) {
        console.error('No valid user found, redirecting to auth');
        navigate('/auth');
        return;
      }
      const studentId = currentUser.id;
      console.log('Joining session:', sessionId, 'as student:', studentId);
      await apiRequest(`/sessions/${sessionId}/join`, {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId }),
      });
      console.log('Successfully joined session');
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const data = await apiRequest(`/sessions/${sessionId}/participants`);
      console.log('Participants data:', data);
      setParticipants(Array.isArray(data) ? data : (data.participants || []));
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    }
  };

  const leaveSession = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        await apiRequest(`/sessions/${sessionId}/leave`, {
          method: 'POST',
          body: JSON.stringify({ student_id: currentUser.id }),
        });
        console.log('Successfully left session');
      }
    } catch (error) {
      console.error('Error leaving session:', error);
    } finally {
      if (ws) ws.close();
      navigate('/student/dashboard');
    }
  };

  const setupWebSocketConnection = () => {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null' || sessionId.trim() === '') {
      console.error('Cannot setup WebSocket: sessionId is invalid:', sessionId);
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) {
      console.error('Cannot setup WebSocket: no valid user found');
      return;
    }

    const websocket = new WebSocket(WS_BASE_URL);
    setWs(websocket);

    websocket.onopen = () => {
      console.log('WebSocket connected successfully');
      setConnectionStatus('connected');
      const joinMessage = {
        type: 'join-session',
        sessionId: sessionId.toString(),
        studentId: currentUser.id
      };
      websocket.send(JSON.stringify(joinMessage));
      updateConnectionStatus('online');

      // Also fetch active poll via API as a backup (for page refresh scenarios)
      // The WebSocket join-session will also send active poll, but this is a fallback
      setTimeout(() => {
        fetchActivePoll();
      }, 500); // Small delay to let WebSocket message arrive first
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      switch (data.type) {
        case 'poll-activated':
          {
            setActivePoll(data.poll);
            setHasResponded(false);
            setSelectedOption(null);
            setShowResults(false);
            setSubmissionResult(null);
            setPendingReveal(null);

            // Calculate clock offset and set absolute end time
            if (data.poll_end_time && data.server_time) {
              // Calculate difference between server time and our local time
              const localNow = Date.now();
              const offset = data.server_time - localNow;
              setClockOffset(offset);

              // Store the absolute end time
              setPollEndTime(data.poll_end_time);

              // Calculate initial remaining time
              const adjustedNow = localNow + offset;
              const remaining = Math.max(0, Math.floor((data.poll_end_time - adjustedNow) / 1000));
              setTimeLeft(remaining);

              console.log(`Poll activated: end time ${new Date(data.poll_end_time).toISOString()}, remaining: ${remaining}s, clock offset: ${offset}ms`);
            } else {
              // Fallback for backwards compatibility
              setTimeLeft(data.poll.time_limit || 60);
              setPollEndTime(Date.now() + (data.poll.time_limit || 60) * 1000);
              console.log('Poll activated (legacy mode): using time_limit directly');
            }
          }
          break;
        case 'poll-deactivated':
          setActivePoll(null);
          setPollEndTime(null);
          setPendingReveal(null);
          break;
        case 'reveal-answers':
          if (data.sessionId && sessionId && data.sessionId.toUpperCase() === sessionId.toUpperCase()) {
            console.log('Answer reveal received');

            // Check if timer has reached 0 or is very close
            const adjustedNow = Date.now() + clockOffset;
            const remaining = pollEndTime ? Math.floor((pollEndTime - adjustedNow) / 1000) : 0;

            if (remaining <= 1) {
              // Timer is at or near 0, show results immediately
              console.log('Timer at 0, showing results immediately');
              setShowResults(true);
              setPendingReveal(null);
            } else {
              // Timer still has time, store reveal for later
              console.log(`Timer has ${remaining}s remaining, storing pending reveal`);
              setPendingReveal(data);
            }
          }
          break;
        case 'participant-count-updated':
          fetchParticipants();
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      updateConnectionStatus('offline');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      updateConnectionStatus('offline');
    };

    const heartbeatInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'heartbeat',
          sessionId: sessionId.toString(),
          studentId: currentUser.id
        }));
        updateLastActivity();
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  };

  const updateConnectionStatus = async (status) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        await apiRequest(`/sessions/${sessionId}/update-connection`, {
          method: 'POST',
          body: JSON.stringify({
            student_id: currentUser.id,
            connection_status: status,
          }),
        });
      }
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  };

  const updateLastActivity = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        await apiRequest(`/sessions/${sessionId}/update-activity`, {
          method: 'POST',
          body: JSON.stringify({ student_id: currentUser.id }),
        });
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  const submitResponse = async () => {
    if (selectedOption === null) return;
    setPollLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser || !currentUser.id) {
        console.error('No valid user for answer submission');
        setPollLoading(false);
        return;
      }

      // Corrected: Use the dedicated and imported studentAPI function
      const result = await studentAPI.submitPollResponse(
        currentUser.id,
        activePoll.id,
        selectedOption,
        (activePoll.time_limit || activePoll.timeLimit) - timeLeft
      );

      setHasResponded(true);
      setSubmissionResult(result); // The result is { is_correct: boolean, ... }
      console.log('Answer submitted successfully:', result);
      updateLastActivity();
    } catch (error) {
      console.error('Error submitting answer:', error);
      setHasResponded(true);
      setSubmissionResult({ is_correct: false, error: 'Submission failed' });
    } finally {
      setPollLoading(false);
    }
  };

  const handleTimeUp = () => {
    console.log('Time up for poll');
    // If we have a pending reveal, show it now
    if (pendingReveal) {
      setShowResults(true);
      setPendingReveal(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptionColor = (index) => {
    // When results are revealed, show correctness
    if (showResults) {
      const isCorrect = parseInt(activePoll.correct_answer) === parseInt(index);
      const isSelected = selectedOption === index;

      if (isCorrect) {
        return 'bg-green-100 border-green-500 text-green-900';
      }
      if (isSelected && !isCorrect) {
        return 'bg-red-100 border-red-500 text-red-900';
      }
      return 'bg-gray-50 border-gray-300 text-gray-600';
    }

    // Before results are revealed
    return selectedOption === index
      ? 'bg-blue-100 border-blue-500 text-blue-900'
      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
  };

  if (loading) {
    return <LoadingSpinner text="Joining session..." />;
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">Session Not Found</h2>
          <p className="text-sm sm:text-base text-red-600 mb-4">The session you're trying to join doesn't exist or has ended.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{session.title}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{session.course_name}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Teacher: {session.teacher_name || 'Loading...'}</p>
          </div>
          <div className="flex items-center justify-start sm:justify-end gap-4 sm:gap-4">
            <div className="text-center flex-shrink-0">
              <div className={`text-base sm:text-lg font-bold ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus === 'connected' ? '🟢' : '🔴'}
              </div>
              <div className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-base sm:text-lg font-bold text-purple-600">
                {Array.isArray(participants) ? participants.filter(p => p.is_active).length : 0}
              </div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          {/* Poll Header with Timer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Live Poll</h2>
            {!hasResponded && timeLeft > 0 && (
              <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${timeLeft <= 10 ? 'bg-red-100' : 'bg-orange-100'}`}>
                <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className={`text-lg sm:text-xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">{activePoll.question}</h3>
            <div className="space-y-2 sm:space-y-3">
              {activePoll.options && activePoll.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !hasResponded && setSelectedOption(index)}
                  disabled={hasResponded || timeLeft <= 0}
                  className={`w-full text-left p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 min-h-[52px] ${getOptionColor(index)} ${hasResponded || timeLeft <= 0 ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-[0.98]'}`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                </button>
              ))}
            </div>
          </div>

          {/* === START: CORRECTED LOGIC BLOCK === */}
          {selectedOption !== null && !hasResponded && timeLeft > 0 && (
            <div className="mt-4">
              <button
                onClick={submitResponse}
                disabled={pollLoading}
                className="w-full sm:w-auto sm:mx-auto sm:flex sm:px-8 py-3 sm:py-3 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors duration-200 disabled:bg-blue-300"
              >
                {pollLoading ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          )}

          {/* Immediate feedback after submission */}
          {hasResponded && submissionResult && (
            <div className={`border rounded-lg p-3 sm:p-4 mt-4 ${submissionResult.is_correct
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center">
                <svg className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0 ${submissionResult.is_correct
                    ? 'text-green-600'
                    : 'text-red-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {submissionResult.is_correct ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                <span className={`font-medium text-sm sm:text-base ${submissionResult.is_correct
                    ? 'text-green-800'
                    : 'text-red-800'
                  }`}>
                  {submissionResult.is_correct
                    ? 'Correct! Well done!'
                    : 'Incorrect, but good try!'}
                </span>
              </div>

              {/* Revealed answer and explanation (shown only when teacher allows) */}
              {showResults && (
                <>
                  <div className={`mt-3 text-xs sm:text-sm ${submissionResult.is_correct
                      ? 'text-green-700'
                      : 'text-red-700'
                    }`}>
                    <strong>Correct Answer:</strong> {String.fromCharCode(65 + activePoll.correct_answer)}. {activePoll.options[activePoll.correct_answer]}
                  </div>
                  {activePoll.justification && (
                    <div className={`mt-3 text-xs sm:text-sm ${submissionResult.is_correct
                        ? 'text-green-700'
                        : 'text-red-700'
                      }`}>
                      <strong>Explanation:</strong> {activePoll.justification}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Message while waiting for submission to complete */}
          {hasResponded && !submissionResult && (
            <div className="text-center py-3 sm:py-4 text-blue-600">
              <p className="font-medium text-sm sm:text-base">Submitting answer...</p>
            </div>
          )}

          {/* Message after submission, while waiting for teacher to reveal results */}
          {hasResponded && submissionResult && !showResults && (
            <div className="text-center py-3 sm:py-4 text-gray-600">
              <p className="font-medium text-sm sm:text-base">Answer locked. Waiting for the teacher to reveal all results...</p>
            </div>
          )}

          {/* Message if time runs out */}
          {timeLeft === 0 && !hasResponded && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-center text-red-700 mt-4">
              <p className="font-medium text-sm sm:text-base">Time's up! You can no longer respond to this poll.</p>
              {showResults && (
                <>
                <div className="mt-3 text-xs sm:text-sm text-red-700">
                  <strong>Correct Answer:</strong>{" "}
                  {String.fromCharCode(65 + activePoll.correct_answer)}.{" "}
                  {activePoll.options[activePoll.correct_answer]}
                </div>
                {activePoll.justification && (
                  <div className="mt-3 text-xs sm:text-sm text-red-700">
                    <strong>Explanation:</strong> {activePoll.justification}
                  </div>
                )}
              </>
            )}
            </div>
          )}
          {/* === END: CORRECTED LOGIC BLOCK === */}

        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sm:p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Waiting for Poll</h3>
          <p className="text-sm sm:text-base text-gray-600">Your teacher will start a poll soon. Stay connected!</p>
        </div>
      )}

      {/* Session Controls */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Session Controls</h3>
            <p className="text-xs sm:text-sm text-gray-600">Manage your session participation</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base"
            >
              Dashboard
            </button>
            <button
              onClick={leaveSession}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base"
            >
              Leave Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentSession;
