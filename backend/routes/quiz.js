const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Create a new quiz (teacher only)
router.post('/courses/:courseId/quizzes', authenticateToken, (req, res) => {
  const { courseId } = req.params;
  const { title, description, questions } = req.body;
  const teacherId = req.user.id;
  
  console.log('Quiz creation request received:');
  console.log('Course ID:', courseId);
  console.log('Teacher ID:', teacherId);
  console.log('Title:', title);
  console.log('Questions count:', questions ? questions.length : 0);

  // First verify that the user is a teacher and has access to this course
  db.get(
    'SELECT * FROM courses WHERE id = ? AND teacher_id = ?',
    [courseId, teacherId],
    (err, course) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to verify course access' });
      }
      if (!course) {
        return res.status(403).json({ error: 'You do not have permission to create quizzes for this course' });
      }

      // Proceed with quiz creation
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          'INSERT INTO quizzes (course_id, title, description, created_at) VALUES (?, ?, ?, datetime("now"))',
          [courseId, title, description],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to create quiz' });
            }

            const quizId = this.lastID;
            let completed = 0;

            questions.forEach(question => {
              db.run(
                'INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  quizId,
                  question.question,
                  question.optionA,
                  question.optionB,
                  question.optionC,
                  question.optionD,
                  question.correctAnswer
                ],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to add questions' });
                  }
                  completed++;
                  if (completed === questions.length) {
                    db.run('COMMIT');
                    res.json({ message: 'Quiz created successfully', quizId });
                  }
                }
              );
            });
          }
        );
      });
    }
  );
});

// Get all quizzes for a course
router.get('/courses/:courseId/quizzes', authenticateToken, (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  db.all(
    `SELECT q.*, 
     CASE WHEN qa.id IS NOT NULL THEN 1 ELSE 0 END as attempted,
     qa.score as attempt_score
     FROM quizzes q
     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
     WHERE q.course_id = ?`,
    [userId, courseId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch quizzes' });
      }
      res.json({ quizzes: rows });
    }
  );
});

// Get quiz details with questions
router.get('/quizzes/:quizId', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId],
    (err, quiz) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch quiz' });
      }
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      db.all(
        'SELECT * FROM quiz_questions WHERE quiz_id = ?',
        [quizId],
        (err, questions) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch questions' });
          }

          // Check if student has already attempted the quiz
          db.get(
            'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
            [quizId, userId],
            (err, attempt) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch attempt' });
              }

              // For attempted quizzes, we keep the correct answers so they can be displayed
              // but for unattempted quizzes, we remove them
              if (!attempt) {
                questions = questions.map(q => ({
                  ...q,
                  correct_answer: undefined
                }));
              }

              res.json({
                quiz,
                questions,
                attempt
              });
            }
          );
        }
      );
    }
  );
});

// Submit quiz attempt
router.post('/quizzes/:quizId/submit', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;
  const studentId = req.user.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get quiz questions and correct answers
    db.all(
      'SELECT * FROM quiz_questions WHERE quiz_id = ?',
      [quizId],
      (err, questions) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        // Calculate score
        let score = 0;
        questions.forEach(question => {
          if (answers[question.id] === question.correct_answer) {
            score++;
          }
        });

        // Save attempt
        db.run(
          `INSERT INTO quiz_attempts 
           (student_id, quiz_id, score, total_questions, answers, submitted_at)
           VALUES (?, ?, ?, ?, ?, datetime("now"))`,
          [studentId, quizId, score, questions.length, JSON.stringify(answers)],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to save attempt' });
            }

            db.run('COMMIT');
            res.json({
              message: 'Quiz submitted successfully',
              score,
              totalQuestions: questions.length
            });
          }
        );
      }
    );
  });
});

// Get quiz with all questions (for teachers)
router.get('/quizzes/:quizId/teacher', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const teacherId = req.user.id;

  // First verify the teacher owns this quiz's course
  db.get(
    `SELECT q.*, c.teacher_id FROM quizzes q
     JOIN courses c ON q.course_id = c.id
     WHERE q.id = ?`,
    [quizId],
    (err, quiz) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch quiz' });
      }
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      if (quiz.teacher_id !== teacherId) {
        return res.status(403).json({ error: 'Not authorized to access this quiz' });
      }

      // Get all questions with answers
      db.all(
        'SELECT * FROM quiz_questions WHERE quiz_id = ?',
        [quizId],
        (err, questions) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch questions' });
          }

          res.json({
            quiz,
            questions
          });
        }
      );
    }
  );
});

// Get all attempts for a quiz (teachers only)
router.get('/quizzes/:quizId/attempts', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const teacherId = req.user.id;

  // First verify the teacher owns this quiz's course
  db.get(
    `SELECT c.teacher_id FROM quizzes q
     JOIN courses c ON q.course_id = c.id
     WHERE q.id = ?`,
    [quizId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to verify quiz ownership' });
      }
      if (!result) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      if (result.teacher_id !== teacherId) {
        return res.status(403).json({ error: 'Not authorized to access this quiz' });
      }

      // Get all attempts with student names
      db.all(
        `SELECT qa.*, u.name as student_name
         FROM quiz_attempts qa
         JOIN users u ON qa.student_id = u.id
         WHERE qa.quiz_id = ?
         ORDER BY qa.submitted_at DESC`,
        [quizId],
        (err, attempts) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch attempts' });
          }

          res.json({ attempts });
        }
      );
    }
  );
});

module.exports = router; 