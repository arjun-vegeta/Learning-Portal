import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  FiPlayCircle, FiPauseCircle, FiStopCircle, FiRefreshCw, FiX, FiClock
} from 'react-icons/fi';

// Create context
const PomodoroContext = createContext();

// Custom hook to use the Pomodoro context
export const usePomodoroTimer = () => useContext(PomodoroContext);

// Provider component
export const PomodoroProvider = ({ children }) => {
  // Pomodoro timer states
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);    // Indicates if the timer is running
  const [isPaused, setIsPaused] = useState(false);              // Indicates if the timer is paused
  const [isTimerStarted, setIsTimerStarted] = useState(false);    // Controls the visibility of the timer UI
  const [pomodoroTime, setPomodoroTime] = useState(25);           // Focus duration (minutes)
  const [breakTime, setBreakTime] = useState(5);                  // Break duration (minutes)
  const [currentTime, setCurrentTime] = useState(25 * 60);        // Current timer in seconds
  const [isBreak, setIsBreak] = useState(false);                  // Determines if it is break time
  const [intervalId, setIntervalId] = useState(null);

  // Cleanup timer interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Start or resume the Pomodoro timer
  const startPomodoro = () => {
    if (!isTimerActive || isPaused) {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Start a new interval that counts down every second
      const id = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime <= 1) {
            // Timer completed: play sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
            audio.play();
            
            // Toggle between focus and break periods
            if (isBreak) {
              setIsBreak(false);
              return pomodoroTime * 60;
            } else {
              setIsBreak(true);
              return breakTime * 60;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setIntervalId(id);
      setIsTimerActive(true);
      setIsPaused(false);
      setIsTimerStarted(true); // Ensure the timer UI is visible
    }
  };

  // Pause the timer
  const pausePomodoro = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsTimerActive(false);
      setIsPaused(true);
    }
  };

  // Reset the timer without closing the UI
  const resetPomodoro = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCurrentTime(pomodoroTime * 60);
    setIsPaused(false);
    setIsBreak(false);
    setIsTimerActive(false);
    // Note: isTimerStarted remains true so the UI stays visible
  };

  // Stop the timer and hide the UI
  const stopPomodoro = () => {
    resetPomodoro();
    setIsTimerStarted(false);
  };

  // Update focus duration from input
  const handlePomodoroTimeChange = (e) => {
    const value = parseInt(e.target.value, 10) || 25;
    setPomodoroTime(value);
    // If the timer hasn't started yet, update currentTime
    if (!isTimerActive && !isTimerStarted) {
      setCurrentTime(value * 60);
    }
  };

  // Update break duration from input
  const handleBreakTimeChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setBreakTime(value);
  };

  // Start a new Pomodoro session from the settings modal
  const startNewPomodoro = () => {
    resetPomodoro();
    setCurrentTime(pomodoroTime * 60);
    startPomodoro();
    setShowPomodoroModal(false);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pomodoro Settings Modal Component
  const PomodoroModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pomodoro Timer Settings</h2>
          <button 
            onClick={() => setShowPomodoroModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Focus Duration (minutes)</label>
          <input
            type="number"
            value={pomodoroTime}
            onChange={handlePomodoroTimeChange}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
            max="60"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Break Duration (minutes)</label>
          <input
            type="number"
            value={breakTime}
            onChange={handleBreakTimeChange}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
            max="30"
          />
        </div>
        
        <button
          onClick={startNewPomodoro}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Timer
        </button>
      </div>
    </div>
  );

  // Floating Pomodoro Timer Component (visible if the timer has been started)
  const FloatingPomodoro = () => {
    if (!isTimerStarted) return null;
    
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 z-40">
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </h3>
          <div className="text-3xl font-bold mb-3 text-blue-600">
            {formatTime(currentTime)}
          </div>
          <div className="flex justify-center space-x-2">
            {isTimerActive ? (
              <button
                onClick={pausePomodoro}
                className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
              >
                <FiPauseCircle size={24} />
              </button>
            ) : (
              <button
                onClick={startPomodoro}
                className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
              >
                <FiPlayCircle size={24} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetPomodoro();
              }}
              className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            >
              <FiRefreshCw size={24} />
            </button>
            <button
              onClick={stopPomodoro}
              className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
            >
              <FiStopCircle size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Button to open the Pomodoro Settings Modal
  const PomodoroButton = () => (
    <button
      onClick={() => setShowPomodoroModal(true)}
      className="bg-green-100 text-green-600 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center"
    >
      <FiClock className="mr-2" /> Pomodoro Timer
    </button>
  );

  // Values provided to consumers
  const value = {
    showPomodoroModal,
    setShowPomodoroModal,
    isTimerActive,
    isPaused,
    isTimerStarted,
    currentTime,
    isBreak,
    pomodoroTime,
    breakTime,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    stopPomodoro,
    handlePomodoroTimeChange,
    handleBreakTimeChange,
    startNewPomodoro,
    formatTime,
    PomodoroModal,
    FloatingPomodoro,
    PomodoroButton,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      {showPomodoroModal && <PomodoroModal />}
      <FloatingPomodoro />
    </PomodoroContext.Provider>
  );
};

export default PomodoroProvider;
