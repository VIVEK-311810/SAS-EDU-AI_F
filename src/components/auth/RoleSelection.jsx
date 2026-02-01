import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    
    // Initiate OAuth2 login with role-specific endpoint
    const API_BASE_URL = process.env.REACT_APP_AUTH_URL;// || 'https://vk-edu-b2.onrender.com';
    
    console.log(`${role} role selected, redirecting to OAuth...`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    
    if (role === 'teacher') {
      const teacherUrl = `${API_BASE_URL}/auth/google/edu`;
      console.log(`Redirecting to teacher OAuth: ${teacherUrl}`);
      window.location.href = teacherUrl;
    } else if (role === 'student') {
      const studentUrl = `${API_BASE_URL}/auth/google/acin`;
      console.log(`Redirecting to student OAuth: ${studentUrl}`);
      window.location.href = studentUrl;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">SASTRA Educational Platform</h1>
        <p className="text-xl text-gray-600 mb-2">Interactive Learning & Real-time Polling</p>
        <p className="text-gray-500">Sign in with your SASTRA Google account to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher Option */}
        <div 
          onClick={() => handleRoleSelect('teacher')}
          className="cursor-pointer group"
        >
          <div className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group-hover:shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Teacher</h3>
              <p className="text-gray-600 mb-4">Use your @*.sastra.edu email address (e.g., name@ict.sastra.edu)</p>
              
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create and manage sessions
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create polls and quizzes
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View real-time analytics
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Manage student participation
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>Faculty Access:</strong> Requires @*.sastra.edu email address (e.g., @ict.sastra.edu)
                </p>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                Sign in as Teacher
              </button>
            </div>
          </div>
        </div>

        {/* Student Option */}
        <div 
          onClick={() => handleRoleSelect('student')}
          className="cursor-pointer group"
        >
          <div className="border-2 border-gray-300 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group-hover:shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Student</h3>
              <p className="text-gray-600 mb-4">Use your @sastra.ac.in email address (format: number@sastra.ac.in)</p>
              
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Join interactive sessions
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Participate in polls and quizzes
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access AI learning assistant
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View session history and resources
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800">
                  <strong>Student Access:</strong> Requires @sastra.ac.in email address
                </p>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                Sign in as Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Secure Domain-Specific Authentication</h4>
            <p className="text-sm text-gray-600">
              Your login is secured by Google OAuth2 with domain-specific authentication. 
              Teachers and students use separate OAuth configurations for enhanced security. 
              Teachers can use any @*.sastra.edu subdomain (e.g., @ict.sastra.edu, @cse.sastra.edu).
              We don't store your Google password - authentication is handled entirely by Google's secure servers.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Having trouble signing in? Make sure you're using the correct SASTRA email address for your role.</p>
        <p className="mt-1">For technical support, contact your system administrator.</p>
      </div>
    </div>
  );
};

export default RoleSelection;