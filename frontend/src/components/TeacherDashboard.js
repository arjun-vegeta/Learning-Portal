import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiVideo, FiFileText, FiUsers, FiBook, FiChevronRight } from 'react-icons/fi';

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

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('upload'); 
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureFile, setLectureFile] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [uploads, setUploads] = useState({ lectures: [], notes: [] });
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
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
  }, [token]);

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
      const [lecturesRes, notesRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/teacher/courses/${selectedCourse.id}/lectures`, {
          headers: { authorization: token },
        }),
        axios.get(`http://localhost:5001/api/teacher/courses/${selectedCourse.id}/notes`, {
          headers: { authorization: token },
        }),
      ]);
      setUploads({ lectures: lecturesRes.data.lectures, notes: notesRes.data.notes });
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
    setViewMode('upload');
    setMessage('');
    setUploads({ lectures: [], notes: [] });
    setStudents([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <FiBook className="mr-2 text-blue-500" />
          Teacher Dashboard
        </h1>

        {message && <Message type={message.includes('Error') ? 'error' : 'success'}>{message}</Message>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Courses List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <SectionHeader icon={<FiBook className="text-blue-500" />} title="Your Courses" />
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedCourse?.id === course.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium text-gray-800">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.studentCount || 0} students</p>
                  </div>
                ))}
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
                      onClick={() => {
                        setViewMode('upload');
                        setMessage('');
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        viewMode === 'upload'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <FiUploadCloud className="mr-2" /> Upload
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('uploads');
                        fetchUploads();
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        viewMode === 'uploads'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <FiFileText className="mr-2" /> Content
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('students');
                        fetchStudents();
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        viewMode === 'students'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <FiUsers className="mr-2" /> Students
                    </button>
                  </div>
                </div>

                {viewMode === 'upload' && (
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
                )}

                {viewMode === 'uploads' && (
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
                  </div>
                )}

                {viewMode === 'students' && (
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="font-medium mb-4 flex items-center">
                      <FiUsers className="mr-2 text-purple-500" /> Students Registered
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {students.map((student) => (
                        <div key={student.id} className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">Streak: {student.streak}</p>
                        </div>
                      ))}
                    </div>
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