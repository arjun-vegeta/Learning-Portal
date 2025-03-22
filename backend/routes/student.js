const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret';

// Middleware to verify JWT and that the user is a student
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
}

function isStudent(req, res, next) {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  next();
}

// Get all courses (for registration view)
router.get('/courses', verifyToken, isStudent, (req, res) => {
  db.all(
    'SELECT courses.*, users.name as teacherName FROM courses JOIN users ON courses.teacher_id = users.id',
    (err, courses) => {
      if (err) return res.status(500).json({ error: 'Error fetching courses' });
      res.json({ courses });
    }
  );
});

// Get courses the student is registered in (with streak info)
// Get courses the student is registered in (with streak info and teacher name)
router.get('/my-courses', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  db.all(
    `SELECT sc.*, courses.title, courses.id as id, u.name as teacherName
     FROM student_courses sc
     JOIN courses ON sc.course_id = courses.id
     JOIN users u ON courses.teacher_id = u.id
     WHERE sc.student_id = ?`,
    [studentId],
    (err, courses) => {
      if (err) return res.status(500).json({ error: 'Error fetching your courses' });
      res.json({ courses });
    }
  );
});


// Register for a course
router.post('/courses/register', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.body;
  // Check if already registered
  db.get(
    'SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?',
    [studentId, courseId],
    (err, row) => {
      if (row) return res.status(400).json({ error: 'Already registered' });
      db.run(
        'INSERT INTO student_courses (student_id, course_id, streak, last_watch_date) VALUES (?, ?, 0, NULL)',
        [studentId, courseId],
        function (err) {
          if (err) return res.status(500).json({ error: 'Error registering for course' });
          res.json({ message: 'Registered for course successfully' });
        }
      );
    }
  );
});

// Drop a course
router.post('/courses/drop', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.body;
  db.run(
    'DELETE FROM student_courses WHERE student_id = ? AND course_id = ?',
    [studentId, courseId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error dropping course' });
      res.json({ message: 'Dropped course successfully' });
    }
  );
});

// Mark a lecture watch (update streak)
router.post('/courses/:courseId/watch', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;
  const today = new Date().toISOString().slice(0, 10);
  // Record watch history
  db.run(
    'INSERT INTO watch_history (student_id, course_id, watch_date) VALUES (?, ?, ?)',
    [studentId, courseId, today],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error recording watch history' });
      // Update streak in student_courses table
      db.get(
        'SELECT streak, last_watch_date FROM student_courses WHERE student_id = ? AND course_id = ?',
        [studentId, courseId],
        (err, row) => {
          if (err || !row)
            return res.status(500).json({ error: 'Error updating streak' });
          let newStreak = 1;
          if (row.last_watch_date) {
            const lastDate = new Date(row.last_watch_date);
            const currentDate = new Date(today);
            const diffTime = currentDate - lastDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
              newStreak = row.streak + 1;
            }
          }
          db.run(
            'UPDATE student_courses SET streak = ?, last_watch_date = ? WHERE student_id = ? AND course_id = ?',
            [newStreak, today, studentId, courseId],
            function (err) {
              if (err) return res.status(500).json({ error: 'Error updating streak' });
              res.json({ message: 'Watch recorded and streak updated', streak: newStreak });
            }
          );
        }
      );
    }
  );
});

// Get course details (lectures, notes, and current streak for that student)
router.get('/courses/:courseId/details', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;
  db.all('SELECT * FROM lectures WHERE course_id = ?', [courseId], (err, lectures) => {
    if (err) return res.status(500).json({ error: 'Error fetching lectures' });
    db.all('SELECT * FROM notes WHERE course_id = ?', [courseId], (err, notes) => {
      if (err) return res.status(500).json({ error: 'Error fetching notes' });
      db.get(
        'SELECT streak FROM student_courses WHERE student_id = ? AND course_id = ?',
        [studentId, courseId],
        (err, courseData) => {
          if (err) return res.status(500).json({ error: 'Error fetching streak data' });
          res.json({ lectures, notes, streak: courseData ? courseData.streak : 0 });
        }
      );
    });
  });
});

// Get other students registered for a course along with their streaks (student view)
router.get('/courses/:courseId/students', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;
  db.all('SELECT u.id, u.name, sc.streak FROM student_courses sc JOIN users u ON sc.student_id = u.id WHERE sc.course_id = ? AND u.id != ?', [courseId, studentId], (err, students) => {
    if (err) return res.status(500).json({ error: 'Error fetching student streaks' });
    res.json({ students });
  });
});

module.exports = router;
