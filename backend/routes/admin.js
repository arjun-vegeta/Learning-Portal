const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret'; // Replace with a secure secret

// Middleware to verify JWT and that the user is an admin
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  next();
}

// Get all teachers with their courses
router.get('/teachers', verifyToken, isAdmin, (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.username, 
      (SELECT json_group_array(json_object('id', c.id, 'title', c.title))
       FROM courses c WHERE c.teacher_id = u.id) as courses
     FROM users u WHERE u.role = 'teacher'`,
    (err, teachers) => {
      if (err) return res.status(500).json({ error: 'Error fetching teachers' });
      res.json({ teachers });
    }
  );
});

// Get all students with their registered courses and streaks
router.get('/students', verifyToken, isAdmin, (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.username,
      (SELECT json_group_array(json_object('courseId', c.id, 'title', c.title, 'streak', sc.streak))
       FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = u.id) as courses
     FROM users u WHERE u.role = 'student'`,
    (err, students) => {
      if (err) return res.status(500).json({ error: 'Error fetching students' });
      res.json({ students });
    }
  );
});

// Delete a user (teacher or student)
router.delete('/user/:userId', verifyToken, isAdmin, (req, res) => {
  const userId = req.params.userId;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: 'Error deleting user' });
    res.json({ message: 'User deleted successfully' });
  });
});

// Add a new user (teacher or student)
router.post('/user', verifyToken, isAdmin, (req, res) => {
  const { username, password, role, name, courses } = req.body;
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Error hashing password' });
    const stmt = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
    stmt.run(username, hash, role, name, function(err) {
      if (err) return res.status(500).json({ error: 'Error adding user' });
      const userId = this.lastID;
      // If teacher, add courses if provided
      if (role === 'teacher' && courses && Array.isArray(courses)) {
        const courseStmt = db.prepare('INSERT INTO courses (title, teacher_id) VALUES (?, ?)');
        courses.forEach(courseTitle => {
          courseStmt.run(courseTitle, userId);
        });
      }
      res.json({ message: 'User added successfully' });
    });
  });
});

module.exports = router;
