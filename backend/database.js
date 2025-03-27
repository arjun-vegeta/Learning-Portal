const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else { 
    console.log('Connected to SQLite database');
  }
});      
      
// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    )
  `);

  // Courses table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      teacher_id INTEGER,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    )
  `);

  // Lectures table
  db.run(`
    CREATE TABLE IF NOT EXISTS lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      video_path TEXT,
      upload_date TEXT,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      file_path TEXT,
      upload_date TEXT,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Student courses table (tracks registration and streaks)
  db.run(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      course_id INTEGER,
      streak INTEGER DEFAULT 0,
      last_watch_date TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Watch history table (records daily watch)
  db.run(`
    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      course_id INTEGER,
      watch_date TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Lecture watch progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS lecture_watch_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      lecture_id INTEGER,
      progress REAL DEFAULT 0,
      last_watched_at TEXT,
      watched INTEGER DEFAULT 0,
      actual_time_watched REAL DEFAULT 0,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(lecture_id) REFERENCES lectures(id)
    )
  `);

  // Note view progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS note_view_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      note_id INTEGER,
      viewed INTEGER DEFAULT 0,
      last_viewed_at TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(note_id) REFERENCES notes(id)
    )
  `);

  // Enrollment requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS enrollment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      course_id INTEGER,
      status TEXT DEFAULT 'pending',
      request_date TEXT,
      response_date TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Quizzes table
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      description TEXT,
      created_at TEXT,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  // Quiz questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER,
      question TEXT,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT,
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    )
  `);

  // Quiz attempts table
  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      quiz_id INTEGER,
      score INTEGER,
      total_questions INTEGER,
      answers JSON,
      submitted_at TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    )
  `);
});

module.exports = db;