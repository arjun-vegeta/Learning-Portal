import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FiBook, FiUsers, FiVideo, FiFileText, FiTrendingUp, 
  FiEye, FiXCircle, FiPlusCircle, FiChevronDown, FiChevronUp, FiClock, FiInbox, FiRefreshCw, FiCheck, FiAward
} from 'react-icons/fi';
import { usePomodoroTimer } from './PomodoroContext';

// common comps
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lectures');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [peerStreaks, setPeerStreaks] = useState([]);
  const [availableExpanded, setAvailableExpanded] = useState(false);
  const [enrollmentRequestsExpanded, setEnrollmentRequestsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  
  // Use the Pomodoro context instead of local state
  const { PomodoroButton } = usePomodoroTimer();
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStudentInfo();
    fetchAvailableCourses();
    fetchMyCourses();
    fetchLeaderboard();
    fetchEnrollmentRequests();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/student/info', {
        headers: { authorization: token },
      });
      setStudentName(res.data.name);
    } catch (err) {
      console.error('Error fetching student info:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/student/courses', {
        headers: { authorization: token },
      });
      setAvailableCourses(res.data.courses);
    } catch (err) {
      setError('Failed to fetch available courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/student/my-courses', {
        headers: { authorization: token },
      });
      setMyCourses(res.data.courses);
    } catch (err) {
      setError('Failed to fetch your courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/student/leaderboard', {
        headers: { authorization: token },
      });
      setLeaderboardData(res.data.students);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const fetchEnrollmentRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/student/enrollment-requests', {
        headers: { authorization: token },
      });
      setEnrollmentRequests(res.data.requests);
    } catch (err) {
      console.error('Error fetching enrollment requests:', err);
    }
  };

  const registerCourse = async (courseId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/student/courses/register',
        { courseId },
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchEnrollmentRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error submitting request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dropCourse = async (courseId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/student/courses/drop',
        { courseId },
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchMyCourses();
    } catch (err) {
      setMessage('Error dropping course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewCourseDetails = (course) => {
    navigate(`/course/${course.id}`);
  };

  const markWatch = async (courseId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/student/courses/${courseId}/watch`,
        {},
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchMyCourses();
      if (selectedCourseDetails && selectedCourseDetails.id === courseId) {
        viewCourseDetails(selectedCourseDetails);
      }
    } catch (err) {
      setMessage('Error marking watch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall streak based on watch history
  const overallStreak = myCourses.reduce((max, course) => {
    const courseStreak = course.streak || 0;
    return Math.max(max, courseStreak);
  }, 0);

  // Sort available courses to show enrolled courses first
  const sortedAvailableCourses = [...availableCourses].sort((b, a) => {
    const aEnrolled = myCourses.some(course => course.id === a.id);
    const bEnrolled = myCourses.some(course => course.id === b.id);
    if (aEnrolled === bEnrolled) return 0;
    return aEnrolled ? -1 : 1;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {studentName}!</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* My Courses Box */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-0">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FiBook className="mr-2 text-blue-500" />
                  Student Dashboard
                </h1>
                <div className="flex items-center gap-3">
                  <PomodoroButton />
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-blue-600 font-semibold">Overall Streak: {overallStreak} 🔥</span>
                  </div>
                </div>
              </div>
              </div>

              <div className="bg-white rounded-xl p-0 shadow-sm">
              {message && <Message type={message.includes('Error') ? 'error' : 'success'}>{message}</Message>}
              {error && <Message type="error">{error}</Message>}
              {loading && <p className="text-blue-500">Loading...</p>}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <SectionHeader icon={<FiUsers className="text-green-500" />} title="My Courses" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCourses.map((course) => (
                  <div key={course.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Taught by {course.teacherName}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">🔥 {course.streak}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => viewCourseDetails(course)}
                        className="text-sm bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 flex items-center"
                      >
                        <FiEye className="mr-1" /> View
                      </button>
                      <button
                        onClick={() => dropCourse(course.id)}
                        className="text-sm bg-white border border-red-200 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 flex items-center"
                      >
                        <FiXCircle className="mr-1" /> Drop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Courses Sidebar (Collapsible) */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setAvailableExpanded(!availableExpanded)}>
                <div className="flex items-center">
                  <FiPlusCircle className="text-purple-500" />
                  <h2 className="text-xl font-semibold ml-2">Available Courses</h2>
                </div>
                {availableExpanded ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
              </div>
              {availableExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {sortedAvailableCourses.map((course) => {
                    const isEnrolled = myCourses.some(myCourse => myCourse.id === course.id);
                    const pendingRequest = enrollmentRequests.find(
                      req => req.course_id === course.id && req.status === 'pending'
                    );
                    const rejectedRequest = enrollmentRequests.find(
                      req => req.course_id === course.id && req.status === 'rejected'
                    );

                    return (
                      <div key={course.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">Taught by {course.teacherName || 'Unknown'}</p>
                          </div>
                          {isEnrolled ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              <FiCheck className="inline mr-1" /> Enrolled
                            </span>
                          ) : pendingRequest ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                              <FiClock className="inline mr-1" /> Pending
                            </span>
                          ) : rejectedRequest ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                              <FiXCircle className="inline mr-1" /> Rejected
                            </span>
                          ) : (
                            <button
                              onClick={() => registerCourse(course.id)}
                              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex items-center"
                            >
                              <FiPlusCircle className="mr-1" /> Enroll
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {rejectedRequest && (
                            <button
                              onClick={() => registerCourse(course.id)}
                              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex items-center"
                            >
                              <FiRefreshCw className="mr-1" /> Apply Again
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Enrollment Requests Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setEnrollmentRequestsExpanded(!enrollmentRequestsExpanded)}>
                <div className="flex items-center">
                  <FiInbox className="text-blue-500" />
                  <h2 className="text-xl font-semibold ml-2">Enrollment Requests</h2>
                </div>
                {enrollmentRequestsExpanded ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
              </div>
              {enrollmentRequestsExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {enrollmentRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 col-span-2">No enrollment requests</p>
                  ) : (
                    enrollmentRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{request.courseTitle}</h3>
                            <p className="text-sm text-gray-600 mt-2">Requested on {new Date(request.request_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-sm ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        {request.response_date && (
                          <p className="text-sm text-gray-600 mt-1">
                            {request.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(request.response_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Course Content Box */}
            {selectedCourseDetails && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedCourseDetails.title} Course Content
                    </h2>
                    <p className="text-sm text-gray-600">
                      Taught by {selectedCourseDetails.teacherName}
                    </p>
                  </div>
                  <button
                    onClick={() => markWatch(selectedCourseDetails.id)}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center"
                  >
                    <FiTrendingUp className="mr-2" /> Mark as Watched
                  </button>
                </div>

                <div className="border-b border-gray-200 mb-4">
                  <div className="flex space-x-4">
                    <button
                      className={`pb-2 px-1 ${activeTab === 'lectures' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('lectures')}
                    >
                      Lectures
                    </button>
                    <button
                      className={`pb-2 px-1 ${activeTab === 'notes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('notes')}
                    >
                      Notes
                    </button>
                    <button
                      className={`pb-2 px-1 ${activeTab === 'peers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('peers')}
                    >
                      Classmates
                    </button>
                  </div>
                </div>

                {activeTab === 'lectures' && (
                  <div className="space-y-3">
                    {selectedCourseDetails.lectures.map((lec) => (
                      <div key={lec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{lec.title}</h4>
                          <p className="text-sm text-gray-500">{new Date(lec.upload_date).toLocaleDateString()}</p>
                        </div>
                        <a
                          href={`http://localhost:5001${lec.video_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <FiVideo className="mr-1" /> Watch
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    {selectedCourseDetails.notes.map((note) => (
                      <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{note.title}</h4>
                          <p className="text-sm text-gray-500">{new Date(note.upload_date).toLocaleDateString()}</p>
                        </div>
                        <a
                          href={`http://localhost:5001${note.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <FiFileText className="mr-1" /> View
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'peers' && (
                  <div>
                    {peerStreaks.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {peerStreaks.map((peer) => (
                          <div key={peer.id} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium">{peer.name}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-500">Streak:</span>
                              <span className="ml-2 text-orange-600 font-medium">{peer.streak}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No other students enrolled.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Streaks Sidebar */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <SectionHeader icon={<FiTrendingUp className="text-orange-500" />} title="Streak Progress" />
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Overall Streak</p>
                  <p className="text-2xl font-bold text-blue-600">{overallStreak} Days 🔥</p>
                </div>
                {myCourses.map((course) => (
                  <div key={course.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">{course.title}</p>
                      <span className="text-orange-600 font-semibold">{course.streak} 🔥</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${(course.streak / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <SectionHeader icon={<FiAward className="text-yellow-500" />} title="Global Leaderboard" />
              <div className="space-y-4">
                {leaderboardData.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.total_courses} courses</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-orange-600 font-semibold">{student.current_streak}</span>
                      <span className="ml-1">🔥</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
