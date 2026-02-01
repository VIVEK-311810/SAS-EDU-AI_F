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
    
    const studentId = currentUser.id; // Use only real authenticated user ID

    setLoading(true);
    setError(''); // Clear previous errors
    try {
      // Directly attempt to join the session. The backend will handle existence and activity.
      const joinData = await apiRequest(`/sessions/${sessionId.toUpperCase()}/join`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
        }),
      });
      
      if (joinData && joinData.session) {
        // Backend returns the session object directly in joinData.session
        const sessionData = joinData.session; 

        // Store session info for quick access
        const sessionInfo = {
          sessionId: sessionData.session_id,
          title: sessionData.title,
          course_name: sessionData.course_name,
          joinedAt: new Date().toISOString(),
        };
        
        const existingSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');
        const updatedSessions = existingSessions.filter(s => s.sessionId !== sessionData.session_id);
        updatedSessions.unshift(sessionInfo);
        localStorage.setItem('joinedSessions', JSON.stringify(updatedSessions.slice(0, 10))); // Keep last 10

        alert(`Successfully joined "${sessionData.title}"!`);
        navigate(`/student/session/${sessionData.session_id}`);
      } else {
        console.error('No session data received');
        setError('Failed to join session: Invalid response from server');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session. Please try again.');
      
      // Handle network/API errors properly - no demo session creation
      alert(`Network error: Unable to join session. Please check your connection and try again.`);
      setError(`Network error: Unable to join session. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const recentSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Join a Session</h1>
        <p className="text-gray-600 mt-2">Enter the Session ID provided by your teacher</p>
      </div>

      <div className="card">
        <form onSubmit={handleJoinSession} className="space-y-6">
          <div>
            <label className="label">Session ID *</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              className="input-field text-center text-lg font-mono tracking-wider"
              placeholder="e.g., ABC123"
              maxLength="6"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Session IDs are 6 characters long (letters and numbers)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !sessionId.trim()}
            className="btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>

    </div>
  );
};

export default JoinSession;
