/**
 * This file will control all authentication queries that can be done by the user
 * It will contain the actual logic + SQL queries that is going to be called in auth.js
 * Methods that will be exported from here:
 * Register
 * Login
 */

const db = require('../db');

//helper to get the next user ID for registering new users, it will incrmement for every new registered user
const getNextUserId = (callback) => {
    db.query(`SELECT MAX(User_ID) as max_id FROM USER`, (err, result) => {
        //handle error
        if (err) {
            return callback(err, null);
        }
        //no error --> return the nextID which is just incrimented by the max_id in the database
        const nextId = (result[0].max_id || 0) + 1;
        callback(null, nextId);
    });
};

//1. REGISTER
//create a new user into the database
const register = (req, res) => {
    //require username, email, password, and phone as input
    const { username, email, password, phone } = req.body;

    //phone is optional, the rest required to make an account
    if(!username || !email || !password) {
        return res.status(400).json({
            success: false,
            error: "Username, email, and password are required"
        });
    }

    //error handling: check if email exists, if it does => fail
    db.query(`SELECT User_ID FROM USER WHERE Email = ?`, [email], (err, existing) => {
        //handle error for this query
        if(err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        //if existing has the email in the databse, return false --> email already registered
        if(existing.length > 0) {
            return res.status(409).json({ success: false, error: "Email already registered" });
        }

        //if here, user is not already registed --> register them into database
        //first get the next Id
        getNextUserId((err, nextId) => {
            if(err) { //handle error
                return res.status(500).json({ success: false, error: err.message });
            }

            //when we register a user, we also store the date that they register
            //get current date
            const currentDate = new Date().toISOString().split('T')[0];

            //now insert the new user (register them)
            let sql = `INSERT INTO USER (User_ID, Username, Email, Phone, Password_hash, Date_Registered) VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(sql, [nextId, username, email, phone || null, password, currentDate], (err, result) => {
                //handle error for this query
                if(err) {
                    return res.status(500).json({ success: false, error: err.message });
                }

                //insert into customer data table now
                db.query(`INSERT INTO CUSTOMER (User_ID, Loyalty_Points, Account_status) VALUES (?, ?, ?)`, [nextId, 0, 'Active'], (err, result) => {
                    res.status(201).json({
                        success: true,
                        message: "Account created successfully",
                        user: {
                            user_id: nextId,
                            username: username,
                            email: email,
                            phone: phone || null //if no phone provided, fill null
                        }
                    });
                });
            });
        });
    });
};

//2. LOGIN --> simple email/password check
const login = (req, res) => {
    //need inputs email and password to login
    const { email, password } = req.body;

    //must input these fields, otherwise return fail
    if(!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Email and password are required"
        });
    }

    //sql query, check if the user exists in our database
    let sql = `SELECT u.User_ID, u.Username, u.Email, u.Phone, c.Loyalty_Points, c.Account_status
                FROM USER u
                LEFT JOIN CUSTOMER c ON u.User_ID = c.User_ID
                WHERE u.Email = ? AND u.Password_hash = ?`;

    db.query(sql, [email, password], (err, users) => {
        //handle error for this query
        if(err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        //if no user in database matching what the user had inputted, return fail
        if(users.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        //if here, successfull login, get the user that matches the account the user wants to login to
        const user = users[0];

        //send json information for successful login
        res.json({
            success: true,
            message: "Login successful",
            user: {
                user_id: user.User_ID,
                username: user.Username,
                email: user.Email,
                phone: user.Phone,
                loyalty_points: user.Loyalty_Points || 0, //if no loyalty points display 0
                account_status: user.Account_status || "Active" //if no status, display active
            }
        });
    });
};

module.exports = { register, login };