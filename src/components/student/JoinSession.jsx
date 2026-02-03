import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const JoinSession = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
  }, [navigate]);

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!sessionId.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser || !currentUser.id) {
      alert('Please log in first to join a session.');
      navigate('/auth');
      return;
    }

    const studentId = currentUser.id;

    setLoading(true);
    setError('');
    try {
      const joinData = await apiRequest(`/sessions/${sessionId.toUpperCase()}/join`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
        }),
      });

      if (joinData && joinData.session) {
        const sessionData = joinData.session;

        const sessionInfo = {
          sessionId: sessionData.session_id,
          title: sessionData.title,
          course_name: sessionData.course_name,
          joinedAt: new Date().toISOString(),
        };

        const existingSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');
        const updatedSessions = existingSessions.filter(s => s.sessionId !== sessionData.session_id);
        updatedSessions.unshift(sessionInfo);
        localStorage.setItem('joinedSessions', JSON.stringify(updatedSessions.slice(0, 10)));

        alert(`Successfully joined "${sessionData.title}"!`);
        navigate(`/student/session/${sessionData.session_id}`);
      } else {
        console.error('No session data received');
        setError('Failed to join session: Invalid response from server');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session. Please try again.');
      alert(`Network error: Unable to join session. Please check your connection and try again.`);
      setError(`Network error: Unable to join session. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Join a Session</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Enter the Session ID provided by your teacher</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleJoinSession} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session ID *</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg text-center text-xl sm:text-2xl font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ABC123"
              maxLength="6"
              required
              autoComplete="off"
              autoCapitalize="characters"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
              Session IDs are 6 characters (letters and numbers)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !sessionId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 sm:py-4 rounded-lg text-base sm:text-lg disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm sm:text-base py-2"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;
