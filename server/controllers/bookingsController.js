/**
 * This file will control all booking queries
 * Methods exported:
 * createBooking
 * getUserBookings
 * cancelBooking
 */

const db = require('../db');

// 1. CREATE BOOKING
const createBooking = (req, res) => {
    const { user_id, flight_id, num_passengers, booking_type, return_flight_id } = req.body;

    // validate required fields
    if (!user_id || !flight_id || !num_passengers || !booking_type) {
        return res.status(400).json({
            success: false,
            error: "User ID, flight ID, number of passengers, and booking type are required"
        });
    }

    // check if flight exists and has enough seats
    db.query(`SELECT * FROM FLIGHT WHERE Flight_ID = ? AND Available_seats >= ?`, 
    [flight_id, num_passengers], (err, flights) => {
        if (err) {
            console.error("Error checking flight:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (flights.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Flight not found or not enough seats available"
            });
        }

        const flight = flights[0];
        const total_cost = flight.Base_price * num_passengers;

        // generate a booking reference
        const booking_reference = 'REF' + Date.now();
        const booking_date = new Date().toISOString().split('T')[0];

        // insert the booking
        const sql = `INSERT INTO BOOKING 
                    (User_ID, Total_cost, Status, Booking_reference, Booking_type, Booking_date, Num_passengers, Outbound_Flight_ID, Return_Flight_ID) 
                    VALUES (?, ?, 'Confirmed', ?, ?, ?, ?, ?, ?)`;

        const params = [
            user_id, total_cost, booking_reference, booking_type,
            booking_date, num_passengers, flight_id,
            return_flight_id || null
        ];

        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("Error creating booking:", err);
                return res.status(500).json({ success: false, error: "Failed to create booking" });
            }

            // update available seats
            db.query(`UPDATE FLIGHT SET Available_seats = Available_seats - ? WHERE Flight_ID = ?`,
            [num_passengers, flight_id], (err) => {
                if (err) console.error("Error updating seats:", err);
            });

            res.json({
                success: true,
                message: "Booking created successfully",
                booking: {
                    booking_id: result.insertId,
                    booking_reference: booking_reference,
                    total_cost: total_cost,
                    status: "Confirmed"
                }
            });
        });
    });
};

// 2. GET USER BOOKINGS
const getUserBookings = (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const sql = `SELECT 
                    b.Booking_ID,
                    b.Booking_reference,
                    b.Total_cost,
                    b.Status,
                    b.Booking_type,
                    b.Booking_date,
                    b.Num_passengers,
                    f.Flight_number,
                    f.Departure_time,
                    f.Arrival_time,
                    al.Airline_name as airline,
                    dep.Airport_Code as origin_code,
                    dep.City as origin_city,
                    arr.Airport_Code as destination_code,
                    arr.City as destination_city
                FROM BOOKING b
                JOIN FLIGHT f ON b.Outbound_Flight_ID = f.Flight_ID
                JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
                JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
                JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
                WHERE b.User_ID = ?
                ORDER BY b.Booking_date DESC`;

    db.query(sql, [user_id], (err, bookings) => {
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

// 3. CANCEL BOOKING
const cancelBooking = (req, res) => {
    const { booking_id } = req.params;

    if (!booking_id) {
        return res.status(400).json({ success: false, error: "Booking ID is required" });
    }

    // check if booking exists
    db.query(`SELECT * FROM BOOKING WHERE Booking_ID = ?`, [booking_id], (err, bookings) => {
        if (err) {
            console.error("Error finding booking:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, error: "Booking not found" });
        }

        const booking = bookings[0];

        if (booking.Status === 'Cancelled') {
            return res.status(400).json({ success: false, error: "Booking is already cancelled" });
        }

        // cancel the booking
        db.query(`UPDATE BOOKING SET Status = 'Cancelled' WHERE Booking_ID = ?`, 
        [booking_id], (err) => {
            if (err) {
                console.error("Error cancelling booking:", err);
                return res.status(500).json({ success: false, error: "Failed to cancel booking" });
            }

            // restore available seats
            db.query(`UPDATE FLIGHT SET Available_seats = Available_seats + ? WHERE Flight_ID = ?`,
            [booking.Num_passengers, booking.Outbound_Flight_ID], (err) => {
                if (err) console.error("Error restoring seats:", err);
            });

            res.json({
                success: true,
                message: "Booking cancelled successfully"
            });
        });
    });
};

module.exports = { createBooking, getUserBookings, cancelBooking };