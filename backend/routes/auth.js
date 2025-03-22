const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret'; // Replace with a secure secret (or use an environment variable)

// Registration endpoint (for both teacher and student)
router.post('/register', (req, res) => {
  const { username, password, role, name, courses } = req.body;
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Error hashing password' });
    const stmt = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
    stmt.run(username, hash, role, name, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error registering user' });
      }
      const userId = this.lastID;
      // For teachers, insert their courses into the courses table
      if (role === 'teacher' && courses && Array.isArray(courses)) {
        const courseStmt = db.prepare('INSERT INTO courses (title, teacher_id) VALUES (?, ?)');
        courses.forEach(courseTitle => {
          courseStmt.run(courseTitle, userId);
        });
      }
      res.json({ message: 'User registered successfully' });
    });
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing credentials' });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user)
      return res.status(400).json({ error: 'Invalid username or password' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, userId: user.id });
      } else {
        res.status(400).json({ error: 'Invalid username or password' });
      }
    });
  });
});

module.exports = router;
