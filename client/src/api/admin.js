const BASE_URL = 'http://localhost:5000';

//exports from adminController.js

//get all flights (admin view)
export const getAllFlights = async () => {
  const res = await fetch(`${BASE_URL}/admin/flights`);
  return res.json();
};

//get all bookings (admin view)
export const getAllBookings = async () => {
  const res = await fetch(`${BASE_URL}/admin/bookings`);
  return res.json();
};

//add flight (admin)
export const addFlight = async (flightData) => {
  const res = await fetch(`${BASE_URL}/admin/flights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flightData)
  });
  return res.json();
};

//update flight (admin)
export const updateFlight = async (flightId, flightData) => {
  const res = await fetch(`${BASE_URL}/admin/flights/${flightId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flightData)
  });
  return res.json();
};

//delete flight (admin)
export const deleteFlight = async (flightId) => {
  const res = await fetch(`${BASE_URL}/admin/flights/${flightId}`, {
    method: 'DELETE'
  });
  return res.json();
};