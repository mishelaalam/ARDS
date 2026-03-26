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

//helper function to format time
const formatTime = (timeString) => {
  //if no string provided, return empty string
  if(!timeString){
    return "";
  }

  //if string provided, format correctly
  const parts = timeString.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

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
      console.error("Error in searchFlights:", err);
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

//2. RECOMMENDATIONS - Returns top 3-5 flights with labels
const getRecommendations = (req, res) => {
  const { from, to, passengers = 1, user_id = null, limit = 5 } = req.query;

  //validate fields --> make sure that the user provides where they are going to and from where
  if (!from || !to) {
      return res.status(400).json({
          success: false,
          error: "Please provide departure and destination airports"
      });
  }

  //1. get all available flights for that route
  const flightsSql = `SELECT 
                f.Flight_ID,
                f.Flight_number,
                f.Departure_time,
                f.Arrival_time,
                f.Duration,
                f.Base_price as price,
                f.Available_seats,
                al.Airline_name as airline,
                dep.Airport_Code as origin_code,
                arr.Airport_Code as destination_code,
                0 as stops
            FROM FLIGHT f
            JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
            JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
            JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
            WHERE f.Departure_Airport_Code = ?
            AND f.Arrival_Airport_Code = ?
            AND f.Available_seats >= ?
            AND f.Status = 'On Time'
            ORDER BY f.Base_price ASC
            LIMIT 20`;

  //query
  db.query(flightsSql, [from, to, passengers], (err, flights) => {
    //if there is an error, return json error
    if(err) {
      console.error("Error getting flights:", err);
      return res.status(500).json({
        success: false, //success --> checks if it was successful or not
        error: err.message 
      });
    }

    //if there are no flights, return no flights found for this route
    if(flights.length == 0) {
      return res.json({
        success: true,
        message: "No flights found for this route.",
        recommendations: [] //recommendations list is empty
      });
    }

    //if the user is logged in, get their preference and history
    if(user_id) {
      //get user preferences
      let userSQL = `SELECT 
                    Preferred_airlines, 
                    Budget_min, Budget_max, 
                    Preferred_departure_time, 
                    Max_layovers
                    FROM USER_PREFERENCE WHERE User_ID = ?`;
      //query command
      db.query(userSQL, [user_id], (err, preferences) => {
        if (err) {
          console.error("Error getting preferences:", err);

          //return proceedWwithRecommendation --> proceed with default recommendations
          //if there is an error, return so we leave this part of code
          return proceedWithRecommendations(flights, null, []);
        }

        //if there are user preferences or not (no error):
        //get booking history
        let bookingSQL = `SELECT DISTINCT al.Airline_name
                         FROM BOOKING b
                         JOIN FLIGHT f ON b.Outbound_Flight_ID = f.Flight_ID
                         JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
                         WHERE b.User_ID = ? AND b.Status = 'Confirmed'
                         LIMIT 5`;

        db.query(bookingSQL, [user_id], (err, history) => {
          if (err) {
            console.error('Error getting history:', err);
            //return proceed with recommendation --> preferences can exist (start at first one) or null
            return proceedWithRecommendations(flights, preferences[0] || null, []);
          }

          //with no error, proceed with reccomendations --> just with the existing history
          proceedWithRecommendations(flights, preferences[0] || null, history);
        });
      });

      //if the user is not logged in
    } else {
      //there is no user, just proceed with default recommendations
      proceedWithRecommendations(flights, null, []);
    }

    //define proceedWithRecommendations
    //this function will handle all the scoring of the flights --> compute the top 3-5
    //take in the list of flights for the specified route, the userpreference and the booking history of the user
    function proceedWithRecommendations(flights, userPreferences, bookingHistory) {
      //score each flight
      const scoredFlights = flights.map(flight => ({
        ...flight, //go through each flight
        score: calculateFlightScore(flight, userPreferences, bookingHistory) //call helper function calculateFlightScore
      }));

      //select the top recommendations
      //recommendations will hold the top 3-5 flights based on their score
      let recommendations = [];

      //for this design, let us always include the cheapest one, the fastest, and best overall
      //1. cheapest --> sort based on price
      const cheapest = [...scoredFlights].sort((a, b) => a.price - b.price)[0]; //take the top one (first one) in sorted list
      if (cheapest) {
        recommendations.push({
          ...cheapest,
          label: "Cheapest",
          badge_color: "yellow",
          departure_time_formatted: formatTime(cheapest.Departure_time),
          arrival_time_formatted: formatTime(cheapest.Arrival_time),
          price_formatted: `$${cheapest.price}`
        });
      }

      //2. fastest
      const fastest = [...scoredFlights].sort((a, b) => {
        //unlike cheapest, no easy way to sort so make a helper function getMinutes
        //compare those minutes to get fastest flight
        const getMinutes = (durat) => {
          const parts = durat.split(':');
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        };
        return getMinutes(a.Duration) - getMinutes(b.Duration);
      })[0]; //get top one again

      //if there exists flight that are in fastest
      //and there is not a flight in recommendations that has already been listed equal to the fastest one
      if (fastest && !recommendations.some(r => r.Flight_ID === fastest.Flight_ID)) {
        //push to recommendations
        recommendations.push({
          ...fastest,
          label: "Fastest",
          badge_color: "red",
          departure_time_formatted: formatTime(fastest.Departure_time),
          arrival_time_formatted: formatTime(fastest.Arrival_time),
          price_formatted: `$${fastest.price}`
        });
      }
      
      //3. best overall
      const bestOverall = [...scoredFlights].sort((a, b) => b.score - a.score)[0];
      if(bestOverall && !recommendations.some(r => r.Flight_ID === bestOverall.Flight_ID)) {
        recommendations.push({
          ...bestOverall,
          label: "Best Overall",
          badge_color: "green",
          departure_time_formatted: formatTime(bestOverall.Departure_time),
          arrival_time_formatted: formatTime(bestOverall.Arrival_time),
          price_formatted: `$${bestOverall.price}`
        });
      }

      //4. add one more if there is less than 4 recommendations
      //if recommendations has less than 4 and flights to show for this route has more than what is shown:
      if(recommendations.length < 4 && flights.length > recommendations.length) {
        //get the remaining flights that are not listed in recommendations
        const remaining = scoredFlights.filter(f => !recommendations.some(r => r.Flight_ID === f.Flight_ID));
        
        //if there are remaining flights
        //just add one on there for a decent option for the user
        if (remaining.length > 0) {
          const added = remaining[0];
          recommendations.push({
            ...added,
            label: "Good Choice",
            badge_color: "gray",
            departure_time_formatted: formatTime(additional.Departure_time),
            arrival_time_formatted: formatTime(additional.Arrival_time),
            price_formatted: `$${additional.price}`
          });
        }
      }

      //make sure to limit to at most 5 recommendations --> reduce choice overload
      //use slice!
      recommendations = recommendations.slice(0, 5);

      //send json with recommendation information
      res.json({
        success: true,
        count: recommendations.length,
        route: { from, to },
        recommendations: recommendations,
        personalized: user_id ? true : false
      });
    }
  });
};

//3. COMPARE

module.exports = { searchFlights, getRecommendations };