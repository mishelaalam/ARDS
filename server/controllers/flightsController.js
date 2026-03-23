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
    if(userPreferences && userPreferences.Budget_max) {
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

//1. SEARCH --> basic search with filters, for users who want to see all flights like admin for instance
const searchFlights = (req, res) => {
  //filtering categories
  const { from, to, departure_date, passengers = 1, min_price, max_price, airline, sort_by = 'price', limit = 10 } = req.query;
  
  //sql query based on the above category
  let sql = `SELECT 
              f.Flight_ID,
              f.Flight_number,
              f.Departure_time,
              f.Arrival_time,
              f.Duration,
              f.Base_price as price,
              f.Available_seats,
              f.Status,
              al.Airline_name as airline,
              dep.Airport_Code as origin_code,
              dep.Airport_name as origin_name,
              arr.Airport_Code as destination_code,
              arr.Airport_name as destination_name,
              0 as stops
          FROM FLIGHT f
          JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
          JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
          JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
          WHERE f.Available_seats >= ?
          AND f.Status = 'On Time'`; 

  //the params that are pushed to the sql query based on what the user inputs
  const params = [passengers];

  //for each category to filter, add the SQL requirment
  if (from) {
    sql += ` AND f.Departure_Airport_Code = ?`;
    params.push(from);
  }

  if (to) {
    sql += ` AND f.Arrival_Airport_Code = ?`;
    params.push(to);
  }

  if (min_price) {
    sql += ` AND f.Base_price >= ?`;
    params.push(min_price);
  }

  if (max_price) {
    sql += ` AND f.Base_price <= ?`;
    params.push(max_price);
  }

  if (airline) {
    sql += ` AND al.Airline_name = ?`;
    params.push(airline);
  }

  //sorting by
  if (sort_by === 'price') {
    sql += ` ORDER BY f.Base_price ASC`; //ASC --> ascending order
  } else if (sort_by === 'duration') {
    sql += ` ORDER BY f.Duration ASC`;
  } else if (sort_by === 'departure_time') {
    sql += ` ORDER BY f.Departure_time ASC`;
  }

  //limit how many flights generated from this filtering
  sql += ` LIMIT ?`;
  params.push(parseInt(limit));

  //database query command
  //put the list of flights based on this filtering in flights
  db.query(sql, params, (err, flights) => { 
    //if there is an error, return json error
    if (err) {
      console.error('Error in searchFlights:', err);
      return res.status(500).json({
        success: false, //success --> checks if it was successful or not
        error: err.message 
      });
    }

    //if no error, return json with the information
    res.json({
      success: true, //if the filtering was successful
      count: flights.length, //how many flights in flights
      flights: flights //the flights (result)
    });
  });
};

module.exports = { searchFlights };