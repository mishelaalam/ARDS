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
Open a terminal and do these commands:
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
Open another terminal and do these commands (you must have two terminals, one for backend and the other for frontend):
```bash
cd ../client
npm install
npm run dev
```
The app will be running at `http://localhost:5173`

---

## Test Accounts

You can log in with these sample accounts from the database:

| Role | Email | Password |
|------|-------|----------|
| Customer | hannah@gmail.com | hash123 |
| Customer | alex@gmail.com | hash456 |
| Admin | admin@yyc.com | hash789 |

---

## Sample Flight Routes

The following routes have multiple flights available for testing recommendations:

| Route | Dates Available |
|-------|----------------|
| Calgary (YYC) → Los Angeles (LAX) | May 1, 2026 |
| Calgary (YYC) → New York (JFK) | May 2, 2026 |
| Calgary (YYC) → San Francisco (SFO) | May 3, 2026 |

---

## Project Structure
```
ARDS/
├── client/                         # React + Tailwind frontend
|   ├── src/
|   │   ├── pages/                  # Full pages (routes)
|   │   │   ├── LoginPage.jsx       # Handles user authentication   	
|   │   │   ├── Dashboard.jsx       # Shows quick access to all features	
|   │   │   ├── AdminDashboard.jsx  
|   │   │   ├── SearchPage.jsx 	    # Search flights, compare flights, and book
|   │   │   ├── BookingPage.jsx     # Confirm a booking   	
|   │   │   ├── BookingsPage.jsx    # View user's bookings      	
|   │   │   └── ProfilePage.jsx        	
|   │   ├── components/ 		    # Reusable UI (discarded most, uneeded)
│   │   |   └── AdminRoute.jsx      # route definition for admin (seperate for organization)   
|   │   ├── api/                    # API calls (mirrors backend routes)
|   │   │   ├── auth.js                	
|   │   │   ├── users.js               	
|   │   │   ├── admin.js               	
|   │   │   ├── flights.js             	
|   │   │   ├── searches.js                   
|   │   │   └── bookings.js            	
|   │   ├── context/ 		        # all pages can access it without passing it around everywhere
|   │   │   └── AuthContext.jsx     # store the logged in user's info
|   │   ├── App.jsx                 # Route definitions (React Router)
|   │   ├── main.jsx                # Entry point (leave mostly unchanged)
|   │   └── index.css               # Tailwind / global styles
|   ├── public/
|   │   └── favicon.ico
|   ├── index.html
|   ├── package.json
|   ├── tailwind.config.js
|   └── vite.config.js
├── server/                         # Node.js + Express backend
|   ├── index.js                    # Entry point (starts server, connects routes)
|   ├── db.js                       # Database connection
|   ├── routes/                     # Handles URLs
|   │   ├── auth.js
|   │   ├── users.js
|   │   ├── flights.js
|   │   ├── bookings.js
|   │   ├── searches.js
|   │   └── admin.js
|   ├── controllers/                # Handles logic + SQL
|   │   ├── authController.js
|   │   ├── usersController.js
|   │   ├── flightsController.js
|   │   ├── bookingsController.js
|   │   ├── searchesController.js
|   │   └── adminController.js
│   └── .env                        # Never pushed to GitHub - create your own
└── database/
    └── schema.sql                  # Run this to create all tables
```

---

## Important Notes

- The `.env` file is **never pushed to GitHub** — each team member creates their own with their local MySQL password
- Available flight dates in the sample data range from **May 1–5, 2026**

---


## Team
Group 5 — CPSC 471 W26
- Hannah Xia
- Mishela Alam
- Adeeba Chowdhury