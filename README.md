# RestroFlow — Modern Restaurant Menu & Order Management System

A full-stack, real-time restaurant management solution powered by **React 18 + Express + MongoDB + Socket.IO**.

---

## 👥 Authentication & Roles

RestroFlow comes with role-based access control and built-in demo credentials for immediate testing:

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Waiter** | `waiter@restaurant.com` | `password123` | Selects table, browses menu, adds cart items & special notes, sends orders to kitchen, tracks live status, and marks orders as **Served**. |
| **Kitchen** | `kitchen@restaurant.com` | `password123` | Receives incoming orders with audio chime, advances status to **Cooking / Preparing**, marks orders **Ready for Pickup**. |
| **Manager / Admin** | `admin@restaurant.com` | `password123` | Full access across Waiter, Kitchen, and **All Orders** analytics hub. |

> ⚡ **Quick 1-Click Login:** On the Login page (`/login`), click the one-touch demo buttons (**Waiter Sarah**, **Chef Marco**, or **Manager Alex**) to log in without typing credentials.

---

## 🔄 End-to-End Order Lifecycle Flow

Here is how the complete flow works in real time across the stations:

```
[1. Waiter Panel]
   │
   ▼ Waiter selects Table #, adds items & notes, clicks "Send Order to Kitchen"
[Status: PENDING]
   │
   ▼ Instant WebSocket alert & audio chime arrives at Kitchen Display
[2. Kitchen KDS - Column 1: New Orders]
   │
   ▼ Chef clicks "Start Preparing"
[Status: PREPARING (In Progress)]
   │
   ▼ Timer runs while cooking; Waiter sees status change to "Cooking in Progress"
[3. Kitchen KDS - Column 2: Cooking]
   │
   ▼ Chef finishes cooking and clicks "Mark as Ready (Done)"
[Status: READY FOR PICKUP]
   │
   ▼ Waiter receives instant sound & screen toast: "Table #X is READY for pickup!"
[4. Waiter Panel / Orders Tab]
   │
   ▼ Waiter picks up plates, delivers to table, and clicks "🍽️ Mark as Served"
[Status: SERVED (Completed)]
```

---

## 📋 Central "All Orders" Hub (`/orders`)

Allows Waiters, Kitchen Chefs, and Managers to:
- **Filter** orders by status: `All`, `Pending`, `Preparing`, `Ready`, `Served`, `Cancelled`.
- **Search** in real-time by Table number, waiter name, item name, or order ID.
- **Analytics & Revenue:** View total orders, active kitchen queue, served meals, and total restaurant sales revenue.
- **Itemized Receipts:** Click the eye icon on any order to inspect the full bill breakdown with timestamps.
- **Status Override:** Advance or cancel any order directly from the dashboard.

---

## 🚀 Running the Project

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` (e.g. `mongod` or MongoDB Compass/Service).

### 2. Seed Initial Menu & Demo Accounts
```bash
cd server
npm run seed
```

### 3. Start Backend Server
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

### 4. Start React Frontend
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```
