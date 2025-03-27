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

// Get student information
router.get('/info', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  db.get('SELECT id, username, name FROM users WHERE id = ?', [studentId], (err, student) => {
    if (err) return res.status(500).json({ error: 'Error fetching student information' });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ name: student.name });
  });
});

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
      
      // Check if there's already a pending request
      db.get(
        'SELECT * FROM enrollment_requests WHERE student_id = ? AND course_id = ? AND status = ?',
        [studentId, courseId, 'pending'],
        (err, request) => {
          if (request) return res.status(400).json({ error: 'Request already pending' });
          
          // Create new enrollment request
          const requestDate = new Date().toISOString();
          db.run(
            'INSERT INTO enrollment_requests (student_id, course_id, request_date) VALUES (?, ?, ?)',
            [studentId, courseId, requestDate],
            function (err) {
              if (err) return res.status(500).json({ error: 'Error creating enrollment request' });
              res.json({ message: 'Enrollment request submitted successfully' });
            }
          );
        }
      );
    }
  );
});

// Get enrollment requests status for a student
router.get('/enrollment-requests', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  db.all(
    `SELECT er.*, c.title as courseTitle, u.name as teacherName 
     FROM enrollment_requests er
     JOIN courses c ON er.course_id = c.id
     JOIN users u ON c.teacher_id = u.id
     WHERE er.student_id = ?
     ORDER BY er.request_date DESC`,
    [studentId],
    (err, requests) => {
      if (err) return res.status(500).json({ error: 'Error fetching enrollment requests' });
      res.json({ requests });
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
  
  // First check if student has watched any course today
  db.get(
    'SELECT watch_date FROM watch_history WHERE student_id = ? AND watch_date = ?',
    [studentId, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error checking watch history' });
      
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
              
              // Update course-specific streak
              db.run(
                'UPDATE student_courses SET streak = ?, last_watch_date = ? WHERE student_id = ? AND course_id = ?',
                [newStreak, today, studentId, courseId],
                function (err) {
                  if (err) return res.status(500).json({ error: 'Error updating streak' });
                  
                  // If this is the first course watched today, update all course streaks
                  if (!row) {
                    db.all(
                      'SELECT course_id FROM student_courses WHERE student_id = ?',
                      [studentId],
                      (err, courses) => {
                        if (err) return res.status(500).json({ error: 'Error updating overall streak' });
                        
                        // Update streak for all courses
                        courses.forEach(course => {
                          db.run(
                            'UPDATE student_courses SET streak = streak + 1, last_watch_date = ? WHERE student_id = ? AND course_id = ?',
                            [today, studentId, course.course_id]
                          );
                        });
                        
                        res.json({ 
                          message: 'Watch recorded and streak updated', 
                          streak: newStreak,
                          overallStreak: newStreak 
                        });
                      }
                    );
                  } else {
                    res.json({ 
                      message: 'Watch recorded and streak updated', 
                      streak: newStreak,
                      overallStreak: newStreak 
                    });
                  }
                }
              );
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
          res.json({ 
            lectures, 
            notes, 
            streak: courseData ? courseData.streak : 0,
            studentId
          });
        }
      );
    });
  });
});

// Get other students registered for a course along with their streaks (student view)
router.get('/courses/:courseId/students', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;
  
  // First get the current student's streak
  db.get(
    `SELECT u.id, u.name, sc.streak 
     FROM student_courses sc 
     JOIN users u ON sc.student_id = u.id 
     WHERE sc.course_id = ? AND u.id = ?`,
    [courseId, studentId],
    (err, currentStudent) => {
      if (err) return res.status(500).json({ error: 'Error fetching current student data' });
      
      // Then get all other students
      db.all(
        `SELECT u.id, u.name, sc.streak 
         FROM student_courses sc 
         JOIN users u ON sc.student_id = u.id 
         WHERE sc.course_id = ? AND u.id != ?
         ORDER BY sc.streak DESC`,
        [courseId, studentId],
        (err, otherStudents) => {
          if (err) return res.status(500).json({ error: 'Error fetching student streaks' });
          
          // Combine and sort all students by streak
          const allStudents = currentStudent ? [currentStudent, ...otherStudents] : otherStudents;
          allStudents.sort((a, b) => b.streak - a.streak);
          
          res.json({ students: allStudents });
        }
      );
    }
  );
});

// Get overall leaderboard data
router.get('/leaderboard', verifyToken, isStudent, (req, res) => {
  db.all(
    `SELECT u.id, u.name,
      (SELECT MAX(streak) FROM student_courses WHERE student_id = u.id) as current_streak,
      (SELECT COUNT(*) FROM student_courses WHERE student_id = u.id) as total_courses
     FROM users u 
     WHERE u.role = 'student'
     ORDER BY current_streak DESC
     LIMIT 10`,
    (err, students) => {
      if (err) return res.status(500).json({ error: 'Error fetching leaderboard data' });
      res.json({ students });
    }
  );
});

// Get a single course with details
router.get('/courses/:courseId', verifyToken, isStudent, (req, res) => {
  const courseId = req.params.courseId;
  db.get(
    `SELECT courses.*, users.name as teacherName 
     FROM courses 
     JOIN users ON courses.teacher_id = users.id 
     WHERE courses.id = ?`,
    [courseId],
    (err, course) => {
      if (err) return res.status(500).json({ error: 'Error fetching course' });
      if (!course) return res.status(404).json({ error: 'Course not found' });
      res.json({ course });
    }
  );
});

// Update lecture watch progress
router.post('/lectures/:lectureId/progress', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const lectureId = req.params.lectureId;
  const { progress } = req.body;
  const lastWatchedAt = new Date().toISOString();

  // First check if progress exists
  db.get(
    'SELECT * FROM lecture_watch_progress WHERE student_id = ? AND lecture_id = ?',
    [studentId, lectureId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error checking progress' });

      if (row) {
        // Update existing progress
        db.run(
          'UPDATE lecture_watch_progress SET progress = ?, last_watched_at = ? WHERE student_id = ? AND lecture_id = ?',
          [progress, lastWatchedAt, studentId, lectureId],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error updating progress' });
            res.json({ message: 'Progress updated successfully' });
          }
        );
      } else {
        // Insert new progress
        db.run(
          'INSERT INTO lecture_watch_progress (student_id, lecture_id, progress, last_watched_at) VALUES (?, ?, ?, ?)',
          [studentId, lectureId, progress, lastWatchedAt],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error saving progress' });
            res.json({ message: 'Progress saved successfully' });
          }
        );
      }
    }
  );
});

// Get lecture watch progress for a course
router.get('/courses/:courseId/progress', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;

  db.all(
    `SELECT l.id as lecture_id, lwp.progress, lwp.last_watched_at 
     FROM lectures l 
     LEFT JOIN lecture_watch_progress lwp ON l.id = lwp.lecture_id AND lwp.student_id = ?
     WHERE l.course_id = ?`,
    [studentId, courseId],
    (err, progress) => {
      if (err) return res.status(500).json({ error: 'Error fetching progress' });
      res.json({ progress });
    }
  );
});

// Mark a note as viewed
router.post('/notes/:noteId/view', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const noteId = req.params.noteId;
  const lastViewedAt = new Date().toISOString();

  // First check if view progress exists
  db.get(
    'SELECT * FROM note_view_progress WHERE student_id = ? AND note_id = ?',
    [studentId, noteId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error checking view progress' });

      if (row) {
        // Update existing progress
        db.run(
          'UPDATE note_view_progress SET viewed = 1, last_viewed_at = ? WHERE student_id = ? AND note_id = ?',
          [lastViewedAt, studentId, noteId],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error updating view progress' });
            res.json({ message: 'Note marked as viewed' });
          }
        );
      } else {
        // Insert new progress
        db.run(
          'INSERT INTO note_view_progress (student_id, note_id, viewed, last_viewed_at) VALUES (?, ?, 1, ?)',
          [studentId, noteId, lastViewedAt],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error saving view progress' });
            res.json({ message: 'Note marked as viewed' });
          }
        );
      }
    }
  );
});

// Get note view progress for a course
router.get('/courses/:courseId/note-progress', verifyToken, isStudent, (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;

  db.all(
    `SELECT n.id as note_id, nvp.viewed, nvp.last_viewed_at 
     FROM notes n 
     LEFT JOIN note_view_progress nvp ON n.id = nvp.note_id AND nvp.student_id = ?
     WHERE n.course_id = ?`,
    [studentId, courseId],
    (err, progress) => {
      if (err) return res.status(500).json({ error: 'Error fetching note progress' });
      res.json({ progress });
    }
  );
});

module.exports = router;
