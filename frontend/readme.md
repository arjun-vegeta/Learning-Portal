
---

# E-Learning Portal Frontend Documentation

## Overview

The frontend of the E‑Learning Portal is built with **React** and styled using **Tailwind CSS**. It leverages **react-router-dom** for client-side routing and **axios** for communicating with the backend API. The application supports three different user roles—**Student**, **Teacher**, and **Admin**—and presents customized dashboards and functionalities for each.

## File Structure

Below is the typical file structure of the frontend project:

```
e-learning-portal/
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js
        └── components/
            ├── Login.js
            ├── Register.js
            ├── Navbar.js
            ├── TeacherDashboard.js
            ├── StudentDashboard.js
            └── AdminDashboard.js
```

### Key Files and Folders

- **public/index.html**  
  The HTML template that serves as the entry point for the React app. It contains the `<div id="root"></div>` element where the React components will be rendered.

- **src/index.js**  
  The JavaScript entry point that renders the root component (`App.js`) and wraps the app in a router.

- **src/index.css**  
  Contains Tailwind CSS directives along with any custom global styles.

- **src/App.js**  
  The main application component. It sets up routing using `react-router-dom` and conditionally renders components (e.g., dashboards, login, register) based on the user's authentication state and role.

- **src/components/**  
  This folder holds all the reusable UI components and pages:
  - **Login.js:** A form component for user authentication.
  - **Register.js:** A registration form for new users.
  - **Navbar.js:** A navigation bar displayed when the user is logged in, including the logout functionality.
  - **TeacherDashboard.js, StudentDashboard.js, AdminDashboard.js:** Role-specific dashboard components containing the respective features for teachers, students, and admins.

## Dependencies

- **React:** For building the user interface.
- **react-router-dom:** For handling routing within the app.
- **axios:** For making HTTP requests to the backend API.
- **Tailwind CSS:** For styling the application with utility-first CSS.
- **react-icons:** For incorporating vector icons easily into the UI.

These dependencies are listed in the `package.json` file. To install them, run:

```bash
npm install
```

## Running the Frontend

1. **Install Dependencies:**  
   Open your terminal, navigate to the `frontend` folder, and run:
   ```bash
   npm install
   ```

2. **Ensure Tailwind CSS is Set Up:**  
   The `tailwind.config.js` and `postcss.config.js` files are already configured. The `index.css` file imports Tailwind’s directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Start the Development Server:**  
   Run the following command:
   ```bash
   npm start
   ```
   This will start the React development server and open your app in your default browser (usually at [http://localhost:3000](http://localhost:3000)).

## Components Overview

### 1. App.js

- **Routing:**  
  Uses `react-router-dom` to set up routes for `/login`, `/register`, and `/dashboard`.  
- **Auth State:**  
  Maintains authentication status using React state (or can be extended to use context) so that the UI updates on login and logout without needing to reload the page.
- **Conditional Rendering:**  
  Depending on the user's role (retrieved from localStorage and stored in state), the app renders the appropriate dashboard (Teacher, Student, or Admin).

### 2. Navbar.js

- **Purpose:**  
  Provides a consistent header for the app that includes the site title and a logout button.
- **Logout Functionality:**  
  Clears authentication data from localStorage and updates the authentication state so that the app can re-render and show the login screen without needing a full page reload.

### 3. Login.js

- **Form:**  
  Provides input fields for username and password.
- **Authentication:**  
  Uses axios to send a POST request to the backend’s `/api/auth/login` endpoint.  
- **State Management:**  
  Updates the global authentication state (via props or context) upon successful login.

### 4. Register.js

- **Form:**  
  Contains fields for name, username, password, and a role selector (with additional fields for teachers such as courses taught).
- **User Creation:**  
  Sends a POST request to the backend’s `/api/auth/register` endpoint to create a new user.

### 5. Dashboard Components

#### TeacherDashboard.js
- **Features:**  
  - Lists courses taught by the teacher.
  - Provides functionality for uploading lecture videos and notes.
  - Allows viewing the list of enrolled students along with their learning streaks.
- **UI Elements:**  
  Uses buttons, cards, and forms styled with Tailwind CSS and icons from react-icons.

#### StudentDashboard.js
- **Features:**  
  - Displays “My Courses” (with teacher names, course streaks, and other details).
  - Provides a collapsible sidebar for “Available Courses” with enrollment options.
  - Includes a separate box for course content (lectures, notes, and classmates’ streaks).
- **UI Enhancements:**  
  Includes a “Streak Progress” panel and interactive buttons for marking lectures as watched.

#### AdminDashboard.js
- **Features:**  
  - Allows the admin to view all teacher and student accounts.
  - Provides forms for adding new users and the ability to delete existing users.
  - Displays associated course information for teachers and course registration details for students.

## Styling & UI

- **Tailwind CSS:**  
  The project uses Tailwind’s utility classes to build a modern, responsive, and clean UI. The design includes:
  - Cards for listing courses and content.
  - Responsive grid layouts for dashboards.
  - Icons for quick visual identification of actions and sections.
  - Consistent spacing, typography, and color schemes to maintain a professional look.

- **React Icons:**  
  Icons from the `react-icons` package are used to enhance UI elements (e.g., buttons, section headers).

## API Integration

- **axios:**  
  All HTTP requests to the backend are handled using axios. Endpoints include:
  - `/api/auth/login` and `/api/auth/register` for authentication.
  - Role-specific endpoints under `/api/teacher`, `/api/student`, and `/api/admin` to manage course content, enrollment, and user management.
- **Authentication Headers:**  
  Each protected endpoint request includes an `authorization` header with the JWT token retrieved from localStorage.

## Final Notes

- **State Management Improvements:**  
  For larger applications, consider using a state management library (like Redux or React Context) to handle authentication and global state more robustly.
- **Responsive Design:**  
  The project is built with responsiveness in mind using Tailwind’s grid and spacing utilities. Test the UI on various screen sizes to ensure a seamless user experience.
- **Further Customizations:**  
  This documentation and code provide a base. You can extend the components, add error handling, and further customize the UI/UX according to your project needs.

---

