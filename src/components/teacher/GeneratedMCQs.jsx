import React, { useState, useEffect, useRef } from 'react';
import { pollAPI } from '../../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL ;

const GeneratedMCQs = ({ sessionId, generatedMCQs, onMCQsSent }) => {
  const [mcqs, setMcqs] = useState([]);
  const [selectedMCQs, setSelectedMCQs] = useState(new Set());
  const [sendingIds, setSendingIds] = useState(new Set());
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [pollStats, setPollStats] = useState({});
  const [expiredIds, setExpiredIds] = useState(new Set());

  const [pollIds, setPollIds] = useState({});

  // Bulk sending queue system
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkQueue, setBulkQueue] = useState([]);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0);
  const [bulkSentIds, setBulkSentIds] = useState(new Set());

  const wsRef = useRef(null);

  useEffect(() => {
    if (window.socket) {
      wsRef.current = window.socket;
      setWsConnected(window.socket.readyState === WebSocket.OPEN);
    }

    if (generatedMCQs && Array.isArray(generatedMCQs)) {
      const mcqsWithIds = generatedMCQs.map((mcq, index) => ({
        ...mcq,
        tempId: mcq.id || `temp_${index}`,
        isEdited: false
      }));

      // filter out removed ones
      setMcqs(mcqsWithIds);
    }
  }, [generatedMCQs]);


  const handleMCQSelection = (tempId) => {
    const newSelected = new Set(selectedMCQs);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedMCQs(newSelected);
  };

  const handleSelectAll = () => {
    const unsentMCQs = mcqs.filter(m => !sentIds.has(m.tempId) && !bulkSentIds.has(m.tempId));
    if (selectedMCQs.size === unsentMCQs.length && selectedMCQs.size > 0) {
      setSelectedMCQs(new Set());
    } else {
      setSelectedMCQs(new Set(unsentMCQs.map(mcq => mcq.tempId)));
    }
  };

  const handleEditMCQ = (tempId) => {
    const mcq = mcqs.find(m => m.tempId === tempId);
    setEditingMCQ({ ...mcq });
  };

  const handleSaveEdit = () => {
    setMcqs(mcqs.map(mcq =>
      mcq.tempId === editingMCQ.tempId
        ? { ...editingMCQ, isEdited: true }
        : mcq
    ));
    setEditingMCQ(null);
  };

  const handleCancelEdit = () => {
    setEditingMCQ(null);
  };

  const deleteMCQ = async (mcqId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generated-mcqs/${mcqId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete MCQ");
      }

      console.log("MCQ deleted successfully");
      // Optional: Update your state (remove the deleted MCQ from UI)
    } catch (error) {
      console.error("Error deleting MCQ:", error);
    }
  };


  const handleDeleteMCQ = (tempId) => {
    if (window.confirm('Are you sure you want to delete this MCQ?')) {
      setMcqs(mcqs.filter(mcq => mcq.tempId !== tempId));
      const newSelected = new Set(selectedMCQs);
      newSelected.delete(tempId);
      setSelectedMCQs(newSelected);
      deleteMCQ(tempId);
    }
  };

  const handleClosePoll = async (tempId) => {
  try {
    const pollId = pollIds[tempId];
    console.log(pollId);
    if (pollId) {
      console.log(pollId);
      await pollAPI.closePoll(pollId);
    }
    // then delete MCQ from UI
    handleDeleteMCQ(tempId);
  } catch (error) {
    console.error("Error closing poll:", error);
    alert("Failed to close poll");
  }
};


  const handleSendMCQ = async (mcq) => {
    console.log(mcq);
    setSendingIds(prev => new Set(prev).add(mcq.tempId));
    try {
      const pollData = {
        session_id: sessionId,
        question: mcq.question,
        options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options),
        correct_answer: mcq.correct_answer,
        justification: mcq.justification || '',
        time_limit: mcq.time_limit || 60
      };

      const createdPoll = await pollAPI.createPoll(pollData);
      const activatedPoll = await pollAPI.activatePoll(createdPoll.id);

      setPollIds(prev => ({ ...prev, [mcq.tempId]: createdPoll.id }));

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'activate-poll', sessionId, poll: activatedPoll }));
        alert('MCQ sent to students successfully!');
      } else {
        alert('MCQ activated but WebSocket not connected');
      }

      // ✅ mark this mcq as sent
      setSentIds(prev => new Set(prev).add(mcq.tempId));

      // ✅ fetch poll stats right after sending
      const intervalId = setInterval(async () => {
        const stats = await pollAPI.getPollStats(createdPoll.id);
        setPollStats(prev => ({ ...prev, [mcq.tempId]: stats.data }));
        console.log(stats);
      }, 3000); // update every 3 sec

      // Stop interval after poll ends
      // Stop interval after poll ends + mark expired
      setTimeout(() => {
        clearInterval(intervalId);
        setExpiredIds(prev => new Set(prev).add(mcq.tempId)); // mark as expired
      }, createdPoll.time_limit * 1000);

      console.log(pollStats);

      if (onMCQsSent) onMCQsSent();
    } catch (error) {
      alert('Error sending MCQ: ' + error.message);
    } finally {
      setSendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mcq.tempId);
        return newSet;
      });

    }
  };

  const handleSendSelectedMCQs = async () => {
    const selectedMCQsArray = mcqs.filter(mcq => selectedMCQs.has(mcq.tempId));

    if (selectedMCQsArray.length === 0) {
      alert('Please select MCQs to send');
      return;
    }

    setIsBulkSending(true);
    setBulkQueue(selectedMCQsArray);
    setCurrentBulkIndex(0);
    setBulkSentIds(new Set());
    setSelectedMCQs(new Set()); // Clear selection immediately

    // Process queue sequentially
    for (let i = 0; i < selectedMCQsArray.length; i++) {
      const mcq = selectedMCQsArray[i];
      setCurrentBulkIndex(i);

      // Send the MCQ to students
      await handleSendMCQ(mcq);

      // Mark as bulk sent (for filtering)
      setBulkSentIds(prev => new Set(prev).add(mcq.tempId));

      // Wait for poll duration + 3 seconds before auto-removing
      const waitTime = (mcq.time_limit || 60) * 1000 + 3000;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Auto-remove from UI (filter out)
      setMcqs(prev => prev.filter(m => m.tempId !== mcq.tempId));
    }

    // Clear bulk sending state
    setIsBulkSending(false);
    setBulkQueue([]);
    setBulkSentIds(new Set());

    alert('All selected MCQs have been sent and completed!');
  };


  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Generated MCQs</h3>
        <p className="text-gray-500 text-sm sm:text-base">No generated MCQs available. MCQs will appear here when generated from class transcripts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Generated MCQs ({mcqs.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            disabled={isBulkSending || mcqs.filter(m => !sentIds.has(m.tempId) && !bulkSentIds.has(m.tempId)).length === 0}
            className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 active:bg-gray-700 disabled:bg-gray-300 text-white px-3 py-2 sm:py-1 rounded text-xs sm:text-sm transition-colors"
          >
            {selectedMCQs.size === mcqs.filter(m => !sentIds.has(m.tempId) && !bulkSentIds.has(m.tempId)).length && selectedMCQs.size > 0 ? 'Deselect' : 'Select All'}
          </button>
          <button
            onClick={handleSendSelectedMCQs}
            disabled={isBulkSending || selectedMCQs.size === 0 || !wsConnected}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded font-medium text-xs sm:text-sm transition-colors"
            title={!wsConnected ? 'WebSocket disconnected' : (selectedMCQs.size === 0 ? 'Please select MCQs to send' : `Send ${selectedMCQs.size} MCQ${selectedMCQs.size > 1 ? 's' : ''} in queue`)}
          >
            {isBulkSending ? 'Sending...' : `Send (${selectedMCQs.size})`}
          </button>
        </div>
      </div>

      {/* WebSocket Status Indicator */}
      {!wsConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 text-sm">WebSocket disconnected - MCQs may not reach students in real-time</span>
          </div>
        </div>
      )}

      {/* Bulk Sending Progress Indicator */}
      {isBulkSending && bulkQueue.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 flex-shrink-0"></div>
              <div className="min-w-0">
                <span className="text-blue-900 font-bold text-sm sm:text-lg">
                  📤 Sending: {currentBulkIndex + 1}/{bulkQueue.length}
                </span>
                <p className="text-xs sm:text-sm text-blue-700 mt-1 truncate">
                  {bulkQueue[currentBulkIndex]?.question.substring(0, 50)}...
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right flex sm:block items-center gap-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {bulkQueue.length - currentBulkIndex - 1}
              </div>
              <div className="text-xs text-blue-600">remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-blue-200 rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${((currentBulkIndex + 1) / bulkQueue.length) * 100}%` }}
            ></div>
          </div>

          <p className="text-xs text-blue-600 mt-2 text-center">
            Please wait... MCQs are being sent automatically
          </p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
        {mcqs.filter(mcq => !bulkSentIds.has(mcq.tempId)).map((mcq, index) => (
          <div
            key={mcq.tempId}
            className={`border rounded-lg p-3 sm:p-4 transition-all ${
              bulkQueue[currentBulkIndex]?.tempId === mcq.tempId && isBulkSending
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {!sentIds.has(mcq.tempId) && !bulkSentIds.has(mcq.tempId) && (
                  <input
                    type="checkbox"
                    checked={selectedMCQs.has(mcq.tempId)}
                    onChange={() => handleMCQSelection(mcq.tempId)}
                    disabled={isBulkSending}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">MCQ {index + 1}</span>
                  {mcq.isEdited && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Edited</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-7 sm:ml-0">
                {!sentIds.has(mcq.tempId) && !bulkSentIds.has(mcq.tempId) ? (
                  <>
                    <button
                      onClick={() => handleEditMCQ(mcq.tempId)}
                      disabled={isBulkSending}
                      className="text-blue-600 hover:text-blue-800 active:text-blue-900 text-xs sm:text-sm disabled:opacity-50 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMCQ(mcq.tempId)}
                      disabled={isBulkSending}
                      className="text-red-600 hover:text-red-800 active:text-red-900 text-xs sm:text-sm disabled:opacity-50 py-1"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleSendMCQ(mcq)}
                      disabled={isBulkSending || sendingIds.has(mcq.tempId) || !wsConnected}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm"
                    >
                      {sendingIds.has(mcq.tempId) ? "..." : "Send"}
                    </button>
                  </>
                ) : expiredIds.has(mcq.tempId) ? (
                  <button
                    onClick={() => handleClosePoll(mcq.tempId)}
                    className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm"
                  >
                    OK
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-red-500 text-white px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm cursor-not-allowed"
                  >
                    Sent
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3">
              <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">{mcq.question}</h4>
              <div className="space-y-1">
                {(Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options)).map((option, optionIndex) => (
                  <div key={optionIndex} className={`text-xs sm:text-sm p-1.5 sm:p-2 rounded ${optionIndex === mcq.correct_answer
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'bg-gray-50 text-gray-700'
                    }`}>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                    {optionIndex === mcq.correct_answer && ' ✓'}
                  </div>
                ))}
              </div>
            </div>

            {mcq.justification && (
              <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 rounded">
                <strong>Justification:</strong> {mcq.justification}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Time: {mcq.time_limit || 60}s
            </div>
            {sentIds.has(mcq.tempId) && pollStats[mcq.tempId] && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-700 grid grid-cols-2 gap-1">
                <div>Answered: {pollStats[mcq.tempId].answered}</div>
                <div>Not Answered: {pollStats[mcq.tempId].not_answered}</div>
                <div className="col-span-2">Correct: {pollStats[mcq.tempId].correct_percentage}%</div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingMCQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Edit MCQ</h3>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={editingMCQ.question}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, question: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                {(Array.isArray(editingMCQ.options) ? editingMCQ.options : JSON.parse(editingMCQ.options)).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={editingMCQ.correct_answer === index}
                      onChange={() => setEditingMCQ({ ...editingMCQ, correct_answer: index })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const currentOptions = Array.isArray(editingMCQ.options) ? editingMCQ.options : JSON.parse(editingMCQ.options);
                        const newOptions = [...currentOptions];
                        newOptions[index] = e.target.value;
                        setEditingMCQ({ ...editingMCQ, options: newOptions });
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea
                  value={editingMCQ.justification || ''}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, justification: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  rows="2"
                  placeholder="Explain why this question is important..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (seconds)</label>
                <input
                  type="number"
                  value={editingMCQ.time_limit || 60}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, time_limit: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  min="10"
                  max="300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 sm:mt-6">
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedMCQs;
