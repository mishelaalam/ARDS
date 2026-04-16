# Airline Reservation Database System (ARDS)
### CPSC 471 - Database Systems | Group 5

A simplified flight booking web application that reduces choice overload by displaying only the top 3-5 recommended flights based on user preferences.

---

## Tech Stack
- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL

---

## Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version)
- [MySQL](https://dev.mysql.com/downloads/mysql/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository in VS code terminal
```bash
git clone https://github.com/mishelaalam/ARDS.git
cd ARDS
```

### 2. Set Up the Database
- Open MySQL Workbench and connect to your local instance
- Create a new schema called `ards`
- Open a new query tab, paste the contents of `database/schema.sql` and run it
- All tables will be created automatically

### 3. Set Up the Backend in VS Code
```bash
cd server
npm install
```
Create a `.env` file inside the `server` folder:
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=AIRPORT_RESERVATION_DATABASE
```
Then start the server:
```bash
node index.js
```
You should see:
```
Server running on port 5000
Connected to MySQL database!
```

### 4. Set Up the Frontend
```bash
cd ../client
npm install
npm run dev
```
The app will be running at `http://localhost:5173`

---

## Project Structure
```
ARDS/
├── client/                     # React + Tailwind frontend
|   ├── src/
|   │   ├── pages/              # Full pages (routes)
|   │   │   ├── LoginPage.jsx          	
|   │   │   ├── Dashboard.jsx          	
|   │   │   ├── AdminDashboard.jsx  
|   │   │   ├── SearchPage.jsx 	
|   │   │   ├── BookingPage.jsx        	
|   │   │   ├── BookingsPage.jsx       	
|   │   │   └── ProfilePage.jsx        	
|   │   ├── components/ 		# Reusable UI (discarded most, uneeded)
│   │   |   └── AdminRoute.jsx  # route definition for admin (seperate for organization)   
|   │   ├── api/                # API calls (mirrors backend routes)
|   │   │   ├── auth.js                	
|   │   │   ├── users.js               	
|   │   │   ├── admin.js               	
|   │   │   ├── flights.js             	
|   │   │   ├── searches.js                   
|   │   │   └── bookings.js            	
|   │   ├── context/ 		    # all pages can access it without passing it around everywhere
|   │   │   └── AuthContext.jsx # store the logged in user's info
|   │   ├── App.jsx             # Route definitions (React Router)
|   │   ├── main.jsx            # Entry point (leave mostly unchanged)
|   │   └── index.css           # Tailwind / global styles
|   ├── public/
|   │   └── favicon.ico
|   ├── index.html
|   ├── package.json
|   ├── tailwind.config.js
|   └── vite.config.js
├── server/                     # Node.js + Express backend
|   ├── index.js                # Entry point (starts server, connects routes)
|   ├── db.js                   # Database connection
|   ├── routes/                 # Handles URLs
|   │   ├── auth.js
|   │   ├── users.js
|   │   ├── flights.js
|   │   ├── bookings.js
|   │   ├── searches.js
|   │   └── admin.js
|   ├── controllers/            # Handles logic + SQL
|   │   ├── authController.js
|   │   ├── usersController.js
|   │   ├── flightsController.js
|   │   ├── bookingsController.js
|   │   ├── searchesController.js
|   │   └── adminController.js
│   └── .env                    # Never pushed to GitHub - create your own
└── database/
    └── schema.sql              # Run this to create all tables
```

---

## Team
Group 5 — CPSC 471 W26