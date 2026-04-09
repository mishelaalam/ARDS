/**
 * This file will control all admin queries
 * Methods exported:
 * addFlight
 * updateFlight
 * deleteFlight
 * getAllBookings
 */

const db = require('../db');

// 1. ADD A NEW FLIGHT
const addFlight = (req, res) => {
    const { airline_id, flight_number, departure_date, departure_time, arrival_time, duration, base_price, status, aircraft_type, available_seats, departure_airport_code, arrival_airport_code } = req.body;

    if (!airline_id || !flight_number || !departure_date || !departure_time || !base_price || !status || !departure_airport_code || !arrival_airport_code) {
        return res.status(400).json({
            success: false,
            error: "Airline ID, flight number, departure date, departure time, base price, status, departure and arrival airport codes are required"
        });
    }

    const sql = `INSERT INTO FLIGHT 
                (Airline_ID, Flight_number, Departure_date, Departure_time, Arrival_time, Duration, Base_price, Status, Aircraft_type, Available_seats, Departure_Airport_Code, Arrival_Airport_Code) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        airline_id, flight_number, departure_date, departure_time,
        arrival_time || null, duration || null, base_price,
        status, aircraft_type || null, available_seats || 0,
        departure_airport_code, arrival_airport_code
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error adding flight:", err);
            return res.status(500).json({ success: false, error: "Failed to add flight" });
        }

        res.json({
            success: true,
            message: "Flight added successfully",
            flight_id: result.insertId
        });
    });
};

// 2. UPDATE A FLIGHT
const updateFlight = (req, res) => {
    const { flight_id } = req.params;
    const { flight_number, departure_date, departure_time, arrival_time, duration, base_price, status, aircraft_type, available_seats } = req.body;

    if (!flight_id) {
        return res.status(400).json({ success: false, error: "Flight ID is required" });
    }

    // check if flight exists
    db.query(`SELECT * FROM FLIGHT WHERE Flight_ID = ?`, [flight_id], (err, flights) => {
        if (err) {
            console.error("Error finding flight:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (flights.length === 0) {
            return res.status(404).json({ success: false, error: "Flight not found" });
        }

        // build dynamic update query
        let updateFields = [];
        let updateValues = [];

        if (flight_number !== undefined) { updateFields.push("Flight_number = ?"); updateValues.push(flight_number); }
        if (departure_date !== undefined) { updateFields.push("Departure_date = ?"); updateValues.push(departure_date); }
        if (departure_time !== undefined) { updateFields.push("Departure_time = ?"); updateValues.push(departure_time); }
        if (arrival_time !== undefined) { updateFields.push("Arrival_time = ?"); updateValues.push(arrival_time); }
        if (duration !== undefined) { updateFields.push("Duration = ?"); updateValues.push(duration); }
        if (base_price !== undefined) { updateFields.push("Base_price = ?"); updateValues.push(base_price); }
        if (status !== undefined) { updateFields.push("Status = ?"); updateValues.push(status); }
        if (aircraft_type !== undefined) { updateFields.push("Aircraft_type = ?"); updateValues.push(aircraft_type); }
        if (available_seats !== undefined) { updateFields.push("Available_seats = ?"); updateValues.push(available_seats); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: "No fields provided to update" });
        }

        updateValues.push(flight_id);
        const sql = `UPDATE FLIGHT SET ${updateFields.join(', ')} WHERE Flight_ID = ?`;

        db.query(sql, updateValues, (err) => {
            if (err) {
                console.error("Error updating flight:", err);
                return res.status(500).json({ success: false, error: "Failed to update flight" });
            }

            res.json({ success: true, message: "Flight updated successfully" });
        });
    });
};

// 3. DELETE A FLIGHT
const deleteFlight = (req, res) => {
    const { flight_id } = req.params;

    if (!flight_id) {
        return res.status(400).json({ success: false, error: "Flight ID is required" });
    }

    // check if flight exists
    db.query(`SELECT * FROM FLIGHT WHERE Flight_ID = ?`, [flight_id], (err, flights) => {
        if (err) {
            console.error("Error finding flight:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (flights.length === 0) {
            return res.status(404).json({ success: false, error: "Flight not found" });
        }

        db.query(`DELETE FROM FLIGHT WHERE Flight_ID = ?`, [flight_id], (err) => {
            if (err) {
                console.error("Error deleting flight:", err);
                return res.status(500).json({ success: false, error: "Failed to delete flight" });
            }

            res.json({ success: true, message: "Flight deleted successfully" });
        });
    });
};

// 4. GET ALL BOOKINGS (admin monitoring)
const getAllBookings = (req, res) => {
    const sql = `SELECT 
                    b.Booking_ID,
                    b.Booking_reference,
                    b.Total_cost,
                    b.Status,
                    b.Booking_type,
                    b.Booking_date,
                    b.Num_passengers,
                    u.Username,
                    u.Email,
                    f.Flight_number,
                    f.Departure_time,
                    f.Arrival_time,
                    al.Airline_name as airline,
                    dep.Airport_Code as origin_code,
                    dep.City as origin_city,
                    arr.Airport_Code as destination_code,
                    arr.City as destination_city
                FROM BOOKING b
                JOIN USER u ON b.User_ID = u.User_ID
                JOIN FLIGHT f ON b.Outbound_Flight_ID = f.Flight_ID
                JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
                JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
                JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
                ORDER BY b.Booking_date DESC`;

    db.query(sql, (err, bookings) => {
        if (err) {
            console.error("Error fetching bookings:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        res.json({
            success: true,
            count: bookings.length,
            bookings: bookings
        });
    });
};

// 5. GET ALL FLIGHTS (admin view)
const getAllFlights = (req, res) => {
    const sql = `SELECT 
                    f.Flight_ID,
                    f.Airline_ID,
                    f.Flight_number,
                    f.Departure_date,
                    f.Departure_time,
                    f.Arrival_time,
                    f.Duration,
                    f.Base_price,
                    f.Status,
                    f.Available_seats,
                    f.Aircraft_type,
                    al.Airline_name as airline,
                    dep.Airport_Code as origin_code,
                    dep.City as origin_city,
                    arr.Airport_Code as destination_code,
                    arr.City as destination_city
                FROM FLIGHT f
                JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
                JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
                JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
                ORDER BY f.Flight_ID ASC`;

    db.query(sql, (err, flights) => {
        if (err) {
            console.error("Error fetching flights:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        res.json({
            success: true,
            count: flights.length,
            flights: flights
        });
    });
};

module.exports = { addFlight, updateFlight, deleteFlight, getAllBookings, getAllFlights };