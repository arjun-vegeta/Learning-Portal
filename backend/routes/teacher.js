const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret';

// Middleware to verify JWT and that the user is a teacher
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
}

function isTeacher(req, res, next) {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });
  next();
}

// Set up Multer storage for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/lectures'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const videoUpload = multer({ storage: videoStorage });

// Set up Multer storage for note uploads
const noteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/notes'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const noteUpload = multer({ storage: noteStorage });

// Get teacher information
router.get('/info', verifyToken, isTeacher, (req, res) => {
  const teacherId = req.user.id;
  db.get('SELECT id, username, name FROM users WHERE id = ?', [teacherId], (err, teacher) => {
    if (err) return res.status(500).json({ error: 'Error fetching teacher information' });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ name: teacher.name });
  });
});

// Get courses for the logged‑in teacher
router.get('/courses', verifyToken, isTeacher, (req, res) => {
  const teacherId = req.user.id;
  db.all('SELECT * FROM courses WHERE teacher_id = ?', [teacherId], (err, courses) => {
    if (err) return res.status(500).json({ error: 'Error fetching courses' });
    res.json({ courses });
  });
});

// Upload a lecture (video)
router.post('/courses/:courseId/lecture', verifyToken, isTeacher, videoUpload.single('video'), (req, res) => {
  const courseId = req.params.courseId;
  const { title } = req.body;
  if (!req.file || !title) {
    return res.status(400).json({ error: 'Missing video file or title' });
  }
  const videoPath = '/uploads/lectures/' + req.file.filename;
  const uploadDate = new Date().toISOString();
  db.run(
    'INSERT INTO lectures (course_id, title, video_path, upload_date) VALUES (?, ?, ?, ?)',
    [courseId, title, videoPath, uploadDate],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error uploading lecture' });
      res.json({ message: 'Lecture uploaded successfully' });
    }
  );
});

// Upload a note (document)
router.post('/courses/:courseId/note', verifyToken, isTeacher, noteUpload.single('note'), (req, res) => {
  const courseId = req.params.courseId;
  const { title } = req.body;
  if (!req.file || !title) {
    return res.status(400).json({ error: 'Missing note file or title' });
  }
  const filePath = '/uploads/notes/' + req.file.filename;
  const uploadDate = new Date().toISOString();
  db.run(
    'INSERT INTO notes (course_id, title, file_path, upload_date) VALUES (?, ?, ?, ?)',
    [courseId, title, filePath, uploadDate],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error uploading note' });
      res.json({ message: 'Note uploaded successfully' });
    }
  );
});

// Get lectures for a course (teacher view)
router.get('/courses/:courseId/lectures', verifyToken, isTeacher, (req, res) => {
  const courseId = req.params.courseId;
  db.all('SELECT * FROM lectures WHERE course_id = ?', [courseId], (err, lectures) => {
    if (err) return res.status(500).json({ error: 'Error fetching lectures' });
    res.json({ lectures });
  });
});

// Get notes for a course (teacher view)
router.get('/courses/:courseId/notes', verifyToken, isTeacher, (req, res) => {
  const courseId = req.params.courseId;
  db.all('SELECT * FROM notes WHERE course_id = ?', [courseId], (err, notes) => {
    if (err) return res.status(500).json({ error: 'Error fetching notes' });
    res.json({ notes });
  });
});

// Get students registered for a course along with their streaks (teacher view)
router.get('/courses/:courseId/students', verifyToken, isTeacher, (req, res) => {
  const courseId = req.params.courseId;
  db.all('SELECT u.id, u.name, sc.streak FROM student_courses sc JOIN users u ON sc.student_id = u.id WHERE sc.course_id = ?', [courseId], (err, students) => {
    if (err) return res.status(500).json({ error: 'Error fetching students' });
    res.json({ students });
  });
});

// Get enrollment requests for teacher's courses
router.get('/enrollment-requests', verifyToken, isTeacher, (req, res) => {
  const teacherId = req.user.id;
  db.all(
    `SELECT er.*, c.title as courseTitle, u.name as studentName 
     FROM enrollment_requests er
     JOIN courses c ON er.course_id = c.id
     JOIN users u ON er.student_id = u.id
     WHERE c.teacher_id = ?
     ORDER BY er.request_date DESC`,
    [teacherId],
    (err, requests) => {
      if (err) return res.status(500).json({ error: 'Error fetching enrollment requests' });
      res.json({ requests });
    }
  );
});

// Handle enrollment request (approve/reject)
router.post('/enrollment-requests/:requestId', verifyToken, isTeacher, (req, res) => {
  const requestId = req.params.requestId;
  const { status } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // First verify the request belongs to the teacher's course
  db.get(
    `SELECT er.* FROM enrollment_requests er
     JOIN courses c ON er.course_id = c.id
     WHERE er.id = ? AND c.teacher_id = ? AND er.status = ?`,
    [requestId, req.user.id, 'pending'],
    (err, request) => {
      if (err || !request) {
        return res.status(404).json({ error: 'Request not found or already processed' });
      }
      
      const responseDate = new Date().toISOString();
      
      // Update request status
      db.run(
        'UPDATE enrollment_requests SET status = ?, response_date = ? WHERE id = ?',
        [status, responseDate, requestId],
        function (err) {
          if (err) return res.status(500).json({ error: 'Error updating request status' });
          
          // If approved, add student to the course
          if (status === 'approved') {
            db.run(
              'INSERT INTO student_courses (student_id, course_id, streak, last_watch_date) VALUES (?, ?, 0, NULL)',
              [request.student_id, request.course_id],
              function (err) {
                if (err) return res.status(500).json({ error: 'Error enrolling student' });
                res.json({ message: 'Request processed successfully' });
              }
            );
          } else {
            res.json({ message: 'Request processed successfully' });
          }
        }
      );
    }
  );
});

module.exports = router;
