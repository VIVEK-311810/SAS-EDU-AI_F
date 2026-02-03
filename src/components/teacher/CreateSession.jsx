import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const CreateSession = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_name: '',
  });
  const [loading, setLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          teacher_id: currentUser?.id || 1,
        }),
      });

      console.log('Session creation response:', data);

      const sessionId = data.session_id;

      if (sessionId) {
        alert(`Session created successfully! Session ID: ${sessionId}`);
        console.log(`Navigating to: /teacher/session/${sessionId}`);
        navigate(`/teacher/session/${sessionId}`);
      } else {
        console.error('No session_id in response:', data);
        alert('Session created but navigation failed. Please check the dashboard.');
        navigate('/teacher/dashboard');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Create New Session</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Set up a new class session for your students</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="e.g., Introduction to React"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
            <input
              type="text"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="e.g., Web Development"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              rows="3"
              placeholder="Brief description of what will be covered..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">Session Features</h3>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
              <li>• Students join using unique Session ID</li>
              <li>• Create real-time polls/MCQs</li>
              <li>• Track student participation</li>
              <li>• Share resources with students</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/teacher/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;
