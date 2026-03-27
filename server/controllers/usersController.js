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
    let sql = `SELECT u.User_ID, u.Username, u.Email, u.Phone, u.Date_Registered, c.Loyalty_Points, c.Account_status
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
            });
        }

        //if here, success in finding user --> return their info
        res.json({
            success: true,
            user: users[0]
        });
    });
};

//2. UPDATE PERSONAL INFO
const updateUserInfo = (req, res) => {
    const { user_id } = req.params;

    const { 
        username, 
        email, 
        phone,
        first_name,
        last_name
    } = req.body;

    //if no user_id, return error
    if(!user_id) {
        return res.status(400).json({
            success: false,
            error: "User ID is required"
        });
    }

    //check if the user exists
    db.query('SELECT User_ID FROM USER WHERE User_ID = ?', [user_id], (err, users) => {
        //error checking for fetching user
        if(err) {
            console.error("Error checking user:", err);
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
            });
        }

        //build a dynamic update query based on fields the user wishes to update
        let updateFields = [];
        let updateValues = [];

        //if username is being updated, push username to fields and push the updated username to values
        if(username) {
            updateFields.push("Username = ?");
            updateValues.push(username);
        }
        //same for rest of the body
        if(email) {
            updateFields.push("Email = ?");
            updateValues.push(email);
        }
        if(phone) {
            updateFields.push("Phone = ?");
            updateValues.push(phone);
        }
        if(first_name) {
            updateFields.push("First_name = ?");
            updateValues.push(first_name);
        }
        if(last_name) {
            updateFields.push("Last_name = ?");
            updateValues.push(last_name);
        }

        //check if there is anything to update, if not return error json
        if(updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No fields provided to update"
            });
        }

        //add user_id to values array --> need so we can access which user to update
        updateValues.push(user_id);

        //build the sql update query
        //make sure to updated all fields the user wants to update
        const sql = `UPDATE USER SET ${updateFields.join(', ')} WHERE User_ID = ?`;

        //send to database
        db.query(sql, updateValues, (err, result) => {
            //handle error
            if(err) {
                //handle duplicate email error
                if(err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        error: "Email already exists"
                    });
                }
                //handle any other error
                console.error("Error updating user:", err);
                return res.status(500).json({
                    success: false,
                    error: "Failed to update user information"
                });
            }

            //no errors --> proceed with updating
            //get the updated user info (not including password) to send as json
            let updateSQL = `SELECT User_ID, Username, Email, Phone, Date_Registered 
                            FROM USER WHERE User_ID = ?`;
            db.query(updateSQL, [user_id], (err, updatedUser) => {
                //if we have reached here, the data has been successfully updated
                //if err, the user has given the same information as before possibly 
                //--> still send successfully, just no new updated info for that user
                if(err) {
                    return res.json({
                        success: true,
                        message: "User information updated successfully"
                    });
                }

                //send updated json along with the new user information
                res.json({
                    success: true,
                    message: "User information updated successfully",
                    user: updatedUser[0]
                });
            });
        });
    });
};

//3. UPDATE PASSWORD (seperate this to model like real world applications)
const updateUserPassword = (req, res) => {

};


module.exports = { getUserProfile, updateUserInfo, updateUserPassword };