import React from 'react';
import { utils } from '../../utils/api';
import ResourceUploadManager from '../teacher/ResourceUploadManager';
import ResourceViewer from '../student/ResourceViewer';

const SessionResources = () => {
  const currentUser = utils.getCurrentUser();

  // Route to appropriate component based on user role
  if (currentUser?.role === 'teacher') {
    return <ResourceUploadManager />;
  } else if (currentUser?.role === 'student') {
    return <ResourceViewer />;
  }

  // Fallback if no user or invalid role
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Access Denied</h2>
        <p className="text-gray-600">Please log in to view session resources.</p>
      </div>
    </div>
  );
};

export default SessionResources;

