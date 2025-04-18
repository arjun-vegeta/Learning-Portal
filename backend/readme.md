---

# E-Learning Portal Backend Documentation

## Overview

This backend is built using Node.js with the Express framework and uses SQLite as an offline database. The system supports three types of users: **students**, **teachers**, and **admins**. Each user role has different functionalities and endpoints:

- **Students:**  
  - Register for and drop courses.
  - Mark lectures as watched (which updates streaks).
  - View course details (lectures, notes, and classmates' streaks).
  - Take quizzes and view quiz results.

- **Teachers:**  
  - Upload lectures (video files) and notes (documents) for courses.
  - View courses they teach.
  - View lists of students enrolled in their courses along with their streaks.
  - Create and manage quizzes for their courses.

- **Admins:**  
  - View all teachers and students.
  - Add or delete teacher/student accounts.
  - View detailed information about courses, teachers, and students.

The backend uses JWT (JSON Web Tokens) for authentication and authorization, and Multer for handling file uploads.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on port 5000 by default.

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

## Project Structure

```
backend/
├── server.js           # Main application entry point
├── database.js         # Database configuration and setup
├── routes/            # API route handlers
│   ├── auth.js        # Authentication routes
│   ├── teacher.js     # Teacher-specific routes
│   ├── student.js     # Student-specific routes
│   ├── admin.js       # Admin-specific routes
│   └── quiz.js        # Quiz-related routes
├── middleware/        # Custom middleware
│   └── auth.js        # Authentication middleware
└── uploads/          # Directory for uploaded files
    ├── lectures/     # Video files
    └── notes/        # Document files
```

---

## Database Schema

The SQLite database contains several tables that store information about users, courses, lectures, notes, student-course relationships, watch history, and quizzes.

### Tables

1. **users**

   Stores all user records (students, teachers, admins).

   | Column    | Type    | Description                                                   |
   |-----------|---------|---------------------------------------------------------------|
   | id        | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each user. |
   | username  | TEXT (Unique) | User's login username.                         |
   | password  | TEXT    | Hashed password using bcrypt.                                |
   | role      | TEXT    | Role of the user (`student`, `teacher`, or `admin`).         |
   | name      | TEXT    | Full name of the user.                                         |

2. **courses**

   Stores the courses that teachers create.

   | Column      | Type    | Description                                                  |
   |-------------|---------|--------------------------------------------------------------|
   | id          | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each course.     |
   | title       | TEXT    | Course title.                                               |
   | teacher_id  | INTEGER | References the `users.id` of the teacher who teaches the course. |

3. **lectures**

   Stores lecture videos uploaded by teachers for a course.

   | Column     | Type    | Description                                                   |
   |------------|---------|---------------------------------------------------------------|
   | id         | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each lecture.  |
   | course_id  | INTEGER | References `courses.id` indicating which course the lecture belongs to. |
   | title      | TEXT    | Title of the lecture.                                         |
   | video_path | TEXT    | File path (URL) for the uploaded video.                       |
   | upload_date| TEXT    | ISO string representing the upload date and time.             |

4. **notes**

   Stores document notes uploaded by teachers for a course.

   | Column    | Type    | Description                                                   |
   |-----------|---------|---------------------------------------------------------------|
   | id        | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each note.      |
   | course_id | INTEGER | References `courses.id` indicating which course the note belongs to. |
   | title     | TEXT    | Title of the note.                                            |
   | file_path | TEXT    | File path (URL) for the uploaded document.                    |
   | upload_date| TEXT   | ISO string representing the upload date and time.             |

5. **student_courses**

   Manages the relationship between students and courses they are registered in, including tracking the learning streak.

   | Column           | Type    | Description                                                   |
   |------------------|---------|---------------------------------------------------------------|
   | id               | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for the student-course record. |
   | student_id       | INTEGER | References `users.id` of the student.                        |
   | course_id        | INTEGER | References `courses.id` for the registered course.           |
   | streak           | INTEGER | Current streak count (number of consecutive days watched).   |
   | last_watch_date  | TEXT    | ISO string representing the last date the student watched the course. |

6. **watch_history**

   Records each time a student marks a lecture as watched. This table helps in calculating the learning streaks.

   | Column     | Type    | Description                                                   |
   |------------|---------|---------------------------------------------------------------|
   | id         | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each watch record.  |
   | student_id | INTEGER | References `users.id` of the student who watched the lecture.  |
   | course_id  | INTEGER | References `courses.id` for the course.                        |
   | watch_date | TEXT    | ISO string representing the date the lecture was watched.      |

7. **lecture_watch_progress**

   Tracks detailed progress of students watching lecture videos.

   | Column              | Type    | Description                                                   |
   |---------------------|---------|---------------------------------------------------------------|
   | id                  | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each progress record. |
   | student_id          | INTEGER | References `users.id` of the student.                        |
   | lecture_id          | INTEGER | References `lectures.id` for the watched lecture.            |
   | progress            | REAL    | Percentage of video watched (0-100).                         |
   | last_watched_at     | TEXT    | ISO string of when the student last watched the lecture.     |
   | watched             | INTEGER | Whether the lecture has been watched (0 or 1).               |
   | actual_time_watched | REAL    | Total time spent watching in seconds.                        |

8. **note_view_progress**

   Tracks when students view course notes.

   | Column          | Type    | Description                                                   |
   |-----------------|---------|---------------------------------------------------------------|
   | id              | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each view record. |
   | student_id      | INTEGER | References `users.id` of the student.                        |
   | note_id         | INTEGER | References `notes.id` for the viewed note.                   |
   | viewed          | INTEGER | Whether the note has been viewed (0 or 1).                   |
   | last_viewed_at  | TEXT    | ISO string of when the student last viewed the note.         |

9. **enrollment_requests**

   Manages course enrollment requests from students.

   | Column         | Type    | Description                                                   |
   |----------------|---------|---------------------------------------------------------------|
   | id             | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each request. |
   | student_id     | INTEGER | References `users.id` of the requesting student.             |
   | course_id      | INTEGER | References `courses.id` for the requested course.            |
   | status         | TEXT    | Request status ('pending', 'approved', 'rejected').          |
   | request_date   | TEXT    | ISO string of when the request was made.                     |
   | response_date  | TEXT    | ISO string of when the request was responded to.             |

10. **quizzes**

   Stores quizzes created by teachers for their courses.

   | Column       | Type    | Description                                                   |
   |--------------|---------|---------------------------------------------------------------|
   | id           | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each quiz. |
   | course_id    | INTEGER | References `courses.id` indicating which course the quiz belongs to. |
   | title        | TEXT    | Title of the quiz.                                            |
   | description  | TEXT    | Description of the quiz.                                      |
   | created_at   | TEXT    | ISO string representing when the quiz was created.            |

11. **quiz_questions**

   Stores individual questions for each quiz.

   | Column         | Type    | Description                                                   |
   |----------------|---------|---------------------------------------------------------------|
   | id             | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each question. |
   | quiz_id        | INTEGER | References `quizzes.id` indicating which quiz this question belongs to. |
   | question       | TEXT    | The question text.                                            |
   | option_a       | TEXT    | First option for the question.                               |
   | option_b       | TEXT    | Second option for the question.                              |
   | option_c       | TEXT    | Third option for the question.                               |
   | option_d       | TEXT    | Fourth option for the question.                              |
   | correct_answer | TEXT    | The correct answer (a, b, c, or d).                          |

12. **quiz_attempts**

   Records student attempts at quizzes.

   | Column           | Type    | Description                                                   |
   |------------------|---------|---------------------------------------------------------------|
   | id               | INTEGER (PRIMARY KEY, AUTOINCREMENT) | Unique identifier for each attempt. |
   | student_id       | INTEGER | References `users.id` of the student who took the quiz.      |
   | quiz_id          | INTEGER | References `quizzes.id` for the attempted quiz.              |
   | score            | INTEGER | Number of correct answers.                                   |
   | total_questions  | INTEGER | Total number of questions in the quiz.                       |
   | answers          | JSON    | JSON array of student's answers.                             |
   | submitted_at     | TEXT    | ISO string of when the quiz was submitted.                   |

---

## API Endpoints

The backend organizes endpoints into separate route modules for authentication, teacher functionalities, student functionalities, admin functionalities, and quiz management.

### 1. **Authentication (`routes/auth.js`)**

- **POST /api/auth/register**  
  Registers a new user. Teachers must provide an array of courses they teach.
  - Required fields: username, password, role, name
  - For teachers: optional array of courses
  
- **POST /api/auth/login**  
  Logs in a user. On success, returns a JWT token along with the user role and ID.
  - Required fields: username, password
  - Returns: { token, role, userId }

### 2. **Teacher Routes (`routes/teacher.js`)**

*All teacher routes require JWT authentication and that the user's role is `teacher`.*

- **GET /api/teacher/courses**  
  Returns a list of courses taught by the logged-in teacher.

- **POST /api/teacher/courses/:courseId/lecture**  
  Uploads a lecture video for a course. Uses Multer for handling file uploads.

- **POST /api/teacher/courses/:courseId/note**  
  Uploads a note (document) for a course. Uses Multer for handling file uploads.

- **GET /api/teacher/courses/:courseId/lectures**  
  Returns the list of lectures for a given course.

- **GET /api/teacher/courses/:courseId/notes**  
  Returns the list of notes for a given course.

- **GET /api/teacher/courses/:courseId/students**  
  Returns the list of students registered for a course along with their streaks.

- **GET /api/teacher/enrollment-requests**  
  Returns all pending enrollment requests for courses taught by the teacher.

- **POST /api/teacher/enrollment-requests/:requestId**  
  Handles an enrollment request (approve/reject). If approved, automatically enrolls the student in the course.

- **POST /api/courses/:courseId/quizzes**  
  Creates a new quiz for a course. Requires quiz title, description, and an array of questions.

- **GET /api/courses/:courseId/quizzes**  
  Returns all quizzes for a course.

- **GET /api/courses/:courseId/quizzes/:quizId**  
  Returns details of a specific quiz including questions.

- **GET /api/courses/:courseId/quizzes/:quizId/attempts**  
  Returns all student attempts for a specific quiz.

### 3. **Student Routes (`routes/student.js`)**

*All student routes require JWT authentication and that the user's role is `student`.*

- **GET /api/student/info**  
  Returns the logged-in student's information.

- **GET /api/student/courses**  
  Returns a list of all courses available for registration (joins with the `users` table to include teacher names).

- **GET /api/student/courses/:courseId**  
  Returns detailed information about a specific course.

- **GET /api/student/my-courses**  
  Returns courses the student is registered in, including streak info and teacher names.  
  **Note:** This endpoint must join `student_courses`, `courses`, and `users` to return the teacher's name.

- **POST /api/student/courses/register**  
  Submits an enrollment request for a course. The request must be approved by the teacher.

- **GET /api/student/enrollment-requests**  
  Returns the status of all enrollment requests submitted by the student.

- **POST /api/student/courses/drop**  
  Drops a course the student is registered in.

- **POST /api/student/courses/:courseId/watch**  
  Marks a lecture watch for a course. Inserts a record into `watch_history` and updates the streak in `student_courses`.

- **GET /api/student/courses/:courseId/details**  
  Returns details for a course including lectures, notes, and current streak.

- **GET /api/student/courses/:courseId/students**  
  Returns other students registered for a course (excluding the current student) along with their streaks.

- **GET /api/courses/:courseId/quizzes**  
  Returns all quizzes available for a course.

- **GET /api/courses/:courseId/quizzes/:quizId**  
  Returns details of a specific quiz.

- **POST /api/courses/:courseId/quizzes/:quizId/submit**  
  Submits a quiz attempt. Returns the score and correct answers.

- **GET /api/courses/:courseId/quizzes/:quizId/attempts**  
  Returns the student's attempts for a specific quiz.

### 4. **Admin Routes (`routes/admin.js`)**

*All admin routes require JWT authentication and that the user's role is `admin`.*

- **GET /api/admin/teachers**  
  Returns all teacher accounts with their associated courses.  
  Uses SQL aggregation to return a JSON array of courses per teacher.

- **GET /api/admin/students**  
  Returns all student accounts with their registered courses and streaks.

- **POST /api/admin/user**  
  Adds a new teacher or student. If the role is `teacher`, accepts an array of courses.

- **DELETE /api/admin/user/:userId**  
  Deletes a user (teacher or student) by ID.

### 5. **Quiz Routes (`routes/quiz.js`)**

*All quiz routes require JWT authentication. Role-specific access is enforced within each route.*

- **POST /api/courses/:courseId/quizzes**  
  Creates a new quiz for a course (teacher only).
  - Required fields: title, description, questions array
  - Each question must have: question text, options (a-d), correct_answer

- **GET /api/courses/:courseId/quizzes**  
  Returns all quizzes for a course.

- **GET /api/quizzes/:quizId**  
  Returns details of a specific quiz including questions.
  - For students: correct answers are hidden if quiz hasn't been attempted
  - For teachers: includes all correct answers

- **POST /api/quizzes/:quizId/submit**  
  Submits a quiz attempt (student only).
  - Required fields: answers object mapping question IDs to selected answers
  - Returns: score, total questions, and submission confirmation

- **GET /api/courses/:courseId/quizzes/:quizId/attempts**  
  Returns quiz attempts (teacher only) or student's own attempts (student only).

## Authentication & Authorization

The backend uses JWT (JSON Web Tokens) for authentication and role-based authorization:

1. **Token Format:**
   - Tokens are issued upon successful login
   - Include user ID and role
   - Expire after 24 hours

2. **Authorization Headers:**
   - Supports both formats:
     ```
     Authorization: Bearer <token>
     Authorization: <token>
     ```

3. **Role-Based Access Control:**
   - Each route module includes role verification middleware
   - Routes are protected based on user roles (student, teacher, admin)
   - Unauthorized access attempts return 403 Forbidden

4. **Security Features:**
   - Passwords are hashed using bcrypt
   - JWT tokens are signed with a secret key
   - Token verification on every protected route

---

## Technologies & Middleware

- **Express:**  
  Provides the web framework for handling HTTP requests and routing.

- **SQLite:**  
  An offline, file-based database used to store all data. The `database.js` file sets up the connection and creates the necessary tables if they do not exist.

- **JWT (jsonwebtoken):**  
  Used for secure authentication. Tokens are issued upon login and verified on every protected route.

- **bcrypt:**  
  Used to hash passwords before storing them in the database.

- **Multer:**  
  Middleware for handling file uploads (for lecture videos and note documents).

- **CORS:**  
  Enabled to allow cross-origin requests between the backend (running on port 5000 or 5001) and the frontend.

---

## Running the Backend

1. **Install Dependencies:**  
   In the `backend` folder, run:
   ```bash
   npm install
   ```
2. **Create Upload Directories:**  
   Create the directories:
   - `uploads/lectures`
   - `uploads/notes`
3. **Start the Server:**  
   Run:
   ```bash
   npm start
   ```
   The server listens on port 5000 (or the configured port).

---
