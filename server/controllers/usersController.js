// coming soon
/**
 * This file will control all user queries that can be done by the user
 * It will contain the actual logic + SQL queries that is going to be called in user.js
 * Methods that will be exported from here:
 * getUserProfile
 * updateUserInfo
 * updateUserPassword
 */

const db = require('../db');

//1. GET PROFILE --> getter
const getUserProfile = (req, res) => {
    const { user_id } = req.params;

    //if no user_id, return error
    if(!user_id) {
        return res.status(400).json({
            success: false,
            error: "User ID is required"
        });
    }

    //sql query
    let sql = `SELECT u.User_ID, u.Username, u.Email, u.Phone, u.Date_Registered,
                c.Loyalty_Points, c.Account_status
                FROM USER u
                LEFT JOIN CUSTOMER c ON u.User_ID = c.User_ID
                WHERE u.User_ID = ?`
    //db query
    db.query(sql, [user_id], (err, users) => {
        //error checking for fetching user
        if(err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({
                success: false,
                error: "Database error"
            });
        }

        //if there are no users, return error
        if(users.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            })
        }

        //if here, success in finding user --> return their info
        res.json({
            success: true,
            user: users[0]
        });
    });
};


module.exports = { getUserProfile };