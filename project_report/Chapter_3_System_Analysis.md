# 3. SYSTEM ANALYSIS

## 3.1 Introduction
The operation of a modern premium salon involves handling complex schedules, managing staff, maintaining an inventory of cosmetic products, and ensuring high customer satisfaction. Despite the availability of various standalone software solutions, the lack of an integrated platform often leads to inefficient monitoring, delays in service, and poor administrative coordination. The manual process of handling appointments and deliveries often leads to data loss and reduced accountability. Therefore, there is a strong need for a smart, digital, and transparent solution that allows real-time booking, tracking, and management while enhancing communication between all stakeholders involved.

### 3.1.1 Purpose
The main purpose of this project is to design and develop a comprehensive web application that enables effective management of both salon services and e-commerce. The system aims to empower customers to easily book appointments, join waitlists, and purchase products online. At the same time, it provides administrators and delivery officials with an efficient digital platform to manage operations, process orders, and handle staff schedules in real time. The integration of automated notifications, digital wallets, and loyalty programs ensures transparency, accountability, and improved operational efficiency.

### 3.1.2 Scope
The scope of this project encompasses the development of Luxe Groom, an application designed to streamline the process of booking salon services and managing cosmetic product sales. The system provides a unified digital platform connecting customers, delivery officials, and administrators. Customers can easily register, log in, browse services, join waitlists, purchase products, and track order statuses. Administrators can manage users, staff, services, products, coupons, and view detailed financial analytics through a centralized dashboard. Delivery officials can view assigned orders, update statuses, and use geolocation to fulfill deliveries.

## 3.2 Overall Description
Luxe Groom is a web application developed to support premium salons in managing their operations more effectively. The system provides a centralized digital platform bridging the gap between the salon staff and the customers by ensuring real-time reporting, transparency, and accountability.

### 3.2.1 Product Perspective
The proposed application contains intuitive graphical interfaces tailored to different types of users (Customers, Admins, Delivery Officials). It utilizes a robust NoSQL database (MongoDB) which handles the complexity of operations seamlessly. It is a responsive web page that adjusts perfectly on any platform, designed with Progressive Web App (PWA) capabilities. 
It also provides:
- Clean and easy user interfaces which make the system user-friendly.
- Active workspaces for the users with real-time dynamic updates via WebSockets.

### 3.2.2 Product Features
- Secure authentication system for Customers, Delivery Officials, and Admin.
- Allows users to book appointments and purchase products via a unified cart.
- Dynamic waitlist management with real-time notifications.
- Digital Wallet and Loyalty Point tracking for automated discounts.
- Centralized control panel to manage staff leaves, coupons, orders, and analytical reports.
- Dedicated interface for delivery staff to track and update order fulfillment.
- Integrated review system for both services and products.

### 3.2.3 User Characteristics
- **General Public (Customers)**: Users who book services and buy products using mobile or desktop browsers. They possess basic smartphone or internet usage knowledge.
- **Admin**: Staff who monitor operations, manage inventory, approve leaves, and analyze revenue reports. They possess intermediate technical skills.
- **Delivery Officials**: Staff responsible for delivering e-commerce products. They require basic smartphone knowledge to update order statuses.

### 3.2.4 General Constraints
- The main constraint would be verifying the genuineness of users placing Cash on Delivery (COD) orders, which can pose a business risk.
- The developed system should run under any platform that contains a modern web browser supporting JavaScript and WebSockets.

### 3.2.5 Assumptions and Dependencies
The system assumes that all users have access to internet-enabled devices. The delivery module assumes access to GPS functionality. Its effective operation depends on stable internet connectivity and reliable email/WebSocket service integration.

## 3.3 Specific Requirements
### 3.3.1 External Interface Requirements
All interactions of the software with different users, hardware, and other software are clearly specified. The "Luxe Groom" system should be simple, intuitive, and easy to understand.

#### 3.3.1.1 User Interface
- The system provides a user-friendly GUI utilizing Tailwind CSS and Framer Motion for smooth animations.
- Appropriate error messages (toast notifications) are generated when a user performs an invalid operation.

#### 3.3.1.2 Hardware Interface
- Processor: 133-MHz Intel Pentium-class processor or higher (Client-side)
- RAM: 4GB and above
- Hard Disk: Minimal space for browser cache

#### 3.3.1.3 Software Interface
- Front-End: React.js (Vite), Tailwind CSS, Framer Motion, HTML5, CSS3.
- Back-End: Node.js, Express.js, MongoDB (Mongoose), Socket.io.

#### 3.3.1.4 Communication Interface
The application relies on HTTP/HTTPS protocols for REST API communication and WebSockets (Socket.io) for real-time bi-directional event communication.

## 3.4 Functional Requirements
### 3.4.1 Customer Module
- **Registration & Login**: Secure account creation and authentication using JWT.
- **Profile & Wallet**: Users can update their profiles, view digital wallet balance, and track transaction history.
- **Service Booking**: Browse services, select barbers, choose dates, and book appointments. Includes a waitlist feature for fully booked days.
- **E-commerce Shop**: Browse cosmetic products, add to cart, and checkout.
- **My Appointments & Orders**: View past and upcoming appointments, cancel or reschedule bookings, and track product delivery status.
- **Reviews**: Submit ratings and reviews for stylists and purchased products.

### 3.4.2 Admin Module
- **Dashboard & Reports**: View key metrics (revenue, total bookings, active users) and generate analytical reports.
- **Staff Management**: Add/edit barbers, set working hours, and approve or reject leave requests.
- **Service & Product Management**: Create, update, or delete salon services and cosmetic products.
- **Order & Appointment Tracking**: Monitor live appointments and update e-commerce order statuses.
- **Coupon Management**: Generate promotional coupons and assign exclusive personalized coupons to top customers.

### 3.4.3 Delivery Module
- **Login**: Secure access for delivery personnel.
- **Order Dashboard**: View a list of assigned orders with customer details and delivery address.
- **Status Updates**: Update the fulfillment status of orders (e.g., 'Shipped', 'Out for Delivery', 'Delivered') which triggers real-time updates to the customer.

## 3.5 Performance Requirements
- The application requires a stable internet connection.
- API response times should be optimized (typically under 500ms).
- Real-time updates via WebSockets must reflect instantly across connected clients.

## 3.6 Design Constraints
- Inputs must be validated both on the client side and server side to prevent invalid data entry.
- Mandatory fields must be checked before form submission; otherwise, proper error messages (toasts) should be displayed.

## 3.7 Other Requirements
- **Reliability**: Secure validation of user inputs to avoid unauthorized access.
- **Portability**: Accessible via any modern web browser across different operating systems.
- **Compatibility**: Responsive design that adapts to mobile, tablet, and desktop screens.

## 3.8 Safety Requirements
- Forgot Password functionality helps users recover accounts via secure email OTP verification.
- Route guards and middleware ensure authorized access to protected pages.

## 3.9 Security Requirements
- Passwords are securely hashed using bcrypt before storage.
- Authentication relies on HTTP-only capabilities and short-lived JSON Web Tokens (JWT).
- Role-based access control (RBAC) ensures users cannot access admin or delivery endpoints.
