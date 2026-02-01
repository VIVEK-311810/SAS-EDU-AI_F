import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResourceUpload = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [sessionId]);

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/resources/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Please select a file and enter a title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('is_downloadable', isDownloadable);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          alert('File uploaded successfully! Vectorization in progress.');

          // Reset form
          setFile(null);
          setTitle('');
          setDescription('');
          setUploadProgress(0);

          // Refresh resources list
          fetchResources();
        } else {
          const error = JSON.parse(xhr.responseText);
          alert('Upload failed: ' + (error.error || xhr.statusText));
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        alert('Upload failed. Please check your connection.');
        setIsUploading(false);
      });

      const token = localStorage.getItem('authToken');
      xhr.open('POST', `${process.env.REACT_APP_API_URL}/resources/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      setIsUploading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Resource deleted successfully');
        fetchResources();
      } else {
        const error = await response.json();
        alert('Delete failed: ' + error.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const getResourceTypeIcon = (type) => {
    const icons = {
      'pdf': '📄',
      'document': '📝',
      'presentation': '📊',
      'spreadsheet': '📈',
      'other': '📎'
    };
    return icons[type] || '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mt-2">Upload Resources</h1>
        <p className="text-gray-600 mt-1">Session: {sessionId}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Upload New Resource</h2>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <p className="text-lg font-semibold">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                <button
                  onClick={() => setFile(null)}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop your file here, or
                </p>
                <label className="mt-2 cursor-pointer text-blue-600 hover:text-blue-700">
                  browse files
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Supported: PDF, Word, PowerPoint (max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Week 1 Lecture Notes"
            />
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Optional description..."
            />
          </div>

          {/* Download Permission */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDownloadable}
                onChange={(e) => setIsDownloadable(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow students to download this file</span>
            </label>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !title}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Resource'}
          </button>
        </div>

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Uploaded Resources ({resources.length})</h2>

          {loadingResources ? (
            <div className="text-center py-8 text-gray-500">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No resources uploaded yet</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {resources.map((resource) => (
                <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getResourceTypeIcon(resource.resource_type)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(resource.file_size)}</span>
                          <span>Views: {resource.view_count}</span>
                          <span>Downloads: {resource.download_count}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            resource.vectorization_status === 'completed' ? 'bg-green-100 text-green-800' :
                            resource.vectorization_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            resource.vectorization_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {resource.vectorization_status === 'completed' ? '✓ AI Ready' :
                             resource.vectorization_status === 'processing' ? '⏳ Processing...' :
                             resource.vectorization_status === 'failed' ? '✗ Failed' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-600 hover:text-red-700 ml-2"
                      title="Delete resource"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceUpload;
