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

//a helper function that will calculate the flight score for reccomendations
//based on price, airline preference, booking history, departure time
const calculateFlightScore = (flight, userPreferences, bookingHistory) => {
    let score = 0;

    //1. Price --> weight 30%
    //price score --> a lower price means a higher score (recommend flight based on score)
    if(userPreference && userPreferences.Budget_max) {
      //price score is calculated out of 100
      //we do max with 0 so that it can never go to the negatives, if the score is negative, set it to 0
      const priceScore = Math.max(0, 100 - (flight.Base_price / userPreferences.Budget_max * 100));

      score += priceScore * 0.3;

      //default: compare to average price of similar flights
    } else {
      score += (100 - Math.min(100, flight.price / 10)) * 0.3;
    }

    //2. Airline Preference --> weight 25%
    if(userPreferences && userPreferences.Preferred_airlines) {
      //if the flight's airline is equal to the user's preferred airline, give it 25 points
      if(flight.airline === userPreferences.Preferred_airlines) {
            score += 25;
        }
    }

    //3. Booking history --> weight 25%
    //preferred airlines the user has booked before
    if(bookingHistory && bookingHistory.length > 0) { //if the user has booked before
      //create variable hasBookedAirlineBefore to hold an airline that the user has booked before
      const hasBookedAirlineBefore = bookingHistory.some(history => 
            history.Airline_name === flight.airline 
      );

      //if it has been booked before and it matches the current flight's airline, give it a full score
      if(hasBookedAirlineBefore) {
        score += 25;
      }
    }

    //4. Departure Time --> weight 20%
    if(userPreferences && userPreferences.Preferred_departure_time) {
      //get the departure hour for this flight
      const flightHour = parseInt(flight.Departure_time.split(':')[0]);
      //get the user's preferred hour to depart
      const prefHour = parseInt(userPreferences.Preferred_departure_time.split(':')[0]);
      //calculate the difference between them
      const hourDiff = Math.abs(flightHour - prefHour);

      //if the hour difference is less than equal to 2, give it a max score
      //if it is less than equal to 4, give it a half score, any greater and give it no score
      if (hourDiff <= 2) {
        score += 20;
      } else if (hourDiff <= 4) {
        score += 10;
      }
    }

    //return the score for this flight
    return Math.min(100, score);
}

//1. SEARCH --> basic search with filters
const searchFlights = (req, res) => {
  const { from, to } = req.query;
  const sql = `SELECT * FROM FLIGHT WHERE Departure_Airport_Code = ? AND Arrival_Airport_Code = ?`;
  db.query(sql, [from, to], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

module.exports = { searchFlights };