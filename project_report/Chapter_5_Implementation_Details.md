# 5. IMPLEMENTATION DETAILS

## 5.1 Introduction
The goal of the implementation phase is to translate the system design into code using an appropriate programming language and technology stack. During implementation, it is crucial that the programs are structured in a way that makes them scalable, easy to read, and easy to maintain. Luxe Groom uses a modern MERN stack architecture tailored for fast rendering and real-time data handling.

## 5.2 Hardware and Software Tools Used
A set of reliable hardware and software tools is used for developing and operating the Luxe Groom System to ensure smooth booking, tracking, and management.

### 5.2.1 Software Requirements
#### 5.2.1.1 Frontend Technologies
- **React.js & Vite**: Vite provides an ultra-fast development environment for React.js, which is used to create interactive and dynamic Single Page Applications (SPA) for the Customer, Admin, and Delivery portals.
- **Tailwind CSS**: A utility-first CSS framework used to design highly customizable, responsive, and modern user interfaces without writing extensive custom CSS.
- **Framer Motion**: Used for fluid animations and page transitions, giving the application a premium feel.
- **Socket.io-client**: Enables real-time, bi-directional communication between the web client and the server for instant notifications.

#### 5.2.1.2 Backend Technologies
- **Node.js & Express.js**: Node.js provides a non-blocking asynchronous runtime, while Express.js serves as the backend web framework handling API routing, middleware integration, and business logic.
- **MongoDB & Mongoose**: MongoDB acts as the NoSQL database, storing flexible JSON-like documents. Mongoose is the Object Data Modeling (ODM) library used to structure schemas and handle database queries securely.
- **Socket.io**: Handles WebSockets on the server-side to broadcast live updates (e.g., when an order status changes or a new booking is created).
- **JWT & bcryptjs**: Used for secure user authentication, token generation, and password hashing.

### 5.2.2 Development Tools
- **Visual Studio Code**: A lightweight, open-source code editor used for development.
- **Git & GitHub**: Version control system used for tracking changes and collaborating.
- **Postman**: Used for testing API endpoints during backend development.

## 5.3 Core Implementation Concepts

### 5.3.1 Authentication & Role-Based Access Control (RBAC)
The system uses JSON Web Tokens (JWT). When a user logs in, the backend verifies the credentials and returns a token containing the user's `id` and `role`. The frontend stores this token in `localStorage`. 

React Router uses Private Route components to check the role. If a customer tries to access the `/admin` route, the application automatically redirects them to an unauthorized page or forces a logout.

### 5.3.2 Real-Time Notifications
The Socket.io implementation involves initializing a socket server in Node.js. When a user connects, they join a "room" based on their email or user ID. When an admin assigns a personalized coupon or updates an order status, the server emits a `new-notification` event specifically to that user's room. The React frontend listens for this event using the `useEffect` hook and immediately updates the notification bell and displays a toast message using the `sonner` library.

### 5.3.3 Dynamic Waitlist
When a customer attempts to book an appointment on a day where all slots are taken, they can click "Join Waitlist". The backend records their request. If another user cancels their appointment on that specific date, a background process or database trigger checks the waitlist collection and sends an automated notification to the first person waiting, prompting them to claim the slot.
