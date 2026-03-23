/**
 * This file will control all flight queries that can be done by the user
 * It will contain the actual logic + SQL queries that is going to be called in flights.js
 * Methods that will be exported from here:
 * searchFlights
 * getRecommendations
 * compareFlights
 * getFlightDetails
 * getAvailableSeats
 */

const db = require('../db');



const searchFlights = (req, res) => {
  const { from, to } = req.query;
  const sql = `SELECT * FROM FLIGHT WHERE Departure_Airport_Code = ? AND Arrival_Airport_Code = ?`;
  db.query(sql, [from, to], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

module.exports = { searchFlights };