# E-Learning Portal Frontend Documentation

## Overview

The frontend of the E‑Learning Portal is built with **React** and styled using **Tailwind CSS**. It leverages **react-router-dom** for client-side routing and **axios** for communicating with the backend API. The application supports three different user roles—**Student**, **Teacher**, and **Admin**—and presents customized dashboards and functionalities for each.

## File Structure

Below is the typical file structure of the frontend project:

```
e-learning-portal/
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js
        └── components/
            ├── AdminDashboard.js
            ├── CourseDetails.js
            ├── Login.js
            ├── Message.js
            ├── Navbar.js
            ├── PDFViewerAdvanced.js
            ├── PomodoroContext.js
            ├── Register.js
            ├── StudentDashboard.js
            └── TeacherDashboard.js
```

### Key Files and Folders

- **public/index.html**  
  The HTML template that serves as the entry point for the React app. It contains the `<div id="root"></div>` element where the React components will be rendered.

- **src/index.js**  
  The JavaScript entry point that renders the root component (`App.js`) and wraps the app in a router.

- **src/index.css**  
  Contains Tailwind CSS directives along with any custom global styles.

- **src/App.js**  
  The main application component. It sets up routing using `react-router-dom` and conditionally renders components based on the user's authentication state and role.

- **src/components/**  
  This folder holds all the reusable UI components and pages:
  - **AdminDashboard.js**: Admin interface for managing users and courses
  - **CourseDetails.js**: Detailed view of course content and materials
  - **Login.js**: User authentication component
  - **Message.js**: Reusable message/notification component
  - **Navbar.js**: Navigation bar component
  - **PDFViewerAdvanced.js**: Advanced PDF document viewer
  - **PomodoroContext.js**: Context for Pomodoro timer functionality
  - **Register.js**: User registration component
  - **StudentDashboard.js**: Student's main interface
  - **TeacherDashboard.js**: Teacher's main interface
  - **QuizPage.js**: Interface for taking quizzes
  - **QuizCreator.js**: Interface for creating new quizzes
  - **QuizResults.js**: Interface for viewing quiz results and analytics

## Dependencies

- **React:** For building the user interface
- **react-router-dom:** For handling routing within the app
- **axios:** For making HTTP requests to the backend API
- **Tailwind CSS:** For styling the application with utility-first CSS
- **react-icons:** For incorporating vector icons
- **@headlessui/react:** For accessible UI components
- **react-player:** For video playback functionality

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

2. **Start the Development Server:**  
   Run the following command:
   ```bash
   npm start
   ```
   This will start the React development server and open your app in your default browser (usually at [http://localhost:3000](http://localhost:3000)).

## Components Overview

### Authentication Components

#### Login.js
- **Features:**
  - Form for username and password
  - Error handling and validation
  - Redirect to appropriate dashboard based on user role
  - Remember me functionality

#### Register.js
- **Features:**
  - Dynamic form fields based on selected role
  - Course selection for teachers
  - Password strength validation
  - Success/error notifications

### Common Components

#### Navbar.js
- **Features:**
  - Role-specific navigation items
  - User profile dropdown
  - Notifications system
  - Responsive design

### Teacher Components

#### TeacherDashboard.js
- **Features:**
  - Overview of courses taught
  - Quick stats (total students, average streaks)
  - Recent enrollment requests
  - Course management actions
  - Quiz management:
    - Create new quizzes
    - View quiz results and analytics
    - Track student performance

#### QuizCreator.js
- **Features:**
  - Dynamic quiz creation interface
  - Multiple choice question builder
  - Option management (A, B, C, D)
  - Correct answer selection
  - Quiz title and description
  - Real-time validation
  - Error handling

#### QuizResults.js
- **Features:**
  - Comprehensive quiz analytics
  - Student attempt tracking
  - Score visualization
  - Detailed answer breakdown
  - Performance metrics
  - Individual student analysis

### Student Components

#### StudentDashboard.js
- **Features:**
  - Learning progress overview
  - Streak tracking
  - Course recommendations
  - Recent activity feed
  - Quiz history and scores

#### QuizPage.js
- **Features:**
  - Interactive quiz interface
  - Multiple choice question display
  - Real-time answer selection
  - Progress tracking
  - Score calculation
  - Immediate feedback
  - Answer review after submission

### Admin Components

#### AdminDashboard.js
- **Features:**
  - System overview
  - User management
  - Course analytics
  - Platform statistics

## Styling & UI

- **Tailwind CSS:**  
  The project uses Tailwind's utility classes to build a modern, responsive, and clean UI. The design includes:
  - Responsive grid layouts
  - Card-based components
  - Interactive elements
  - Loading states
  - Error states
  - Success notifications

- **Component Library:**  
  Uses Headless UI components for accessible, customizable UI elements:
  - Modals
  - Dropdowns
  - Tabs
  - Transitions

## API Integration

- **axios:**  
  All HTTP requests to the backend are handled using axios. The API integration is organized by role:
  - Authentication endpoints
  - Teacher-specific endpoints
  - Student-specific endpoints
  - Admin-specific endpoints
  - Quiz-related endpoints:
    - Quiz creation and management
    - Quiz taking and submission
    - Results and analytics
    - Progress tracking

- **Authentication:**  
  - JWT token management
  - Role-based access control
  - Session persistence
  - Secure storage

## Best Practices

- **Code Organization:**
  - Component-based architecture
  - Role-based routing
  - Reusable utility functions
  - Consistent naming conventions

- **Performance:**
  - Lazy loading of routes
  - Optimized image loading
  - Efficient state management
  - Caching strategies

- **Security:**
  - Secure token storage
  - Input validation
  - XSS prevention
  - CSRF protection

- **Accessibility:**
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Color contrast compliance

## Development Guidelines

1. **Component Structure:**
   - Use functional components with hooks
   - Implement proper prop types
   - Include error boundaries
   - Add loading states

2. **State Management:**
   - Use React Context for global state
   - Implement proper error handling
   - Include loading states
   - Cache API responses

3. **Styling:**
   - Follow Tailwind best practices
   - Maintain consistent spacing
   - Use responsive design
   - Implement dark mode support

4. **Testing:**
   - Write unit tests for components
   - Include integration tests
   - Test error scenarios
   - Verify accessibility

## Deployment

1. **Build the Application:**
   ```bash
   npm run build
   ```

2. **Serve the Build:**
   - Use a static file server
   - Configure proper CORS
   - Set up SSL/TLS
   - Implement caching

3. **Environment Variables:**
   - API endpoints
   - Feature flags
   - Analytics keys
   - Error tracking

---

