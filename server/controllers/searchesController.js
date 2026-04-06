/**
 * This file will control all saved search and preference queries
 * Methods exported:
 * saveSearch
 * getUserSearches
 * deleteSearch
 * getPreferences
 * savePreferences
 * updatePreferences
 */

const db = require('../db');

// 1. SAVE A SEARCH
const saveSearch = (req, res) => {
    const { user_id, search_name, origin_airport, destination_airport, departure_date, return_date, num_passengers, flexible_dates, notify_on_price_change, price_threshold } = req.body;

    if (!user_id || !origin_airport || !destination_airport || !departure_date || !num_passengers) {
        return res.status(400).json({
            success: false,
            error: "User ID, origin, destination, departure date, and number of passengers are required"
        });
    }

    const sql = `INSERT INTO SAVED_SEARCH 
                (User_ID, Search_name, Origin_airport, Destination_airport, Departure_date, Return_date, Num_passengers, Flexible_dates, Notify_on_price_change, Price_threshold) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        user_id, search_name || null, origin_airport, destination_airport,
        departure_date, return_date || null, num_passengers,
        flexible_dates || null, notify_on_price_change || false,
        price_threshold || null
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error saving search:", err);
            return res.status(500).json({ success: false, error: "Failed to save search" });
        }

        res.json({
            success: true,
            message: "Search saved successfully",
            search_id: result.insertId
        });
    });
};

// 2. GET ALL SAVED SEARCHES FOR A USER
const getUserSearches = (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    db.query(`SELECT * FROM SAVED_SEARCH WHERE User_ID = ?`, [user_id], (err, searches) => {
        if (err) {
            console.error("Error fetching searches:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        res.json({
            success: true,
            count: searches.length,
            searches: searches
        });
    });
};

// 3. DELETE A SAVED SEARCH
const deleteSearch = (req, res) => {
    const { search_id } = req.params;

    if (!search_id) {
        return res.status(400).json({ success: false, error: "Search ID is required" });
    }

    db.query(`SELECT * FROM SAVED_SEARCH WHERE Search_ID = ?`, [search_id], (err, searches) => {
        if (err) {
            console.error("Error finding search:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (searches.length === 0) {
            return res.status(404).json({ success: false, error: "Search not found" });
        }

        db.query(`DELETE FROM SAVED_SEARCH WHERE Search_ID = ?`, [search_id], (err) => {
            if (err) {
                console.error("Error deleting search:", err);
                return res.status(500).json({ success: false, error: "Failed to delete search" });
            }

            res.json({ success: true, message: "Search deleted successfully" });
        });
    });
};

// 4. GET USER PREFERENCES
const getPreferences = (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    db.query(`SELECT * FROM USER_PREFERENCE WHERE User_ID = ?`, [user_id], (err, preferences) => {
        if (err) {
            console.error("Error fetching preferences:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (preferences.length === 0) {
            return res.status(404).json({ success: false, error: "No preferences found for this user" });
        }

        res.json({ success: true, preferences: preferences[0] });
    });
};

// 5. SAVE PREFERENCES (for new users who haven't set preferences yet)
const savePreferences = (req, res) => {
    const { user_id } = req.params;
    const { preferred_airlines, seat_preference, budget_min, budget_max, meal_preference, preferred_departure_time, max_layovers, preferred_checked_bags, preferred_carry_on_bags, preferred_trip_type } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    //first, get the next Preference_ID
    db.query(`SELECT MAX(Preference_ID) as maxId FROM USER_PREFERENCE`, (err, result) => {
        if (err) {
            console.error("Error getting next ID:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        const nextPrefId = (result[0].maxId || 0) + 1;

        const sql = `INSERT INTO USER_PREFERENCE 
                    (Preference_ID, User_ID, Preferred_airlines, Seat_preference, Budget_min, Budget_max, Meal_preference, Preferred_departure_time, Max_layovers, Preferred_checked_bags, Preferred_carry_on_bags, Preferred_trip_type) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            nextPrefId, user_id, preferred_airlines || null, seat_preference || null,
            budget_min || null, budget_max || null, meal_preference || null,
            preferred_departure_time || null, max_layovers || null,
            preferred_checked_bags || null, preferred_carry_on_bags || null,
            preferred_trip_type || null
        ];

        db.query(sql, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, error: "Preferences already exist for this user. Use update instead." });
                }
                console.error("Error saving preferences:", err);
                return res.status(500).json({ success: false, error: "Failed to save preferences" });
            }

            res.json({
                success: true,
                message: "Preferences saved successfully",
                preference_id: result.insertId
            });
        });
    });
};

// 6. UPDATE PREFERENCES
const updatePreferences = (req, res) => {
    const { user_id } = req.params;
    const { preferred_airlines, seat_preference, budget_min, budget_max, meal_preference, preferred_departure_time, max_layovers, preferred_checked_bags, preferred_carry_on_bags, preferred_trip_type } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    // check if preferences exist for this user
    db.query(`SELECT * FROM USER_PREFERENCE WHERE User_ID = ?`, [user_id], (err, preferences) => {
        if (err) {
            console.error("Error checking preferences:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (preferences.length === 0) {
            return res.status(404).json({ success: false, error: "No preferences found. Use save instead." });
        }

        // build dynamic update query
        let updateFields = [];
        let updateValues = [];

        if (preferred_airlines !== undefined) { updateFields.push("Preferred_airlines = ?"); updateValues.push(preferred_airlines); }
        if (seat_preference !== undefined) { updateFields.push("Seat_preference = ?"); updateValues.push(seat_preference); }
        if (budget_min !== undefined) { updateFields.push("Budget_min = ?"); updateValues.push(budget_min); }
        if (budget_max !== undefined) { updateFields.push("Budget_max = ?"); updateValues.push(budget_max); }
        if (meal_preference !== undefined) { updateFields.push("Meal_preference = ?"); updateValues.push(meal_preference); }
        if (preferred_departure_time !== undefined) { updateFields.push("Preferred_departure_time = ?"); updateValues.push(preferred_departure_time); }
        if (max_layovers !== undefined) { updateFields.push("Max_layovers = ?"); updateValues.push(max_layovers); }
        if (preferred_checked_bags !== undefined) { updateFields.push("Preferred_checked_bags = ?"); updateValues.push(preferred_checked_bags); }
        if (preferred_carry_on_bags !== undefined) { updateFields.push("Preferred_carry_on_bags = ?"); updateValues.push(preferred_carry_on_bags); }
        if (preferred_trip_type !== undefined) { updateFields.push("Preferred_trip_type = ?"); updateValues.push(preferred_trip_type); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: "No fields provided to update" });
        }

        updateValues.push(user_id);
        const sql = `UPDATE USER_PREFERENCE SET ${updateFields.join(', ')} WHERE User_ID = ?`;

        db.query(sql, updateValues, (err) => {
            if (err) {
                console.error("Error updating preferences:", err);
                return res.status(500).json({ success: false, error: "Failed to update preferences" });
            }

            res.json({ success: true, message: "Preferences updated successfully" });
        });
    });
};

module.exports = { saveSearch, getUserSearches, deleteSearch, getPreferences, savePreferences, updatePreferences };