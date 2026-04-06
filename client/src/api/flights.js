const BASE_URL = 'http://localhost:5000';

export const searchFlights = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/flights/search?${query}`);
  return res.json();
};

export const getRecommendations = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/flights/recommendations?${query}`);
  return res.json();
};

export const compareFlights = async (flight_ids) => {
  const res = await fetch(`${BASE_URL}/flights/compare?flight_ids=${flight_ids}`);
  return res.json();
};

export const getFlightDetails = async (id) => {
  const res = await fetch(`${BASE_URL}/flights/${id}/details`);
  return res.json();
};

export const getAirports = async () => {
  const res = await fetch(`${BASE_URL}/flights/airports`);
  return res.json();
};