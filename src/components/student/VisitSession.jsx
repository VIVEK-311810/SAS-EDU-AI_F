// src/components/student/VisitSession.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionAPI,apiRequest } from "../../utils/api";

export default function VisitSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch session details
  const fetchSession = async () => {
    try {
      const sessionRes = await sessionAPI.getSession(sessionId);
      setSession(sessionRes.data);
    } catch (err) {
      setError("Unable to load session details.");
    }
  };

  // fetch polls for this session
  const fetchPolls = async () => {
    try {
      const data = await apiRequest(`/sessions/${sessionId}/polls`);
      const polls = data.polls || data;

      const normalized = Array.isArray(polls)
        ? polls.map((p) => ({
            ...p,
            correctAnswer:
              p.correctAnswer !== undefined ? p.correctAnswer : p.correct_answer,
            createdAt: p.createdAt || p.created_at,
            isActive: p.isActive !== undefined ? p.isActive : p.is_active,
            options: Array.isArray(p.options)
              ? p.options
              : typeof p.options === "string"
              ? JSON.parse(p.options)
              : [],
          }))
        : [];

      setPolls(normalized);
    } catch (error) {
      console.error("Error fetching polls:", error);
      setPolls([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSession();
      await fetchPolls();
      setLoading(false);
    };
    loadData();
  }, [sessionId]);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Session Header */}
      {session && (
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-gray-600">{session.description}</p>
          <p className="mt-2 text-sm text-gray-500">
            Course: {session.course_name}
          </p>
          <p className="text-sm text-gray-500">
            Session ID: {session.session_id}
          </p>
        </div>
      )}

      {/* Polls Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Session Polls</h3>
        {polls.length === 0 ? (
            <p className="text-gray-500">No polls available yet.</p>
        ) : (
            <div className="space-y-4">
            {polls.map((poll) => (
                <div
                key={poll.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
                >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                    {/* Question */}
                    <h4 className="font-medium text-gray-900 mb-2">
                        {poll.question}
                    </h4>

                    {/* Options */}
                    <div className="space-y-1">
                        {poll.options.map((option, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-2"
                        >
                            <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                                index === poll.correctAnswer
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                            >
                            {String.fromCharCode(65 + index)}
                            </span>
                            <span
                            className={
                                index === poll.correctAnswer
                                ? "font-medium text-green-800"
                                : "text-gray-700"
                            }
                            >
                            {option}
                            </span>
                        </div>
                        ))}
                    </div>

                    {/* Justification (if any) */}
                    {poll.justification && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                        Justification: {poll.justification}
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 text-sm text-gray-500">
                        Responses: {poll.responses || 0} • Created:{" "}
                        {formatTimeAgo(poll.createdAt)}
                    </div>
                    </div>

                    {/* Student Action */}
                    <div className="flex items-center">
                    <button
                        onClick={() =>
                        navigate(`/student/session/${sessionId}/history`)
                        }
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        View / Answer
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
}
