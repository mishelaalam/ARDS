const BASE_URL = 'http://localhost:5000';

export const getUserBookings = async (user_id) => {
  const res = await fetch(`${BASE_URL}/bookings/user/${user_id}`);
  return res.json();
};

export const createBooking = async (bookingData) => {
  const res = await fetch(`${BASE_URL}/bookings/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return res.json();
};

export const cancelBooking = async (booking_id) => {
  const res = await fetch(`${BASE_URL}/bookings/cancel/${booking_id}`, {
    method: 'PUT'
  });
  return res.json();
};