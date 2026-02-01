import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils } from '../../utils/api';
import LoadingSpinner from './LoadingSpinner';

const SessionHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = utils.getCurrentUser();

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real implementation, this would come from API
      const mockSessions = currentUser?.role === 'teacher' 
        ? [
            {
              id: 1,
              session_id: 'ABC123',
              title: 'Introduction to React',
              course_name: 'Web Development',
              created_at: '2024-08-20T10:00:00Z',
              status: 'completed',
              participant_count: 25
            },
            {
              id: 2,
              session_id: 'DEF456',
              title: 'Advanced JavaScript Concepts',
              course_name: 'Programming Fundamentals',
              created_at: '2024-08-22T14:30:00Z',
              status: 'active',
              participant_count: 18
            },
            {
              id: 3,
              session_id: 'GHI789',
              title: 'Database Design Principles',
              course_name: 'Database Systems',
              created_at: '2024-08-19T09:15:00Z',
              status: 'completed',
              participant_count: 22
            }
          ]
        : [
            {
              id: 1,
              session_id: 'ABC123',
              title: 'Introduction to React',
              course_name: 'Web Development',
              teacher_name: 'Dr. Sarah Johnson',
              joined_at: '2024-08-20T10:05:00Z',
              status: 'completed',
              polls_answered: 8
            },
            {
              id: 2,
              session_id: 'DEF456',
              title: 'Advanced JavaScript Concepts',
              course_name: 'Programming Fundamentals',
              teacher_name: 'Prof. Michael Chen',
              joined_at: '2024-08-22T14:35:00Z',
              status: 'active',
              polls_answered: 3
            },
            {
              id: 4,
              session_id: 'JKL012',
              title: 'Machine Learning Basics',
              course_name: 'Artificial Intelligence',
              teacher_name: 'Dr. Priya Sharma',
              joined_at: '2024-08-21T11:20:00Z',
              status: 'completed',
              polls_answered: 12
            }
          ];

      setSessions(mockSessions);
    } catch (err) {
      setError('Failed to load session history');
      console.error('Error fetching session history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejoinSession = (sessionId) => {
    if (currentUser?.role === 'teacher') {
      navigate(`/teacher/session/${sessionId}`);
    } else {
      navigate(`/student/session/${sessionId}`);
    }
  };

  const handleViewResources = (sessionId) => {
    navigate(`/session/${sessionId}/resources`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (status === 'completed') {
      return `${baseClasses} bg-gray-100 text-gray-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner text="Loading session history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchSessionHistory}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentUser?.role === 'teacher' ? 'My Sessions' : 'Joined Sessions'}
        </h1>
        <p className="text-gray-600">
          {currentUser?.role === 'teacher' 
            ? 'View and manage your previously created sessions'
            : 'Access your previously joined sessions and resources'
          }
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {currentUser?.role === 'teacher' 
              ? 'No sessions created yet'
              : 'No sessions joined yet'
            }
          </div>
          <button 
            onClick={() => navigate(currentUser?.role === 'teacher' ? '/teacher/create-session' : '/student/join')}
            className="btn-primary"
          >
            {currentUser?.role === 'teacher' ? 'Create First Session' : 'Join a Session'}
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{session.title}</h3>
                    <span className={getStatusBadge(session.status)}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">{session.course_name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Session ID: {session.session_id}</span>
                    {currentUser?.role === 'teacher' ? (
                      <>
                        <span>Created: {formatDate(session.created_at)}</span>
                        <span>{session.participant_count} participants</span>
                      </>
                    ) : (
                      <>
                        <span>Teacher: {session.teacher_name}</span>
                        <span>Joined: {formatDate(session.joined_at)}</span>
                        <span>{session.polls_answered} polls answered</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRejoinSession(session.session_id)}
                  className="btn-primary"
                >
                  {currentUser?.role === 'teacher' ? 'Manage Session' : 'Rejoin Session'}
                </button>
                
                <button
                  onClick={() => handleViewResources(session.session_id)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resources
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate(currentUser?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SessionHistory;

