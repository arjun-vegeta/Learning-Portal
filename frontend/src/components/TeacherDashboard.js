import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiVideo, FiFileText, FiUsers, FiBook, FiChevronRight, FiInbox, FiCheck, FiX, FiLogOut, FiRefreshCw, FiEdit2, FiBarChart2 } from 'react-icons/fi';
import QuizCreator from './QuizCreator';

// Common Components
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

// Add these components before TeacherDashboard
const UploadSection = ({ courseId }) => {
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureFile, setLectureFile] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const handleLectureUpload = async (e) => {
    e.preventDefault();
    if (!lectureFile || !lectureTitle) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('video', lectureFile);
    formData.append('title', lectureTitle);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/teacher/courses/${courseId}/lecture`,
        formData,
        {
          headers: {
            authorization: token,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage(res.data.message);
      setLectureTitle('');
      setLectureFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error uploading lecture');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteUpload = async (e) => {
    e.preventDefault();
    if (!noteFile || !noteTitle) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('note', noteFile);
    formData.append('title', noteTitle);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/teacher/courses/${courseId}/note`,
        formData,
        {
          headers: {
            authorization: token,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage(res.data.message);
      setNoteTitle('');
      setNoteFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error uploading note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-5 rounded-lg">
        <h3 className="font-medium mb-4 flex items-center">
          <FiVideo className="mr-2 text-blue-500" /> Upload Lecture
        </h3>
        <form onSubmit={handleLectureUpload} className="space-y-3">
          <input
            type="text"
            placeholder="Lecture Title"
            className="w-full p-2 border rounded-lg"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            required
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              id="lecture-upload"
              onChange={(e) => setLectureFile(e.target.files[0])}
              required
            />
            <label htmlFor="lecture-upload" className="cursor-pointer text-gray-600">
              <FiUploadCloud className="text-2xl mx-auto mb-2" />
              <p>Click to upload video file</p>
              {lectureFile && <p className="mt-2 text-sm">{lectureFile.name}</p>}
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload Lecture'}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <h3 className="font-medium mb-4 flex items-center">
          <FiFileText className="mr-2 text-green-500" /> Upload Note
        </h3>
        <form onSubmit={handleNoteUpload} className="space-y-3">
          <input
            type="text"
            placeholder="Note Title"
            className="w-full p-2 border rounded-lg"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            required
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              id="note-upload"
              onChange={(e) => setNoteFile(e.target.files[0])}
              required
            />
            <label htmlFor="note-upload" className="cursor-pointer text-gray-600">
              <FiUploadCloud className="text-2xl mx-auto mb-2" />
              <p>Click to upload document</p>
              {noteFile && <p className="mt-2 text-sm">{noteFile.name}</p>}
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ContentsSection = ({ courseId }) => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState({ lectures: [], notes: [], quizzes: [] });
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const [lecturesRes, notesRes, quizzesRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/teacher/courses/${courseId}/lectures`, {
            headers: { authorization: token },
          }),
          axios.get(`http://localhost:5001/api/teacher/courses/${courseId}/notes`, {
            headers: { authorization: token },
          }),
          axios.get(`http://localhost:5001/api/courses/${courseId}/quizzes`, {
            headers: { authorization: token },
          }),
        ]);
        setUploads({ 
          lectures: lecturesRes.data.lectures, 
          notes: notesRes.data.notes,
          quizzes: quizzesRes.data.quizzes 
        });
      } catch (err) {
        console.error('Error fetching uploads:', err);
      }
    };
    fetchUploads();
  }, [courseId]);

  const handleQuizCreated = (quizId) => {
    setShowQuizCreator(false);
    // Refresh quizzes list
    axios.get(`http://localhost:5001/api/courses/${courseId}/quizzes`, {
      headers: { authorization: token },
    }).then(res => {
      setUploads(prev => ({
        ...prev,
        quizzes: res.data.quizzes
      }));
    }).catch(err => {
      console.error('Error refreshing quizzes:', err);
    });
  };

  const viewQuizResults = (quizId) => {
    navigate(`/quiz-results/${quizId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-5 rounded-lg">
        <h3 className="font-medium mb-4 flex items-center">
          <FiVideo className="mr-2 text-blue-500" /> Uploaded Lectures
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {uploads.lectures.map((lec) => (
            <div key={lec.id} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lec.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(lec.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`http://localhost:5001${lec.video_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <FiVideo className="text-xl" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <h3 className="font-medium mb-4 flex items-center">
          <FiFileText className="mr-2 text-green-500" /> Uploaded Notes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {uploads.notes.map((note) => (
            <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(note.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`http://localhost:5001${note.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-600 hover:text-green-700"
                >
                  <FiFileText className="text-xl" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center">
            <FiEdit2 className="mr-2 text-purple-500" /> Quizzes
          </h3>
          <button
            onClick={() => setShowQuizCreator(!showQuizCreator)}
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200"
          >
            {showQuizCreator ? 'Cancel' : 'Create Quiz'}
          </button>
        </div>

        {showQuizCreator ? (
          <QuizCreator courseId={courseId} onQuizCreated={handleQuizCreated} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uploads.quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => viewQuizResults(quiz.id)}
                      className="text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <FiBarChart2 className="mr-1" /> View Results
                    </button>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentsSection = ({ courseId, students, onRefresh }) => {
  return (
    <div className="bg-gray-50 p-5 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium flex items-center">
          <FiUsers className="mr-2 text-purple-500" /> Students Registered
        </h3>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <FiRefreshCw className="mr-1" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {students.map((student) => (
          <div key={student.id} className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="font-medium">{student.name}</p>
            <p className="text-sm text-gray-500">Streak: {student.streak}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('upload'); 
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureFile, setLectureFile] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [uploads, setUploads] = useState({ lectures: [], notes: [], quizzes: [] });
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('uploads');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTeacherInfo();
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/teacher/courses', {
          headers: { authorization: token },
        });
        setCourses(res.data.courses);
        // Automatically select the first course if there are any courses
        if (res.data.courses.length > 0) {
          setSelectedCourse(res.data.courses[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
    fetchEnrollmentRequests();
  }, [token]);

  const fetchTeacherInfo = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/teacher/info', {
        headers: { authorization: token },
      });
      setTeacherName(res.data.name);
    } catch (err) {
      console.error('Error fetching teacher info:', err);
    }
  };

  const handleLectureUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !lectureFile || !lectureTitle) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('video', lectureFile);
    formData.append('title', lectureTitle);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/teacher/courses/${selectedCourse.id}/lecture`,
        formData,
        {
          headers: {
            authorization: token,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage(res.data.message);
      setLectureTitle('');
      setLectureFile(null);
      fetchUploads();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error uploading lecture');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !noteFile || !noteTitle) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('note', noteFile);
    formData.append('title', noteTitle);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/teacher/courses/${selectedCourse.id}/note`,
        formData,
        {
          headers: {
            authorization: token,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage(res.data.message);
      setNoteTitle('');
      setNoteFile(null);
      fetchUploads();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error uploading note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUploads = async () => {
    if (!selectedCourse) return;
    try {
      const [lecturesRes, notesRes, quizzesRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/teacher/courses/${selectedCourse.id}/lectures`, {
          headers: { authorization: token },
        }),
        axios.get(`http://localhost:5001/api/teacher/courses/${selectedCourse.id}/notes`, {
          headers: { authorization: token },
        }),
        axios.get(`http://localhost:5001/api/courses/${selectedCourse.id}/quizzes`, {
          headers: { authorization: token },
        }),
      ]);
      setUploads({ 
        lectures: lecturesRes.data.lectures, 
        notes: notesRes.data.notes,
        quizzes: quizzesRes.data.quizzes 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    if (!selectedCourse) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/teacher/courses/${selectedCourse.id}/students`, {
        headers: { authorization: token },
      });
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setActiveTab('uploads');
    setMessage('');
    fetchStudents();
  };

  const fetchEnrollmentRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/teacher/enrollment-requests', {
        headers: { authorization: token },
      });
      setEnrollmentRequests(res.data.requests);
    } catch (err) {
      console.error('Error fetching enrollment requests:', err);
    }
  };

  const handleEnrollmentRequest = async (requestId, status) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/teacher/enrollment-requests/${requestId}`,
        { status },
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchEnrollmentRequests();
      if (selectedCourse) {
        fetchStudents(selectedCourse.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPendingRequestsCount = (courseId) => {
    return enrollmentRequests.filter(req => 
      req.course_id === courseId && req.status === 'pending'
    ).length;
  };

  const getTotalRequestsCount = (courseId) => {
    return enrollmentRequests.filter(req => req.course_id === courseId).length;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <FiBook className="mr-2 text-blue-500" />
          Welcome, {teacherName}!
        </h1>

        {message && <Message type={message.includes('Error') ? 'error' : 'success'}>{message}</Message>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Courses List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <SectionHeader icon={<FiBook className="text-blue-500" />} title="Your Courses" />
              <div className="space-y-2">
                {courses.map((course) => {
                  const pendingCount = getPendingRequestsCount(course.id);
                  return (
                    <div
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className={`p-3 rounded-lg cursor-pointer transition-all relative ${
                        selectedCourse?.id === course.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <h3 className="font-medium text-gray-800">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.studentCount || 0} students</p>
                      {pendingCount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Course Management */}
          <div className="lg:col-span-3">
            {selectedCourse ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCourse.title}</h2>
                    <p className="text-gray-600">Manage your course content and students</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('uploads')}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        activeTab === 'uploads'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiUploadCloud className="mr-2" /> Uploads
                    </button>
                    <button
                      onClick={() => setActiveTab('contents')}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        activeTab === 'contents'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiBook className="mr-2" /> Contents
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        activeTab === 'students'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiUsers className="mr-2" /> Students
                    </button>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className={`px-4 py-2 rounded-lg flex items-center relative ${
                        activeTab === 'requests'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiInbox className="mr-2" /> Requests
                      {getPendingRequestsCount(selectedCourse.id) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {getPendingRequestsCount(selectedCourse.id)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'uploads' && (
                  <UploadSection courseId={selectedCourse.id} />
                )}
                {activeTab === 'contents' && (
                  <ContentsSection courseId={selectedCourse.id} />
                )}
                {activeTab === 'students' && (
                  <StudentsSection
                    courseId={selectedCourse.id}
                    students={students}
                    onRefresh={fetchStudents}
                  />
                )}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {enrollmentRequests
                      .filter(request => request.course_id === selectedCourse.id)
                      .length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No enrollment requests for this course</p>
                    ) : (
                      enrollmentRequests
                        .filter(request => request.course_id === selectedCourse.id)
                        .map((request) => (
                          <div key={request.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-gray-600">Requested by {request.studentName}</p>
                                <p className="text-sm text-gray-600">Requested on {new Date(request.request_date).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-sm ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleEnrollmentRequest(request.id, 'approved')}
                                  className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 flex items-center"
                                >
                                  <FiCheck className="mr-1" /> Approve
                                </button>
                                <button
                                  onClick={() => handleEnrollmentRequest(request.id, 'rejected')}
                                  className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 flex items-center"
                                >
                                  <FiX className="mr-1" /> Reject
                                </button>
                              </div>
                            )}
                            {request.response_date && (
                              <p className="text-sm text-gray-600 mt-2">
                                {request.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(request.response_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <p className="text-gray-600">Select a course to manage content and students.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;