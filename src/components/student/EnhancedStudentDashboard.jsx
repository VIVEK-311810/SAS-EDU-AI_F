import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
import { studentAPI } from '../../utils/api';
const API_BASE_URL = process.env.REACT_APP_API_URL ;
const EnhancedStudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joinedSessions, setJoinedSessions] = useState([]);
  const [stats, setStats] = useState({
    sessionsJoined: 0,
    pollsAnswered: 0,
    averageScore: 0,
    activeSessions: 0
  });
  const [gamificationStats, setGamificationStats] = useState({
    totalPoints: 0,
    rank: 1,
    totalStudents: 1,
    currentStreak: 0,
    badges: []
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
    fetchStudentData();

    // Set up auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchStudentData();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [navigate]);

  const fetchStudentData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser || !currentUser.id) {
        console.error('No current user found');
        setLoading(false);
        return;
      }

      const studentId = currentUser.id;

      // Use the centralized API function
      const data = await studentAPI.getDashboardSummary(studentId);

      // Transform the data to match the component's expected format
      setJoinedSessions(data.sessions.map(session => ({
        id: session.session_id,
        session_id: session.join_code,
        title: session.title,
        course_name: session.course_name,
        teacher_name: session.teacher_name,
        is_active: session.is_active,
        joined_at: session.joined_at,
        last_poll: null // Will be populated if needed
      })));

      setStats({
        sessionsJoined: data.stats.sessions_joined,
        pollsAnswered: data.stats.polls_answered,
        averageScore: data.stats.average_score,
        activeSessions: data.stats.active_sessions
      });

      // Fetch gamification stats
      try {
        const token = localStorage.getItem('authToken');
        const gamificationRes = await fetch(`${API_BASE_URL}/gamification/student/${studentId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const gamificationData = await gamificationRes.json();
        if (gamificationData.success) {
          setGamificationStats(gamificationData.data);
        }
      } catch (gamErr) {
        console.log('Gamification stats not available yet');
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      // Set empty data on error
      setJoinedSessions([]);
      setStats({
        sessionsJoined: 0,
        pollsAnswered: 0,
        averageScore: 0,
        activeSessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  async function rejoinSession(sessionId, studentId) {
    
      // navigate(`/student/session/${sessionId}`)
    try {
      console.log(studentId, sessionId)
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/rejoin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId })
      });

      const data = await response.json();
      if (data.success) {
        console.log("Rejoined successfully:", data.participant);
      } else {
        console.error("Failed to rejoin:", data.error);
      }
    } catch (err) {
      console.error("Error calling rejoin API:", err);
    }
  }


  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 pb-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Welcome, {currentUser.fullName}!</h1>
            <p className="text-green-100 mt-1 sm:mt-2 text-sm sm:text-base">Ready to learn and participate</p>
            <p className="text-green-200 text-xs sm:text-sm mt-1">ID: {currentUser.id}</p>
          </div>
          <button
            onClick={() => navigate('/student/join')}
            className="bg-white text-green-600 hover:bg-green-50 font-medium py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-lg text-center w-full sm:w-auto"
          >
            + Join Session
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 w-fit mb-2 sm:mb-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.sessionsJoined}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-green-100 w-fit mb-2 sm:mb-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Polls</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pollsAnswered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-purple-100 w-fit mb-2 sm:mb-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 rounded-full bg-orange-100 w-fit mb-2 sm:mb-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="grid grid-cols-3 gap-4 sm:flex sm:items-center sm:gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold">{gamificationStats.totalPoints}</p>
              <p className="text-xs sm:text-sm opacity-90">Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold">#{gamificationStats.rank}</p>
              <p className="text-xs sm:text-sm opacity-90">Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold">{gamificationStats.currentStreak}</p>
              <p className="text-xs sm:text-sm opacity-90">Streak</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/leaderboard')}
            className="bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            View Leaderboard
          </button>
        </div>
      </div>

      {/* Your Sessions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Sessions</h2>
              <p className="text-gray-600 mt-1 text-sm">Sessions you've joined</p>
            </div>

            {joinedSessions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No sessions yet</h3>
                <p className="text-gray-500 mb-6 text-sm">Join your first session to start</p>
                <button
                  onClick={() => navigate('/student/join')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                >
                  Join a Session
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {joinedSessions.map((session) => (
                  <div key={session.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{session.title}</h3>
                          {session.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                              Live
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                              Ended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{session.course_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <span className="font-medium">{session.session_id}</span>
                          <span className="mx-2">|</span>
                          <span>{session.teacher_name}</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                        {/* Join Live Button - Only for active sessions */}
                        {session.is_active && (
                          <button
                            onClick={async () => {
                            await rejoinSession(session.session_id, currentUser.id);
                            navigate(`/student/session/${session.session_id}`);
                          }}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                          >
                            Join Live
                          </button>
                        )}

                        {/* View Session Button */}
                        <button
                          onClick={() => navigate(`/student/session/${session.session_id}/history`)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          View
                        </button>

                        {/* Resources Button */}
                        <button
                          onClick={() => navigate(`/session/${session.session_id}/resources`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          Files
                        </button>

                        {/* AI Assistant Button */}
                        <button
                          onClick={() => navigate(`/student/ai-assistant/${session.session_id}`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
};

export default EnhancedStudentDashboard;