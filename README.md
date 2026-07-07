# Luxe Groom Salon Management System

A comprehensive Salon Management System featuring a customer booking portal and an admin dashboard.

## MongoDB Atlas Setup & Network Access

This project uses MongoDB Atlas for its database. 

### IP Whitelisting (Important)
MongoDB Atlas restricts database access to whitelisted IP addresses by default. 

#### Development Environment
When developing locally (especially on Wi-Fi, Mobile Hotspots, or dynamic IPs), your public IP address may change frequently, causing connection errors. 

To configure MongoDB Atlas for local development:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Network Access** under the Security tab.
3. Click **Add IP Address**.
4. Select **Allow Access From Anywhere**.
5. This will add the IP address `0.0.0.0/0`.
6. Click **Confirm**.

> ⚠️ **WARNING**: Using `0.0.0.0/0` allows any IP address to attempt a connection to your database. This is strictly for development convenience and should **NEVER** be used in a production environment.

#### Production Environment
For production deployments, you must strictly limit database access:
1. Navigate to **Network Access** in MongoDB Atlas.
2. Remove the `0.0.0.0/0` rule.
3. Add only the specific static IPs of your production servers (e.g., your VPS IP, Vercel/Render static egress IPs, or Cloud hosting IP).

### Environment Variables
Store your MongoDB connection string securely in the `.env` file located in the `server` directory.

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/salon
PORT=5000
```
> **Note:** Never hardcode credentials in the source code.

### Connection Error Handling
The backend is designed to handle network interruptions gracefully. If the database is unreachable on startup:
- The server will not crash.
- It will automatically retry the connection every 5 seconds.
- Clear error messages will be logged detailing possible reasons (e.g., Internet disconnected, IP not whitelisted).
- If the connection drops during operation, Mongoose will attempt to automatically reconnect.

*Note: It is not possible for the application to automatically add/remove IP addresses in the MongoDB Atlas whitelist without utilizing the Atlas Administration API with secure API keys.*
