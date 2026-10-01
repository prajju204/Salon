# 6. RESULT AND EVALUATION

## 6.1 Introduction
Result and Evaluation is an investigation conducted to provide stakeholders with information about the quality of the product or service under test. It has been defined as the process of analyzing a software item to detect the differences between existing and required conditions and to evaluate the features of the software item.

It involves operation of a system or application under controlled conditions and evaluating the results. The objective is to intentionally introduce faults into the system to verify whether the functions perform correctly under specific conditions, and to validate that happy paths behave as expected.

## 6.2 Test Scenario
A test scenario is a high-level description of a functionality or feature that needs to be tested within a software application. It represents a real-world situation that a user might encounter while using the system. The purpose of creating test scenarios is to ensure that every aspect of the application is covered during testing and that the system behaves as expected under different conditions.

For Luxe Groom, critical test scenarios include user authentication flows, dynamic appointment scheduling without slot overlapping, seamless e-commerce transactions, real-time tracking updates by delivery personnel, and real-time socket notification delivery.

## 6.3 Test Cases
A test case is a software testing document, which consists of event, action, input, output, expected result and actual result.

### 6.3.1 Registration Form
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If user clicks on register button without entering name. | Enter your username. | Successful |
| 2. | If user clicks on register button without entering phone number. | Enter your phone number. | Successful |
| 3. | If user enters phone number with less than or more than 10 digits. | Mobile number must be 10 digits. | Successful |
| 4. | If user clicks on register button without entering email id. | Enter your email id. | Successful |
| 5. | If user enters invalid email format (e.g. missing @ or domain). | Enter a valid email address. | Successful |
| 6. | If user clicks on register button without entering password. | Enter your password. | Successful |
| 7. | If user enters password without special character or < 8 chars. | Password must be at least 8 characters with a special character. | Successful |
| 8. | If user clicks on register button without entering confirm password. | Enter your confirm password. | Successful |
| 9. | If password and confirm password do not match. | Password do not match. | Successful |
| 10. | If user enters all valid registration details. | Registration successful. | Successful |

### 6.3.2 Login Form
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If user clicks on login button without entering email id. | Enter your email id. | Successful |
| 2. | If user clicks on login button without entering password. | Enter your password. | Successful |
| 3. | If user enters unregistered email or wrong password. | Invalid credentials. | Successful |
| 4. | If user enters valid email and correct password. | Login successful and redirect to Dashboard. | Successful |

### 6.3.3 Service Booking Form
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If customer tries to book without selecting service. | Please select a salon service. | Successful |
| 2. | If customer tries to book without selecting barber stylist. | Please select a stylist. | Successful |
| 3. | If customer tries to book without selecting date and time. | Please select date and time slot. | Successful |
| 4. | If customer books an already reserved slot. | Time slot already booked, please select another. | Successful |
| 5. | If customer enters valid booking details. | Appointment booked successfully. | Successful |

### 6.3.4 Product Purchase & Checkout
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If customer clicks checkout with empty cart. | Your cart is empty. | Successful |
| 2. | If customer proceeds without entering delivery address. | Enter your delivery address. | Successful |
| 3. | If customer applies an invalid or expired coupon code. | Invalid or expired coupon code. | Successful |
| 4. | If customer enters valid details and confirms order. | Order placed successfully. | Successful |

### 6.3.5 Delivery Module
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If delivery boy logs in without credentials. | Enter valid delivery login details. | Successful |
| 2. | If delivery boy views assigned orders list. | Display assigned customer orders and addresses. | Successful |
| 3. | If delivery boy updates status to 'Out for Delivery' / 'Delivered'. | Status updated and notification sent to customer. | Successful |

### 6.3.6 Staff Review & Rating Form
| Sl. No. | Test Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1. | If customer submits review without selecting star rating. | Please provide a rating. | Successful |
| 2. | If customer submits review with comment and rating. | Review submitted and staff receives notification. | Successful |

