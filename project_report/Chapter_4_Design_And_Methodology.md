# 4. DESIGN AND METHODOLOGY

## 4.1 System Design
System design is a primary phase of the software development. System design aims to identify the modules that should be in the system. Design is the first step in the development phase of any system product or system. It may be defined as "the process of applying various techniques and principles for the purpose of defining a device, process or a system in sufficient detail to permit its physical realization". The specification of these modules and how they interact with each other are the desired results. The goal of the design process is to produce a module or representation of the system which can be used later to build that system. It is the plan for the solution of the system. Design includes requirement specification and final solution for satisfying the requirements. In system design, attention is given to what components can be implemented in the software.

### 4.1.1 Functional Decompositions
The **Customer Module** is designed to empower customers to securely book services and purchase products. Through this module, users register by providing essential details. Once registered, users can log in to update their profiles, browse cosmetic products, and book stylist appointments. The system enables customers to join automated waitlists, apply exclusive coupons during checkout, and track real-time order delivery statuses.

The **Admin Module** serves as the central management system overseeing users, staff (barbers), services, products, and coupons. It provides secure login access for administrators to manage backend operations efficiently. Admins can generate analytical reports to monitor revenue, staff performance, and inventory. The appointment management feature allows viewing live bookings, while the order tracking system enables admins to auto-assign deliveries to field personnel.

The **Delivery Module** supports officials responsible for dispatching and delivering cosmetic products. After secure login, delivery boys can view assigned orders, locate the customer's address, and update the delivery status (e.g., Shipped, Out for Delivery, Delivered) which immediately triggers a notification to the customer.

## 4.2 Detailed Design

### 4.2.1 Data Flow Diagram (DFD)
A Data Flow Diagram views a system as a function that transforms the inputs into desired outputs. 

**Level 0 DFD (Context Diagram):**
- **Customer** interacts with the "Luxe Groom System" by sending booking requests, orders, and reviews, and receives status updates, invoices, and notifications.
- **Admin** interacts by sending configurations, managing staff, and generating reports.
- **Delivery Official** interacts by fetching order assignments and updating fulfillment statuses.

**Level 1 DFD (Customer):**
1. Customer inputs details -> Registration Process -> Stores in `Users Table`.
2. Customer inputs credentials -> Login Process -> Authenticates against `Users Table`.
3. Customer selects service/product -> Checkout Process -> Stores in `Appointments/Orders Table`.
4. Customer tracks order -> Tracking Process -> Fetches from `Orders Table`.

### 4.2.2 Structure Chart
A Structure Chart is a top-down modular design representing how a program has been partitioned into manageable modules hierarchy.
- **Main Admin Controller**
  - **Reports Module** (Revenue, Appointments, Sales)
  - **Management Module** (Services, Products, Coupons)
  - **User Module** (Customers, Staff, Delivery Boys)

### 4.2.3 UML Class Diagram
A UML Class Diagram represents the structural components of the system.
- **User Class**: Contains attributes like `id`, `name`, `email`, `password`, `role`. Methods include `login()`, `register()`.
- **Appointment Class**: Contains `appointmentId`, `customerId`, `barberId`, `serviceName`, `date`, `time`, `status`. Methods include `create()`, `cancel()`, `reschedule()`.
- **Order Class**: Contains `orderId`, `customerId`, `items`, `totalAmount`, `status`, `deliveryBoyId`. Methods include `updateStatus()`.
- **Product Class**: Contains `productId`, `name`, `price`, `stock`, `category`.

## 4.3 Database Design
The application utilizes structured data storage models where each entity is mapped with appropriate data types, constraints, and relational references.

### 4.3.1 Table Description:

#### 4.3.1.1 Users Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the user |
| name | varchar(255) | Not null | Name of the user |
| phone | bigint(20) | Not null | Phone number of the user |
| email | varchar(255) | Unique, Not null | Email address of the user |
| role | varchar(50) | Not null | Role of the user (customer, admin, staff, delivery) |
| address | varchar(255) | Null | Address of the user |
| password | varchar(255) | Not null | Password of the user |

#### 4.3.1.2 Appointments Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the appointment |
| customerId | bigint(20) | Foreign key | References id in Users Table |
| barberId | bigint(20) | Foreign key | References assigned Staff/Stylist |
| serviceName | varchar(255) | Not null | Name of the salon service booked |
| date | varchar(50) | Not null | Scheduled service date |
| time | varchar(50) | Not null | Scheduled appointment time slot |
| price | decimal(10,2) | Not null | Price of the service |
| status | varchar(50) | Not null | Status (Pending, Confirmed, Completed, Cancelled) |

#### 4.3.1.3 Orders Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the product order |
| customerId | bigint(20) | Foreign key | References id in Users Table |
| deliveryBoyId | bigint(20) | Foreign key, Null | References assigned Delivery Boy |
| totalAmount | decimal(10,2) | Not null | Total bill amount |
| address | varchar(255) | Not null | Delivery shipping address |
| paymentStatus | varchar(50) | Not null | Payment state (Paid, Pending, COD) |
| status | varchar(50) | Not null | Delivery status (Pending, Shipped, Delivered) |

#### 4.3.1.4 Products Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the product |
| name | varchar(255) | Not null | Name of the cosmetic item |
| category | varchar(100) | Not null | Category of the product |
| price | decimal(10,2) | Not null | Price of the product |
| stock | int(11) | Not null | Available stock units count |
| image | varchar(255) | Null | Product image URL/path |

#### 4.3.1.5 Coupons Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the coupon |
| code | varchar(50) | Unique, Not null | Promo voucher code string |
| discountType | varchar(50) | Not null | Type (percentage or flat) |
| discountValue | decimal(10,2) | Not null | Discount numeric value |
| assignedTo | varchar(255) | Null | Specific customer email |
| isActive | boolean | Not null | Coupon validity status |

#### 4.3.1.6 Reviews Table
| Column | Data type | Constraints | Descriptions |
| :--- | :--- | :--- | :--- |
| id | bigint(20) | Primary key | Id of the feedback review |
| customerId | bigint(20) | Foreign key | References id of customer |
| barberId | bigint(20) | Foreign key | References id of staff/stylist |
| rating | int(2) | Not null | Rating score (1 to 5) |
| comment | text | Null | Review message text |
| date | timestamp | Not null | Date and time of review |

