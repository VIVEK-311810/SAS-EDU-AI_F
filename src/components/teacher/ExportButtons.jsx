import React, { useState } from 'react';

const ExportButtons = ({ sessionId, pollId, studentId, type = 'session' }) => {
  const [exporting, setExporting] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('authToken');

  const handleExport = async (format, exportType) => {
    setExporting(true);
    try {
      let endpoint = '';
      let filename = '';

      switch (exportType) {
        case 'poll-results':
          endpoint = `/export/poll/${pollId}/csv`;
          filename = `poll_${pollId}_results.csv`;
          break;
        case 'session-report':
          endpoint = `/export/session/${sessionId}/report/pdf`;
          filename = `session_${sessionId}_report.pdf`;
          break;
        case 'session-responses':
          endpoint = `/export/session/${sessionId}/all-responses/csv`;
          filename = `session_${sessionId}_responses.csv`;
          break;
        case 'student-performance':
          endpoint = `/export/student/${studentId}/performance/csv`;
          filename = `student_${studentId}_performance.csv`;
          break;
        default:
          throw new Error('Unknown export type');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (type === 'poll') {
    return (
      <button
        onClick={() => handleExport('csv', 'poll-results')}
        disabled={exporting}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:bg-gray-400"
        title="Export poll results to CSV"
      >
        {exporting ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        CSV
      </button>
    );
  }

  if (type === 'session') {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => handleExport('csv', 'session-responses')}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 text-sm sm:text-base"
          title="Export all responses to CSV"
        >
          {exporting ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">Export</span> CSV
        </button>
        <button
          onClick={() => handleExport('pdf', 'session-report')}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 text-sm sm:text-base"
          title="Export session report as PDF"
        >
          {exporting ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">Export</span> PDF
        </button>
      </div>
    );
  }

  if (type === 'student') {
    return (
      <button
        onClick={() => handleExport('csv', 'student-performance')}
        disabled={exporting}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:bg-gray-400"
        title="Export student performance"
      >
        {exporting ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Export
      </button>
    );
  }

  return null;
};

export default ExportButtons;
