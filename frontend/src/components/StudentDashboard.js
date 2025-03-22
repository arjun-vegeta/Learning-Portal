import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FiBook, FiUsers, FiVideo, FiFileText, FiTrendingUp, 
  FiEye, FiXCircle, FiPlusCircle, FiChevronDown, FiChevronUp 
} from 'react-icons/fi';

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
  const [activeTab, setActiveTab] = useState('lectures');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [peerStreaks, setPeerStreaks] = useState([]);
  const [availableExpanded, setAvailableExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAvailableCourses();
    fetchMyCourses();
  }, []);

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

  const registerCourse = async (courseId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/student/courses/register',
        { courseId },
        { headers: { authorization: token } }
      );
      setMessage(res.data.message);
      fetchMyCourses();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error registering');
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

  const viewCourseDetails = async (course) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/student/courses/${course.id}/details`, {
        headers: { authorization: token },
      });
      setSelectedCourseDetails({ ...course, ...res.data });
      const peerRes = await axios.get(`http://localhost:5001/api/student/courses/${course.id}/students`, {
        headers: { authorization: token },
      });
      setPeerStreaks(peerRes.data.students);
    } catch (err) {
      setError('Failed to fetch course details');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const overallStreak = myCourses.reduce((max, course) => Math.max(max, course.streak), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* My Courses Box */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-0">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiBook className="mr-2 text-blue-500" />
                Student Dashboard
              </h1>
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold">Overall Streak: {overallStreak} 🔥</span>
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
                <p className="text-2xl font-bold text-blue-600">{overallStreak} Days</p>
              </div>
              {myCourses.map((course) => (
                <div key={course.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{course.title}</p>
                    <span className="text-orange-600 font-semibold">{course.streak}</span>
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

          {/* Available Courses Sidebar (Collapsible) */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setAvailableExpanded(!availableExpanded)}>
              <SectionHeader icon={<FiPlusCircle className="text-purple-500" />} title="Available Courses" />
              {availableExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {availableExpanded && (
              <div className="space-y-4 mt-4">
                {availableCourses.map((course) => (
                  <div key={course.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-800">{course.title}</h3>
                      <p className="text-sm text-gray-600">Taught by {course.teacherName || 'Unknown'}</p>
                    </div>
                    <button
                      onClick={() => registerCourse(course.id)}
                      className="mt-3 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex items-center"
                    >
                      <FiPlusCircle className="mr-1" /> Enroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
