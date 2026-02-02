import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Components
import RoleSelection from './components/auth/RoleSelection';
import OAuth2Callback from './components/auth/OAuth2Callback';

// Teacher Components
import EnhancedTeacherDashboard from './components/teacher/EnhancedTeacherDashboard';
import CreateSession from './components/teacher/CreateSession';
import EnhancedSessionManagement from './components/teacher/EnhancedSessionManagement';
import ResourceUpload from './components/teacher/ResourceUpload';
import TeacherAnalytics from './components/teacher/TeacherAnalytics';

// Student Components
import EnhancedStudentDashboard from './components/student/EnhancedStudentDashboard';
import EnhancedStudentSession from './components/student/EnhancedStudentSession';
import JoinSession from './components/student/JoinSession';
import SessionResources from './components/student/SessionResources';
import AIAssistant from './components/student/AIAssistant';
import VisitSession from './components/student/VisitSession';
import AIResourceSearch from './components/student/AIResourceSearch';
import Leaderboard from './components/student/Leaderboard';

// Shared Components
import Header from './components/shared/Header';
import SessionHistory from './components/shared/SessionHistory';
import SessionResourcesShared from './components/shared/SessionResources';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            
            {/* Authentication routes */}
            <Route path="/auth" element={<RoleSelection />} />
            <Route path="/auth/callback" element={<OAuth2Callback />} />
            
            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={<EnhancedTeacherDashboard />} />
            <Route path="/teacher/create-session" element={<CreateSession />} />
            <Route path="/teacher/session/:sessionId" element={<EnhancedSessionManagement />} />
            <Route path="/teacher/session/:sessionId/upload" element={<ResourceUpload />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={<EnhancedStudentDashboard />} />
            <Route path="/student/join" element={<JoinSession />} />
            <Route path="/student/session/:sessionId" element={<EnhancedStudentSession />} />
            <Route path="/student/session/:sessionId/resources" element={<SessionResources />} />
            <Route path="/student/session/:sessionId/search" element={<AIResourceSearch />} />
            <Route path="/student/ai-assistant/:sessionId" element={<AIAssistant />} />
            <Route path="/student/session/:sessionId/history" element={<VisitSession />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/leaderboard/:sessionId" element={<Leaderboard />} />
            
            {/* Shared routes */}
            <Route path="/session-history" element={<SessionHistory />} />
            <Route path="/session/:sessionId/resources" element={<SessionResourcesShared />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

