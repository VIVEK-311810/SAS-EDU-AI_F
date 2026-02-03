import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setMobileMenuOpen(false);
    navigate('/auth');
  };

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <img
              src="https://sastra.edu/photo_gallery/images/saslogo.jpg"
              alt="Sastra Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <h1 className="text-lg sm:text-2xl font-bold text-primary-600">EduPlatform</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 sm:gap-4">
            {!isAuthPage && currentUser && (
              <>
                {currentUser.role === 'teacher' && (
                  <>
                    <button
                      onClick={() => navigate('/teacher/dashboard')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/teacher/create-session')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Create Session
                    </button>
                    <button
                      onClick={() => navigate('/teacher/analytics')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Analytics
                    </button>
                  </>
                )}

                {currentUser.role === 'student' && (
                  <>
                    <button
                      onClick={() => navigate('/student/dashboard')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/student/join')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Join Session
                    </button>
                    <button
                      onClick={() => navigate('/student/leaderboard')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Leaderboard
                    </button>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {!isAuthPage && currentUser && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && !isAuthPage && currentUser && (
          <nav className="md:hidden mt-4 pb-2 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-2">
              {currentUser.role === 'teacher' && (
                <>
                  <button
                    onClick={() => handleNavigation('/teacher/dashboard')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation('/teacher/create-session')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Create Session
                  </button>
                  <button
                    onClick={() => handleNavigation('/teacher/analytics')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => handleNavigation('/session-history')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Session History
                  </button>
                </>
              )}

              {currentUser.role === 'student' && (
                <>
                  <button
                    onClick={() => handleNavigation('/student/dashboard')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation('/student/join')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Join Session
                  </button>
                  <button
                    onClick={() => handleNavigation('/student/leaderboard')}
                    className="text-left text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-base font-medium"
                  >
                    Leaderboard
                  </button>
                </>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-4 py-2 text-sm text-gray-500">
                  Signed in as {currentUser.fullName || currentUser.full_name}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-base font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
