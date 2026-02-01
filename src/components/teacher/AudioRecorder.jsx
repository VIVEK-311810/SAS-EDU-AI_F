import React, { useEffect, useRef } from 'react';

const AudioRecorder = ({ audioRecorder, sessionId: propSessionId }) => {
  const transcriptEndRef = useRef(null);

  // Destructure props from audioRecorder hook
  const {
    sessionId,
    setSessionId,
    pdfFile,
    segmentInterval,
    setSegmentInterval,
    status,
    transcripts,
    notes,
    setNotes,
    isProcessing,
    handlePdfChange,
    clearPdf,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    generateNotes,
    sendManualNotes
  } = audioRecorder;

  // Interval options (minutes)
  const intervalOptions = [1, 5, 10, 15, 20, 25, 30];

  // Auto-scroll transcript display
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Audio Transcription</h2>
        <p className="text-gray-600 text-sm mt-1">Record and transcribe class audio in real-time</p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-700 font-semibold">Status:</span>
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
          status === 'idle' ? 'bg-gray-200 text-gray-700' :
          status === 'recording' ? 'bg-green-500 text-white animate-pulse' :
          'bg-yellow-500 text-white'
        }`}>
          {status === 'idle' ? 'Idle' : status === 'recording' ? '🔴 Recording' : '⏸ Paused'}
        </span>
      </div>

      {/* Session Configuration */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Session ID *
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            disabled={status !== 'idle' || propSessionId}
            placeholder="Enter unique session ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PDF File (Optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              disabled={status !== 'idle'}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {pdfFile && (
              <button
                onClick={clearPdf}
                disabled={status !== 'idle'}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Clear
              </button>
            )}
          </div>
          {pdfFile && (
            <p className="text-sm text-green-600 mt-1">✓ {pdfFile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Segment Interval (minutes)
          </label>
          <select
            value={segmentInterval}
            onChange={(e) => setSegmentInterval(parseInt(e.target.value))}
            disabled={status !== 'idle'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {intervalOptions.map(interval => (
              <option key={interval} value={interval}>
                {interval} minute{interval > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Transcripts will be sent to webhook every {segmentInterval} minute{segmentInterval > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={startRecording}
          disabled={status !== 'idle' || !sessionId.trim() || isProcessing}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>

        <button
          onClick={status === 'paused' ? resumeRecording : pauseRecording}
          disabled={status === 'idle' || isProcessing}
          className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'paused' ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={stopRecording}
          disabled={status === 'idle' || isProcessing}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Stop
        </button>

        <button
          onClick={generateNotes}
          disabled={status === 'idle' || isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          📝 Generate Notes
        </button>
      </div>

      {/* Real-time Transcript Display */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Transcript</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
          {transcripts.length === 0 ? (
            <p className="text-gray-400 text-center italic">Transcripts will appear here...</p>
          ) : (
            <div className="space-y-2">
              {transcripts.map((transcript, index) => (
                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-800">{transcript.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {transcript.timestamp.toLocaleTimeString()}
                    {transcript.language && ` • ${transcript.language}`}
                  </p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Manual Notes Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Manual Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write additional notes here..."
          disabled={isProcessing}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
        <button
          onClick={sendManualNotes}
          disabled={!notes.trim() || isProcessing}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send Notes
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Audio is recorded in 5-second chunks and transcribed by GPU server</li>
          <li>• Transcripts accumulate and are sent to webhook every {segmentInterval} minute{segmentInterval > 1 ? 's' : ''}</li>
          <li>• Use "Generate Notes" to send complete transcript anytime during session</li>
          <li>• Manual notes are sent immediately via separate webhook</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioRecorder;
