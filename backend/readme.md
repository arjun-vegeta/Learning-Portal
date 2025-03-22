

---

# E-Learning Portal Backend Documentation

## Overview

This backend is built using Node.js with the Express framework and uses SQLite as an offline database. The system supports three types of users: **students**, **teachers**, and **admins**. Each user role has different functionalities and endpoints:

- **Students:**  
  - Register for and drop courses.
  - Mark lectures as watched (which updates streaks).
  - View course details (lectures, notes, and classmates' streaks).

- **Teachers:**  
  - Upload lectures (video files) and notes (documents) for courses.
  - View courses they teach.
  - View lists of students enrolled in their courses along with their streaks.

- **Admins:**  
  - View all teachers and students.
  - Add or delete teacher/student accounts.
  - View detailed information about courses, teachers, and students.

The backend uses JWT (JSON Web Tokens) for authentication and authorization, and Multer for handling file uploads.

---

## Database Schema

The SQLite database contains several tables that store information about users, courses, lectures, notes, student-course relationships, and watch history.

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

---

## API Endpoints

The backend organizes endpoints into separate route modules for authentication, teacher functionalities, student functionalities, and admin functionalities.

### 1. **Authentication (`routes/auth.js`)**

- **POST /api/auth/register**  
  Registers a new user. Teachers must provide an array of courses they teach.
  
- **POST /api/auth/login**  
  Logs in a user. On success, returns a JWT token along with the user role and ID.

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

### 3. **Student Routes (`routes/student.js`)**

*All student routes require JWT authentication and that the user's role is `student`.*

- **GET /api/student/courses**  
  Returns a list of all courses available for registration (joins with the `users` table to include teacher names).

- **GET /api/student/my-courses**  
  Returns courses the student is registered in, including streak info and teacher names.  
  **Note:** This endpoint must join `student_courses`, `courses`, and `users` to return the teacher’s name.

- **POST /api/student/courses/register**  
  Registers the logged-in student for a course.

- **POST /api/student/courses/drop**  
  Drops a course the student is registered in.

- **POST /api/student/courses/:courseId/watch**  
  Marks a lecture watch for a course. Inserts a record into `watch_history` and updates the streak in `student_courses`.

- **GET /api/student/courses/:courseId/details**  
  Returns details for a course including lectures, notes, and current streak.

- **GET /api/student/courses/:courseId/students**  
  Returns other students registered for a course (excluding the current student) along with their streaks.

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
