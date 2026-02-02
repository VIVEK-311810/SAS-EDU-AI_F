import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { utils } from '../../utils/api';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const currentUser = utils.getCurrentUser();

  const [leaderboard, setLeaderboard] = useState([]);
  const [viewType, setViewType] = useState(sessionId ? 'session' : 'allTime');
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [viewType, sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const API_URL = process.env.REACT_APP_API_URL;

      // Fetch leaderboard
      const endpoint = viewType === 'session' && sessionId
        ? `${API_URL}/gamification/leaderboard/session/${sessionId}`
        : `${API_URL}/gamification/leaderboard/all-time`;

      const [leaderboardRes, statsRes] = await Promise.all([
        fetch(endpoint, { headers }),
        fetch(`${API_URL}/gamification/student/${currentUser.id}/stats`, { headers })
      ]);

      const leaderboardData = await leaderboardRes.json();
      const statsData = await statsRes.json();

      if (leaderboardData.success) setLeaderboard(leaderboardData.data);
      if (statsData.success) setMyStats(statsData.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (type) => {
    const icons = {
      first_responder: '1',
      perfect_score: '100',
      streak_3: 'fire',
      streak_5: 'fire2',
      streak_10: 'lightning',
      participation_star: 'star',
      accuracy_master: 'target'
    };
    return icons[type] || 'medal';
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-700 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-white text-gray-600 border-gray-200';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mb-4 flex items-center text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">Trophy</span>
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-white/80 mt-1">See how you rank against other students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* My Stats Card */}
        {myStats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{myStats.totalPoints}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">#{myStats.rank}</p>
                <p className="text-sm text-gray-600">Your Rank</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{myStats.currentStreak}</p>
                <p className="text-sm text-gray-600">Current Streak</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{myStats.maxStreak}</p>
                <p className="text-sm text-gray-600">Best Streak</p>
              </div>
            </div>

            {/* Badges */}
            {myStats.badges && myStats.badges.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {myStats.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-full"
                      title={badge.description}
                    >
                      <span className="text-lg">{getBadgeIcon(badge.type)}</span>
                      <span className="text-sm font-medium text-yellow-800">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewType('allTime')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewType === 'allTime'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </button>
            {sessionId && (
              <button
                onClick={() => setViewType('session')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewType === 'session'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                This Session
              </button>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {leaderboard.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => (
                <div
                  key={entry.studentId}
                  className={`flex items-center p-4 ${
                    entry.studentId === currentUser.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${getRankStyle(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Name */}
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900">
                      {entry.studentName}
                      {entry.studentId === currentUser.id && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {viewType === 'allTime'
                        ? `${entry.sessionsParticipated || 0} sessions | ${entry.avgAccuracy || 0}% accuracy`
                        : `${entry.correctAnswers}/${entry.totalAnswers} correct | ${entry.avgResponseTime}s avg`
                      }
                    </p>
                  </div>

                  {/* Streak */}
                  {(entry.currentStreak > 0 || entry.maxStreak > 0) && (
                    <div className="hidden md:flex items-center gap-1 text-orange-500 mr-4">
                      <span>Fire</span>
                      <span className="font-semibold">{entry.currentStreak || entry.maxStreak}</span>
                    </div>
                  )}

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      {viewType === 'allTime' ? entry.totalPoints : entry.points}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <span className="text-4xl mb-4 block">Trophy</span>
              <p>No rankings yet. Start answering polls to earn points!</p>
            </div>
          )}
        </div>

        {/* Points Guide */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">+10</div>
              <div>
                <p className="font-medium text-gray-900">Correct Answer</p>
                <p className="text-sm text-gray-500">Answer a poll correctly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">+5</div>
              <div>
                <p className="font-medium text-gray-900">Fast Response</p>
                <p className="text-sm text-gray-500">Answer within 10 seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">+10</div>
              <div>
                <p className="font-medium text-gray-900">First Responder</p>
                <p className="text-sm text-gray-500">First correct answer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">+15-50</div>
              <div>
                <p className="font-medium text-gray-900">Streak Bonus</p>
                <p className="text-sm text-gray-500">3/5/10 correct in a row</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
