import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);

    // Initiate OAuth2 login with role-specific endpoint
    const API_BASE_URL = process.env.REACT_APP_AUTH_URL;

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
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-8 mx-3 sm:mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">SASTRA Educational Platform</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-1 sm:mb-2">Interactive Learning & Real-time Polling</p>
        <p className="text-sm sm:text-base text-gray-500">Sign in with your SASTRA Google account to continue</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Teacher Option */}
        <div
          onClick={() => handleRoleSelect('teacher')}
          className="cursor-pointer group"
        >
          <div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 group-hover:shadow-lg">
            <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center sm:mx-auto sm:mb-4 group-hover:bg-blue-200 flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 sm:flex-none">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Teacher</h3>
                <p className="text-sm text-gray-600 mb-2 sm:mb-4">@*.sastra.edu email</p>

                <div className="hidden sm:block text-left space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create and manage sessions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create polls and quizzes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    View real-time analytics
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                  Sign in as Teacher
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Student Option */}
        <div
          onClick={() => handleRoleSelect('student')}
          className="cursor-pointer group"
        >
          <div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-all duration-200 group-hover:shadow-lg">
            <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center sm:mx-auto sm:mb-4 group-hover:bg-green-200 flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="flex-1 sm:flex-none">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Student</h3>
                <p className="text-sm text-gray-600 mb-2 sm:mb-4">@sastra.ac.in email</p>

                <div className="hidden sm:block text-left space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Join interactive sessions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Participate in polls and quizzes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access AI learning assistant
                  </div>
                </div>

                <button className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-2.5 sm:py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                  Sign in as Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Secure Authentication</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Your login is secured by Google OAuth2. We don't store your password.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
        <p>Having trouble? Use the correct SASTRA email for your role.</p>
      </div>
    </div>
  );
};

export default RoleSelection;
