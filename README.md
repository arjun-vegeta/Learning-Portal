# E-Learning Portal

## Overview

The **E-Learning Portal** is a full-stack web application designed to facilitate online learning for students, teachers, and administrators. The platform provides a seamless experience for:

- **Teachers:** Uploading lectures (video files) and notes (documents) for courses they teach.
- **Students:** Registering for courses, viewing course content, marking lectures as watched to build learning streaks, and tracking their progress.
- **Admins:** Managing user accounts (teachers and students) and overseeing course data.

This project is built with a **Node.js/Express** backend using **SQLite** as an offline database and a **React** frontend styled with **Tailwind CSS**. Authentication is implemented using **JWT (JSON Web Tokens)**, and file uploads are handled via **Multer**.

## Features

### Common Features
- **User Authentication:** Secure login and registration with different roles (student, teacher, admin) using JWT.
- **Responsive UI:** Built using React and Tailwind CSS with modern, responsive design.
- **File Uploads:** Teachers can upload video lectures and document notes for each course.
- **Learning Streaks:** Students can mark lectures as watched to build daily streaks, with overall and course-specific tracking.
- **Admin Panel:** Admin users can add or delete teacher/student accounts and view detailed information about courses and user enrollments.
- **Offline Database:** Uses SQLite to keep the setup simple without the need for online configuration.

### Student Dashboard
- **My Courses:** View registered courses with teacher name, current streak, and course details.
- **Available Courses:** See and enroll in new courses through a collapsible sidebar.
- **Course Content:** Access detailed course content including lectures, notes, and classmates’ streaks in a dedicated section.
- **Streak Progress:** Sidebar displays overall and course-wise learning streaks.

### Teacher Dashboard
- **Course Management:** View and manage courses they teach.
- **Content Uploads:** Upload new lectures (video files) and notes (documents) for each course.
- **Student Tracking:** View a list of enrolled students along with their learning streaks.

### Admin Dashboard
- **User Management:** View detailed lists of teachers and students along with their associated courses.
- **Account Management:** Create and delete user accounts.
- **Data Oversight:** Aggregate data of courses, enrollments, and streaks for administrative oversight.

## Technologies Used

- **Backend:**
  - Node.js, Express
  - SQLite (for offline, file-based database)
  - JSON Web Tokens (JWT) for authentication
  - Multer for file uploads
  - bcrypt for password hashing
  - CORS to handle cross-origin requests

- **Frontend:**
  - React (with hooks)
  - Tailwind CSS for styling
  - react-router-dom for routing
  - axios for HTTP requests
  - react-icons for UI icons

## File Structure

```
e-learning-portal/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── database.js
│   ├── uploads/
│   │   ├── lectures/       (store uploaded lecture videos)
│   │   └── notes/          (store uploaded note files)
│   └── routes/
│       ├── auth.js         (user registration and login)
│       ├── teacher.js      (teacher-specific endpoints)
│       ├── student.js      (student-specific endpoints)
│       └── admin.js        (admin-specific endpoints)
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html      (HTML template for React)
    └── src/
        ├── index.js
        ├── index.css       (Tailwind CSS directives and global styles)
        ├── App.js          (Main application with routing and auth state)
        └── components/
            ├── Login.js
            ├── Register.js
            ├── Navbar.js
            ├── TeacherDashboard.js
            ├── StudentDashboard.js
            └── AdminDashboard.js
```

## Setup and Installation

### Backend Setup

1. **Install Dependencies:**  
   Open a terminal in the `backend` folder and run:
   ```bash
   npm install
   ```

2. **Create Upload Directories:**  
   In the `backend` folder, create the following directories if they don’t already exist:
   - `uploads/lectures`
   - `uploads/notes`

3. **Start the Server:**  
   In the `backend` folder, run:
   ```bash
   npm start
   ```
   The backend server will run on port **5000** (or as configured).

4. **Database Initialization:**  
   The `database.js` file automatically creates the necessary SQLite tables (users, courses, lectures, notes, student_courses, watch_history) when the server starts.

5. **Creating an Admin Account:**  
   Use the provided script (e.g., `createAdmin.js`) to manually insert an admin account into the database if required.

### Frontend Setup

1. **Install Dependencies:**  
   Open a terminal in the `frontend` folder and run:
   ```bash
   npm install
   ```
   Ensure that `react-scripts` is installed if not already.

2. **Start the Development Server:**  
   In the `frontend` folder, run:
   ```bash
   npm start
   ```
   The React app will start on [http://localhost:3000](http://localhost:3000).

3. **Configure Tailwind CSS:**  
   Make sure `tailwind.config.js` and `postcss.config.js` are correctly set up. The `index.css` file imports Tailwind’s base, components, and utilities.

## Usage

1. **Registration & Login:**  
   - Users can register as students or teachers via the registration page.
   - Admin accounts must be created manually.
   - After registration, log in using your credentials. The application will redirect to the appropriate dashboard based on your role.

2. **Dashboards:**  
   - **Student Dashboard:** Enroll in courses, view content, and track learning streaks.
   - **Teacher Dashboard:** Manage courses, upload lectures and notes, and track student progress.
   - **Admin Dashboard:** Manage user accounts and view detailed course and enrollment data.

3. **Logout:**  
   Use the Navbar’s logout button to securely log out and clear authentication data.

## Conclusion

The E-Learning Portal provides a robust solution for online learning with distinct interfaces for students, teachers, and administrators. With secure authentication, comprehensive course management, and a modern responsive UI, this project serves as a solid foundation for an e-learning platform.

Feel free to extend and customize this project according to your requirements.

---
