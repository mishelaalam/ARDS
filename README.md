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
Set up authentication packages needed:
```bash
npm install bcryptjs jsonwebtoken
npm audit fix
```
Create a `.env` file inside the `server` folder:
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=AIRPORT_RESERVATION_DATABASE

# JWT Secret for authentication
JWT_SECRET=your-super-secret-key-change-this-in-production-12345
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
├── client/          # React + Tailwind frontend
├── server/          # Node.js + Express backend
│   ├── index.js
│   └── .env         # Never pushed to GitHub - create your own
└── database/
    └── schema.sql   # Run this to create all tables
```

---

## Team
Group 5 — CPSC 471 W26