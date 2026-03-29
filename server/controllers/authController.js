// coming soon
/**
 * This file will control all authentication queries that can be done by the user
 * It will contain the actual logic + SQL queries that is going to be called in auth.js
 * Methods that will be exported from here:
 */

const db = require('../db');

//helper to get the next user ID for registering new users, it will incrmement for every new registered user
const getNextUserId = (callback) => {
    db.query('SELECT MAX(User_ID) as max_id FROM USER', (err, result) => {
        if (err) {
            return callback(err, null);
        }
        const nextId = (result[0].max_id || 0) + 1;
        callback(null, nextId);
    });
};