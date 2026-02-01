import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourceAPI, utils } from '../../utils/api';

const ResourceViewer = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const currentUser = utils.getCurrentUser();

  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
    fetchResources();
  }, [sessionId]);

  useEffect(() => {
    // Apply filters
    let filtered = resources;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.resource_type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  }, [searchTerm, filterType, resources]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourceAPI.getSessionResources(sessionId);
      setResources(data.resources || []);
      setFilteredResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (resource) => {
    try {
      // Track view
      await resourceAPI.trackAccess(resource.id, currentUser.id, 'view');

      // Open resource in new tab
      window.open(resource.file_url, '_blank');

      // Update local count
      setResources(prevResources =>
        prevResources.map(r =>
          r.id === resource.id ? { ...r, view_count: r.view_count + 1 } : r
        )
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleDownload = async (resource) => {
    if (!resource.is_downloadable) {
      alert('This resource is not available for download');
      return;
    }

    try {
      // Track download
      await resourceAPI.trackAccess(resource.id, currentUser.id, 'download');

      // Trigger download
      const link = document.createElement('a');
      link.href = resource.file_url;
      link.download = resource.file_name || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update local count
      setResources(prevResources =>
        prevResources.map(r =>
          r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
        )
      );
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const getResourceIcon = (type) => {
    const icons = {
      'pdf': '📄',
      'document': '📝',
      'presentation': '📊',
      'spreadsheet': '📈',
      'image': '🖼️',
      'archive': '📦',
      'url': '🔗',
      'other': '📎'
    };
    return icons[type] || '📎';
  };

  const getResourceTypeColor = (type) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800',
      'document': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-purple-100 text-purple-800',
      'spreadsheet': 'bg-green-100 text-green-800',
      'image': 'bg-yellow-100 text-yellow-800',
      'archive': 'bg-gray-100 text-gray-800',
      'url': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Resources</h1>
            <p className="text-gray-600 mt-1">Session ID: {sessionId}</p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resources..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="document">Documents</option>
              <option value="presentation">Presentations</option>
              <option value="spreadsheet">Spreadsheets</option>
              <option value="image">Images</option>
              <option value="url">URLs</option>
              <option value="archive">Archives</option>
              <option value="other">Other</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </div>
      </div>

      {/* Resources Display */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {resources.length === 0 ? 'No resources available' : 'No matching resources'}
          </h3>
          <p className="text-gray-500">
            {resources.length === 0
              ? 'Your teacher hasn\'t uploaded any resources yet'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${viewMode === 'list' ? 'flex items-center' : ''}`}
            >
              {viewMode === 'grid' ? (
                // Grid View
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{getResourceIcon(resource.resource_type)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getResourceTypeColor(resource.resource_type)}`}>
                      {resource.resource_type}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>

                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    {resource.file_size && (
                      <div>📦 {utils.formatFileSize(resource.file_size)}</div>
                    )}
                    <div>📅 {new Date(resource.created_at).toLocaleDateString()}</div>
                    <div>👁️ {resource.view_count} views • ⬇️ {resource.download_count} downloads</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(resource)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                    >
                      View
                    </button>
                    {resource.is_downloadable && resource.resource_type !== 'url' && (
                      <button
                        onClick={() => handleDownload(resource)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // List View
                <div className="flex items-center justify-between p-6 w-full">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{getResourceIcon(resource.resource_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getResourceTypeColor(resource.resource_type)}`}>
                          {resource.resource_type}
                        </span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {resource.file_size && <span>📦 {utils.formatFileSize(resource.file_size)}</span>}
                        <span>📅 {new Date(resource.created_at).toLocaleDateString()}</span>
                        <span>👁️ {resource.view_count} • ⬇️ {resource.download_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(resource)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                    >
                      View
                    </button>
                    {resource.is_downloadable && resource.resource_type !== 'url' && (
                      <button
                        onClick={() => handleDownload(resource)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceViewer;
