import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const AIResourceSearch = () => {
  const { sessionId } = useParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/ai-search/session/${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query, top_k: 5 })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        const error = await response.json();
        alert('Search failed: ' + error.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800',
      'document': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-green-100 text-green-800',
      'spreadsheet': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">AI Resource Search</h1>
        <p className="text-gray-600 text-sm sm:text-base">Search all materials using natural language</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about course materials..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-lg"
              disabled={isSearching}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors text-sm sm:text-base"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>

        <div className="mt-3 sm:mt-4 flex items-start gap-2 text-xs sm:text-sm text-gray-600">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="min-w-0">
            <p className="font-medium">Examples:</p>
            <ul className="mt-1 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
              <li className="truncate">"What are key OOP principles?"</li>
              <li className="truncate hidden sm:block">"Explain polymorphism with examples"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Searching materials...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No results found</h3>
          <p className="text-gray-600 text-sm sm:text-base">Try rephrasing your question</p>
        </div>
      ) : results.length > 0 ? (
        <div>
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Found {results.length} {results.length === 1 ? 'result' : 'results'}
            </h3>
            <span className="text-xs sm:text-sm text-gray-500 truncate">"{query}"</span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-700 truncate">
                        {result.resource_title || 'Untitled Resource'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500">
                        {result.pageNumber && (
                          <span>Page {result.pageNumber}</span>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-green-600">
                            {(result.similarityScore * 100).toFixed(0)}% match
                          </span>
                        </span>
                      </div>
                    </div>
                    <span className={`self-start px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${getTypeColor(result.resource_type)}`}>
                      {result.resource_type}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-gray-50 rounded-md p-3 sm:p-4 mb-3 sm:mb-4 border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm line-clamp-3 sm:line-clamp-none">
                      {result.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <a
                      href={result.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Document
                    </a>
                    <span className="text-xs text-gray-500 truncate">{result.file_name}</span>
                  </div>
                </div>

                {/* Similarity indicator */}
                <div className="h-1 bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    style={{ width: `${result.similarityScore * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Info Box */}
      {!hasSearched && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How AI Search Works
          </h3>
          <ul className="text-blue-800 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Ask in natural language - AI understands context</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Results ranked by relevance</span>
            </li>
            <li className="flex items-start gap-2 hidden sm:flex">
              <span className="text-blue-500 font-bold">•</span>
              <span>Click results to open documents</span>
            </li>
            <li className="flex items-start gap-2 hidden sm:flex">
              <span className="text-blue-500 font-bold">•</span>
              <span>Works with PDFs, Word, and PowerPoint</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIResourceSearch;
