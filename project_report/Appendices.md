# APPENDICES

## Appendix A: System Screenshots

*(Note: The final Word document will contain actual images from the application including login pages, dashboards, booking interfaces, and e-commerce shopping carts. Insert screenshots here as necessary.)*

1. **Customer Portal:**
   - Registration and Login Pages
   - Service Booking Interface
   - E-Commerce Product Listing and Cart
   - Customer Dashboard and Appointment History
   - Digital Wallet and Notifications

2. **Admin Portal:**
   - Admin Login
   - Central Dashboard Analytics
   - User, Staff, and Delivery Personnel Management
   - Service and Product Management
   - Orders and Appointment Management
   - Notification and Leave Request Management

3. **Staff/Delivery Portal:**
   - Assigned Appointments View
   - Assigned Delivery Orders View
   - Update Status Interfaces
   - Staff Performance and Reviews

## Appendix B: Code Snapshots

### 1. Database Connection (MongoDB)
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

### 2. Express Server Setup (server.js)
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. React Component Example (Customer Dashboard)
```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get('/api/auth/appointments');
        setAppointments(data.data);
      } catch (error) {
        console.error('Error fetching appointments', error);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="dashboard">
      <h2>Your Appointments</h2>
      <ul>
        {appointments.map((apt) => (
          <li key={apt._id}>{apt.serviceName} - {apt.date}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
```
