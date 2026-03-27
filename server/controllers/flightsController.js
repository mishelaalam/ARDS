/**
 * This file will control all flight queries that can be done by the user
 * It will contain the actual logic + SQL queries that is going to be called in flights.js
 * Methods that will be exported from here:
 * searchFlights
 * getRecommendations
 * compareFlights
 * getFlightDetails
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
    const priceScore = Math.max(0, 100 - (flight.price / userPreferences.Budget_max * 100));

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

      // DEBUG: Log the scores to see if they're being calculated
      // console.log('=== DEBUG SCORES ===');
      // console.log('User Preferences:', userPreferences);
      // console.log('Booking History:', bookingHistory);
      // scoredFlights.forEach(flight => {
      //   console.log(`Flight ${flight.Flight_ID} (${flight.airline}): score = ${flight.score}, price = ${flight.price}`);
      // });
      // console.log('===================');

      //select the top recommendations
      //recommendations will hold the top 3-5 flights based on their score
      //let recommendations = [];

      //create a map for recommendations so we can add multiple labels for a flight if they satisfy them
      const recommendations = new Map();

      //for this design, let us always include the cheapest one, the fastest, and best overall
      //1. cheapest --> sort based on price
      const cheapest = [...scoredFlights].sort((a, b) => a.price - b.price)[0]; //take the top one (first one) in sorted list
      if (cheapest) {
        recommendations.set(cheapest.Flight_ID,{
          ...cheapest,
          score: cheapest.score,
          labels: ["Cheapest"],
          badge_colors: ["yellow"],
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
      //if there already is that flight in recommendations, add the fastes label to it too
      if (recommendations.has(fastest.Flight_ID)) {
        //add label to existing flight
        const existing = recommendations.get(fastest.Flight_ID);
        existing.labels.push("Fastest");
        existing.badge_colors.push("red");
      } else {
        //push to recommendations
        recommendations.set(fastest.Flight_ID, {
          ...fastest,
          score : fastest.score,
          labels: ["Fastest"],
          badge_colors: ["red"],
          departure_time_formatted: formatTime(fastest.Departure_time),
          arrival_time_formatted: formatTime(fastest.Arrival_time),
          price_formatted: `$${fastest.price}`
        });
      }
      
      //3. best overall
      const bestOverall = [...scoredFlights].sort((a, b) => b.score - a.score)[0];
      if (bestOverall) {
        if (recommendations.has(bestOverall.Flight_ID)) {
          // Add label to existing flight
          const existing = recommendations.get(bestOverall.Flight_ID);
          existing.labels.push("Best Overall");
          existing.badge_colors.push("green");
        } else {
            recommendations.set(bestOverall.Flight_ID, {
            ...bestOverall,
            score: bestOverall.score,
            labels: ["Best Overall"],
            badge_colors: ["green"],
            departure_time_formatted: formatTime(bestOverall.Departure_time),
            arrival_time_formatted: formatTime(bestOverall.Arrival_time),
            price_formatted: `$${bestOverall.price}`
          });
        }
      }

      //4. add one more if there is less than 4 recommendations
      //if recommendations has less than 4 and flights to show for this route has more than what is shown:
      if(recommendations.size < 4 && flights.length > recommendations.size) {
        //get the remaining flights that are not listed in recommendations
        const remaining = scoredFlights.filter(f => !recommendations.has(f.Flight_ID));
    
        //sort remaining by score (best first)
        remaining.sort((a, b) => b.score - a.score);

        //add up to 2 more flights to reach 4 total
        const toAdd = Math.min(2, 4 - recommendations.size, remaining.length);
        
        //if there are remaining flights
        //just add up to 2 on there for a decent option for the user
        for (let i = 0; i < toAdd; i++) {
          const goodChoice = remaining[i];
          recommendations.set(goodChoice.Flight_ID, {
            ...goodChoice,
            labels: ["Good Choice"],
            badge_colors: ["gray"],
            departure_time_formatted: formatTime(goodChoice.Departure_time),
            arrival_time_formatted: formatTime(goodChoice.Arrival_time),
            price_formatted: `$${goodChoice.price}`
          });
        }
      }

      // DEBUG: Log the final recommendations before sending
      // console.log('=== FINAL RECOMMENDATIONS ===');
      // Array.from(recommendations.values()).forEach(rec => {
      //   console.log(`Flight ${rec.Flight_ID}: score = ${rec.score}, labels = ${rec.labels}`);
      // });
      // console.log('=============================');

      //convert map to array and limit to 5 recommendations
      let recommendation = Array.from(recommendations.values());

      //make sure to limit to at most 5 recommendations --> reduce choice overload
      //use slice!
      recommendation = recommendation.slice(0, 5);

      //send json with recommendation information
      res.json({
        success: true,
        count: recommendation.length,
        route: { from, to },
        recommendations: recommendation,
        personalized: user_id ? true : false
      });
    }
  });
};

//3. COMPARE, if user wants to compare two different flights
const compareFlights = (req, res) => {
  //compare by flight_ids!
  const { flight_ids } = req.query;
  
  //make sure user selects flight_ids --> it is valid
  if (!flight_ids) {
    return res.status(400).json({
        success: false,
        error: 'Please provide flight IDs to compare'
    });
  }

  //parse flight IDs
  const ids = flight_ids.split(',').map(id => parseInt(id));

  //validate exactly 2 flights
  //make sure there can only be 2 flights selected for comparison
  if (ids.length !== 2) {
    return res.status(400).json({
      success: false,
      error: 'Please select exactly 2 flights to compare'
    });
  }

  //make sure the flight ids are valid number
  if (ids.some(isNaN)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid flight ID format'
    });
  }

  //sql query to get both flights
  const sql = `SELECT 
                  f.Flight_ID,
                  f.Flight_number,
                  f.Departure_time,
                  f.Arrival_time,
                  f.Duration,
                  f.Base_price as price,
                  f.Available_seats,
                  f.Aircraft_type,
                  f.Status,
                  al.Airline_name as airline,
                  al.Airline_ID,
                  al.Country as airline_country,
                  dep.Airport_Code as origin_code,
                  dep.Airport_name as origin_name,
                  dep.City as origin_city,
                  dep.Country as origin_country,
                  arr.Airport_Code as destination_code,
                  arr.Airport_name as destination_name,
                  arr.City as destination_city,
                  arr.Country as destination_country,
                  bp.Checked_bag_weight_limit,
                  bp.Extra_bag_fee,
                  bp.Overweight_fee_per_kg,
                  bp.Carry_on_bag_allowed,
                  bp.Personal_item_allowed
              FROM FLIGHT f
              JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
              JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
              JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
              LEFT JOIN BAGGAGE_POLICY bp ON al.Airline_ID = bp.Airline_ID
              WHERE f.Flight_ID IN (?, ?)`;
  
  //query
  db.query(sql, [ids[0], ids[1]], (err, flights) => {
    if (err) {
      console.error("Error in compareFlights:", err);
      return res.status(500).json({ 
        success: false, 
        error: "Database error occurred"
      });
    }

    //check if both flights were found
    if (flights.length !== 2) {
      const foundIds = flights.map(f => f.Flight_ID);
      const missingIds = ids.filter(id => !foundIds.includes(id));
      return res.status(404).json({
        success: false,
        error: `Flight(s) not found: ${missingIds.join(', ')}`
      });
    }

    //for comparison, let flight1 be the first flight and flight2 be second
    const flight1 = flights[0];
    const flight2 = flights[1];

    //helper to get duration in minutes, same as getRecommendation
    const getMinutes = (durat) => {
      if(!durat) {
        return 0;
      }
      const parts = durat.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    //format flight 1
    const formattedFlight1 = {
      flight_id: flight1.Flight_ID,
      flight_number: flight1.Flight_number,
      airline: flight1.airline,
      airline_id: flight1.Airline_ID,
      price: flight1.price,
      price_formatted: `$${flight1.price}`,
      departure_time: flight1.Departure_time,
      departure_time_formatted: formatTime(flight1.Departure_time),
      arrival_time: flight1.Arrival_time,
      arrival_time_formatted: formatTime(flight1.Arrival_time),
      duration: flight1.Duration,
      duration_minutes: getMinutes(flight1.Duration),
      available_seats: flight1.Available_seats,
      aircraft_type: flight1.Aircraft_type || "Standard",
      status: flight1.Status,
      origin: {
          code: flight1.origin_code,
          name: flight1.origin_name,
          city: flight1.origin_city,
          country: flight1.origin_country
      },
      destination: {
          code: flight1.destination_code,
          name: flight1.destination_name,
          city: flight1.destination_city,
          country: flight1.destination_country
      },
      baggage: {
          checked_bag_limit: flight1.Checked_bag_weight_limit || 23,
          extra_bag_fee: flight1.Extra_bag_fee || 50,
          overweight_fee: flight1.Overweight_fee_per_kg || 20,
          carry_on_allowed: flight1.Carry_on_bag_allowed === 1,
          personal_item_allowed: flight1.Personal_item_allowed === 1
      }
    };

    //format flight 2
    const formattedFlight2 = {
      flight_id: flight2.Flight_ID,
      flight_number: flight2.Flight_number,
      airline: flight2.airline,
      airline_id: flight2.Airline_ID,
      price: flight2.price,
      price_formatted: `$${flight2.price}`,
      departure_time: flight2.Departure_time,
      departure_time_formatted: formatTime(flight2.Departure_time),
      arrival_time: flight2.Arrival_time,
      arrival_time_formatted: formatTime(flight2.Arrival_time),
      duration: flight2.Duration,
      duration_minutes: getMinutes(flight2.Duration),
      available_seats: flight2.Available_seats,
      aircraft_type: flight2.Aircraft_type || "Standard",
      status: flight2.Status,
      origin: {
          code: flight2.origin_code,
          name: flight2.origin_name,
          city: flight2.origin_city,
          country: flight2.origin_country
      },
      destination: {
          code: flight2.destination_code,
          name: flight2.destination_name,
          city: flight2.destination_city,
          country: flight2.destination_country
      },
      baggage: {
          checked_bag_limit: flight2.Checked_bag_weight_limit || 23,
          extra_bag_fee: flight2.Extra_bag_fee || 50,
          overweight_fee: flight2.Overweight_fee_per_kg || 20,
          carry_on_allowed: flight2.Carry_on_bag_allowed === 1,
          personal_item_allowed: flight2.Personal_item_allowed === 1
      }
    };

    //now put these in a comparison metric to be sent in the json
    const comparison = {
      //the two flights being compared
      flight_a: formattedFlight1,
      flight_b: formattedFlight2,

      //side-by-side comparison table
      comparison_table: {
        price: {
          flight_a: formattedFlight1.price_formatted,
          flight_b: formattedFlight2.price_formatted,
          winner: formattedFlight1.price < formattedFlight2.price ? 'A' : formattedFlight2.price < formattedFlight1.price ? 'B' : "tie"
        },
        duration: {
          flight_a: formattedFlight1.duration,
          flight_b: formattedFlight2.duration,
          winner: formattedFlight1.duration_minutes < formattedFlight2.duration_minutes ? 'A' : formattedFlight2.duration_minutes < formattedFlight1.duration_minutes ? 'B' : "tie"
        },
        //since this is for the comparison table, just list flight a and b information
        departure_time: {
          flight_a: formattedFlight1.departure_time_formatted,
          flight_b: formattedFlight2.departure_time_formatted,
          winner: null //no winner for time, just preference, perhaps just list departure time + arrival time
        },
        arrival_time: {
          flight_a: formattedFlight1.arrival_time_formatted,
          flight_b: formattedFlight2.arrival_time_formatted,
          winner: null
        },
        available_seats: {
          flight_a: formattedFlight1.available_seats,
          flight_b: formattedFlight2.available_seats,
          winner: formattedFlight1.available_seats > formattedFlight2.available_seats ? 'A' : formattedFlight2.available_seats > formattedFlight1.available_seats ? 'B' : "tie"
        },
        checked_baggage: {
          flight_a: `${formattedFlight1.baggage.checked_bag_limit}kg`,
          flight_b: `${formattedFlight2.baggage.checked_bag_limit}kg`,
          winner: formattedFlight1.baggage.checked_bag_limit > formattedFlight2.baggage.checked_bag_limit ? 'A' : formattedFlight2.baggage.checked_bag_limit > formattedFlight1.baggage.checked_bag_limit ? 'B' : "tie"
        }
      },

      //a quick summary of which flight is cheaper in all categories
      //can use this for to give a quick an efficient summary for the user --> reduce time taken
      summary: {
        cheaper: formattedFlight1.price < formattedFlight2.price ? "flight_a" : formattedFlight2.price < formattedFlight1.price ? "flight_b" : "tie",
        faster: formattedFlight1.duration_minutes < formattedFlight2.duration_minutes ? "flight_a" : formattedFlight2.duration_minutes < formattedFlight1.duration_minutes ? "flight_b" : "tie",
        more_seats: formattedFlight1.available_seats > formattedFlight2.available_seats ? "flight_a" : formattedFlight2.available_seats > formattedFlight1.available_seats ? "flight_b" : "tie",
        price_difference: Math.abs(formattedFlight1.price - formattedFlight2.price),
        time_difference: Math.abs(formattedFlight1.duration_minutes - formattedFlight2.duration_minutes)
      }
    };

    //send json with all the comparison information
    res.json({
      success: true,
      comparison: comparison
    });
  });
};

//MORE DETAILS --> FLIGHT DETAILS
const getFlightDetails = (req, res) => {
  //need the flight id to get more details on this flight
  const { id } = req.params;

  //sql query for all information
  const sql = `SELECT 
                  f.Flight_ID,
                  f.Flight_number,
                  f.Departure_time,
                  f.Arrival_time,
                  f.Duration,
                  f.Base_price as price,
                  f.Available_seats,
                  f.Status,
                  f.Aircraft_type,
                  al.Airline_name as airline,
                  al.Airline_ID,
                  al.Country as airline_country,
                  al.Contact_info as airline_contact,
                  dep.Airport_Code as origin_code,
                  dep.Airport_name as origin_name,
                  dep.City as origin_city,
                  dep.Country as origin_country,
                  dep.Time_zone as origin_timezone,
                  arr.Airport_Code as destination_code,
                  arr.Airport_name as destination_name,
                  arr.City as destination_city,
                  arr.Country as destination_country,
                  arr.Time_zone as destination_timezone,
                  bp.Checked_bag_weight_limit,
                  bp.Extra_bag_fee,
                  bp.Overweight_fee_per_kg,
                  bp.Carry_on_bag_allowed,
                  bp.Personal_item_allowed,
                  bp.Ticket_class
              FROM FLIGHT f
              JOIN AIRLINE al ON f.Airline_ID = al.Airline_ID
              JOIN AIRPORT dep ON f.Departure_Airport_Code = dep.Airport_Code
              JOIN AIRPORT arr ON f.Arrival_Airport_Code = arr.Airport_Code
              LEFT JOIN BAGGAGE_POLICY bp ON al.Airline_ID = bp.Airline_ID
              WHERE f.Flight_ID = ?`;
  
  db.query(sql, [id], (err, flights) => {
    //if there is an error:
    if (err) {
      console.error("Error in getFlightDetails:", err);
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }

    //if the flight is not found, give error
    if (flights.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Flight not found"
      });
    }

    //since flights returns all flights as its an array, just grab the first entry
    const flight = flights[0];

    //format duration to readable string
    const formatDuration = (duration) => {
      if (!duration) {
        return '';
      } 
      const parts = duration.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours === 0) {
        return `${minutes} minutes`;
      }
      if (minutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    };
        
    //calculate estimated taxes (example: 12% of base price)
    const taxes = Math.round(flight.price * 0.12);
    const total = flight.price + taxes;
        
    //get metric details to return in JSON
    const details = {
      flight_id: flight.Flight_ID,
      flight_number: flight.Flight_number,
      airline: flight.airline,
      aircraft_type: flight.Aircraft_type || 'Standard',
      status: flight.Status,
      
      //schedule
      departure: {
        time: flight.Departure_time,
        time_formatted: formatTime(flight.Departure_time),
        airport_code: flight.origin_code,
        airport_name: flight.origin_name,
        city: flight.origin_city,
        country: flight.origin_country,
        timezone: flight.origin_timezone
      },
      arrival: {
        time: flight.Arrival_time,
        time_formatted: formatTime(flight.Arrival_time),
        airport_code: flight.destination_code,
        airport_name: flight.destination_name,
        city: flight.destination_city,
        country: flight.destination_country,
        timezone: flight.destination_timezone
      },
      duration: {
        raw: flight.Duration,
        formatted: formatDuration(flight.Duration)
      },
      
      //pricing
      pricing: {
        base_price: flight.price,
        base_price_formatted: `$${flight.price}`,
        taxes: taxes,
        taxes_formatted: `$${taxes}`,
        total: total,
        total_formatted: `$${total}`
      },
      
      //availability
      availability: {
        available_seats: flight.Available_seats,
        seat_class: flight.Ticket_class || "Economy"
      },
      
      //baggage Policy
      baggage: {
        checked_bag_limit: flight.Checked_bag_weight_limit,
        checked_bag_limit_formatted: `${flight.Checked_bag_weight_limit}kg`,
        extra_bag_fee: flight.Extra_bag_fee,
        extra_bag_fee_formatted: `$${flight.Extra_bag_fee}`,
        overweight_fee: flight.Overweight_fee_per_kg,
        overweight_fee_formatted: `$${flight.Overweight_fee_per_kg}/kg`,
        carry_on_allowed: flight.Carry_on_bag_allowed === 1,
        personal_item_allowed: flight.Personal_item_allowed === 1
      },
      
      //airline Info
      airline_info: {
        name: flight.airline,
        country: flight.airline_country,
        contact: flight.airline_contact
      }
    };
    
    //send json
    res.json({
      success: true,
      flight: details
    });
  })
};

module.exports = { searchFlights, getRecommendations, compareFlights, getFlightDetails };