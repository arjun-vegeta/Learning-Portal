import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  FiVideo, FiFileText, FiUsers, FiArrowLeft, FiTrendingUp,
  FiBook, FiClock, FiCheck, FiXCircle, FiDownload, FiEdit2
} from 'react-icons/fi';
import { usePomodoroTimer } from './PomodoroContext';
import PDFViewerAdvanced from './PDFViewerAdvanced';
import VideoPlayer from './VideoPlayer'; // Import the updated VideoPlayer component

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const Message = ({ type, children }) => (
  <div className={`p-3 rounded-lg mb-4 text-sm ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center mb-4">
    {icon}
    <h2 className="text-xl font-semibold ml-2">{title}</h2>
  </div>
);

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('lectures');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [classmates, setClassmates] = useState([]);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [watchProgress, setWatchProgress] = useState({});
  const [noteProgress, setNoteProgress] = useState({});
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const token = localStorage.getItem('token');
  
  // Use Pomodoro context
  const { PomodoroButton } = usePomodoroTimer();

  useEffect(() => {
    fetchCourseDetails();
    fetchClassmates();
    fetchWatchProgress();
    fetchNoteProgress();
    fetchQuizzes();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, detailsRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/student/courses/${courseId}`, {
          headers: { authorization: token },
        }),
        axios.get(`http://localhost:5001/api/student/courses/${courseId}/details`, {
          headers: { authorization: token },
        }),
      ]);
      setCourse({ ...courseRes.data.course, ...detailsRes.data });
      setCurrentStudentId(detailsRes.data.studentId);
    } catch (err) {
      setError('Failed to fetch course details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassmates = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/student/courses/${courseId}/students`, {
        headers: { authorization: token },
      });
      setClassmates(res.data.students);
    } catch (err) {
      console.error('Error fetching classmates:', err);
    }
  };

  const fetchWatchProgress = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/student/courses/${courseId}/progress`, {
        headers: { authorization: token },
      });
      const progressMap = {};
      res.data.progress.forEach(item => {
        progressMap[item.lecture_id] = item.progress || 0;
      });
      setWatchProgress(progressMap);
    } catch (err) {
      console.error('Error fetching watch progress:', err);
    }
  };

  const fetchNoteProgress = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/student/courses/${courseId}/note-progress`, {
        headers: { authorization: token },
      });
      const progressMap = {};
      res.data.progress.forEach(item => {
        progressMap[item.note_id] = item.viewed || 0;
      });
      setNoteProgress(progressMap);
    } catch (err) {
      console.error('Error fetching note progress:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/courses/${courseId}/quizzes`, {
        headers: { authorization: token },
      });
      setQuizzes(res.data.quizzes);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const updateWatchProgress = async (lectureId, progress) => {
    try {
      // Don't reduce progress if already above 75% threshold
      const newProgress = watchProgress[lectureId] >= 0.75 ? 
        Math.max(progress, watchProgress[lectureId]) : 
        progress;
        
      await axios.post(
        `http://localhost:5001/api/student/lectures/${lectureId}/progress`,
        { progress: newProgress },
        { headers: { authorization: token } }
      );
      setWatchProgress(prev => ({
        ...prev,
        [lectureId]: newProgress
      }));
    } catch (err) {
      console.error('Error updating watch progress:', err);
    }
  };

  const markWatch = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5001/api/student/courses/${courseId}/watch`,
        {},
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchCourseDetails();
      fetchClassmates(); // Refresh classmates after marking watch
    } catch (err) {
      setMessage('Error marking watch');
      console.error(err);
    }
  };

  const markNoteAsViewed = async (noteId) => {
    try {
      await axios.post(
        `http://localhost:5001/api/student/notes/${noteId}/view`,
        {},
        { headers: { authorization: token } }
      );
      setNoteProgress(prev => ({
        ...prev,
        [noteId]: 1
      }));
    } catch (err) {
      console.error('Error marking note as viewed:', err);
    }
  };

  // Updated progress handler to use accumulated watch time
  const handleVideoProgress = (state, lectureId) => {
    const { playedSeconds, accumulated, duration } = state;
    
    // Calculate the progress fraction based on total duration
    const progressFraction = duration > 0 ? playedSeconds / duration : 0;
    
    // Update watch progress and persist to backend
    updateWatchProgress(lectureId, progressFraction);
    
    // Mark as watched if accumulated watch time is at least 75% of total duration
    if (duration > 0 && accumulated >= 0.75 * duration && (!watchProgress[lectureId] || watchProgress[lectureId] < 0.75)) {
      markWatch();
      console.log(`Lecture ${lectureId} watched with ${accumulated.toFixed(2)}s accumulated watch time (75% of ${duration}s).`);
    }
  };

  const handleNoteView = (note) => {
    setSelectedNote(note);
    setSelectedLecture(null);
    markNoteAsViewed(note.id);
  };

  const isPDF = (filePath) => {
    return filePath && filePath.toLowerCase().endsWith('.pdf');
  };

  const handleQuizSelect = (quizId, attempted) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5001/api/quizzes/${selectedQuiz.quiz.id}/submit`,
        { answers: quizAnswers },
        { headers: { authorization: token } }
      );
      setQuizResult(res.data);
      fetchQuizzes(); // Refresh quiz list to update attempt status
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!course) return <div className="p-8">Course not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          <PomodoroButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
                  <p className="text-gray-600">Taught by {course.teacherName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-blue-600 font-semibold">Streak: {course.streak} 🔥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Player Section */}
            {selectedLecture && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">{selectedLecture.title}</h2>
                <div className="rounded-lg overflow-hidden">
                  <VideoPlayer 
                    lecture={selectedLecture} 
                    onProgress={(state) => handleVideoProgress(state, selectedLecture.id)}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500 flex items-center">
                  <FiClock className="mr-1" />
                  {new Date(selectedLecture.upload_date).toLocaleDateString()}
                  {watchProgress[selectedLecture.id] >= 0.75 && (
                    <div className="ml-4 text-green-600 flex items-center">
                      <FiCheck className="mr-2" /> Marked as watched
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PDF Viewer Section */}
            {selectedNote && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{selectedNote.title}</h2>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                  >
                    <FiXCircle className="mr-2" /> Close
                  </button>
                </div>
                
                {isPDF(selectedNote.file_path) ? (
                  <div className="rounded-lg overflow-hidden">
                    <PDFViewerAdvanced filePath={selectedNote.file_path} />
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <FiFileText className="text-blue-500 text-5xl mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-800 mb-2">This file type can't be previewed</h3>
                      <p className="text-gray-600 mb-6">This document is available for download only.</p>
                      <a
                        href={`http://localhost:5001${selectedNote.file_path}`}
                        download
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                      >
                        <FiDownload className="mr-2" /> Download File
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500 flex items-center">
                  <FiClock className="mr-1" />
                  {new Date(selectedNote.upload_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Course Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex space-x-4 border-b mb-4">
                <button
                  onClick={() => setActiveTab('lectures')}
                  className={`pb-2 px-4 ${
                    activeTab === 'lectures'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Lectures
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2 px-4 ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('classmates')}
                  className={`pb-2 px-4 ${
                    activeTab === 'classmates'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Classmates
                </button>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className={`pb-2 px-4 ${
                    activeTab === 'quizzes'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Quizzes
                </button>
              </div>

              {message && <Message type={message.includes('Error') ? 'error' : 'success'}>{message}</Message>}

              {activeTab === 'lectures' && (
                <div className="space-y-4">
                  {course.lectures.map((lec) => (
                    <div 
                      key={lec.id} 
                      className={`bg-gray-50 p-4 rounded-lg border hover:border-blue-200 transition-colors ${
                        watchProgress[lec.id] >= 0.75 ? 'border-green-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiVideo className="text-blue-500 mr-3 text-xl" />
                          <div>
                            <h4 className="font-medium text-gray-800 flex items-center">
                              {lec.title}
                              {watchProgress[lec.id] >= 0.75 && (
                                <FiCheck className="ml-2 text-green-600" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-500 flex items-center">
                              <FiClock className="mr-1" />
                              {new Date(lec.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLecture(lec);
                            setSelectedNote(null);
                          }}
                          className={`px-4 py-2 rounded-lg flex items-center ${
                            selectedLecture && selectedLecture.id === lec.id
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          <FiVideo className="mr-2" /> Watch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {course.notes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`bg-gray-50 p-4 rounded-lg border hover:border-blue-200 transition-colors ${
                        noteProgress[note.id] ? 'border-green-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiFileText className="text-blue-500 mr-3 text-xl" />
                          <div>
                            <h4 className="font-medium text-gray-800 flex items-center">
                              {note.title}
                              {noteProgress[note.id] && (
                                <FiCheck className="ml-2 text-green-600" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-500 flex items-center">
                              <FiClock className="mr-1" />
                              {new Date(note.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNoteView(note)}
                          className={`px-4 py-2 rounded-lg flex items-center ${
                            selectedNote && selectedNote.id === note.id
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          <FiFileText className="mr-2" /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quizzes Tab Content */}
              {activeTab === 'quizzes' && (
                <div className="space-y-6">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{quiz.title}</h3>
                          <p className="text-gray-600">{quiz.description}</p>
                        </div>
                        {quiz.attempted ? (
                          <button
                            onClick={() => handleQuizSelect(quiz.id, true)}
                            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg"
                          >
                            Show Result
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuizSelect(quiz.id, false)}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg"
                          >
                            Take Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedQuiz && (
                    <div className="mt-8">
                      {/* Remove the inline quiz UI, as we're now redirecting to the QuizPage */}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Classmates Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <SectionHeader icon={<FiUsers className="text-green-500" />} title="Classmates" />
              <div className="space-y-4">
                {classmates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No other students enrolled</p>
                ) : (
                  classmates.map((student) => (
                    <div 
                      key={student.id} 
                      className={`p-4 rounded-lg border ${
                        student.id === currentStudentId 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {student.name}
                            {student.id === currentStudentId && (
                              <span className="ml-2 text-sm text-blue-600">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Current Course Streak</p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-orange-600 font-semibold">{student.streak}</span>
                          <span className="ml-1">🔥</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
