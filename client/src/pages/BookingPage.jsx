import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../api/bookings';

const ConfirmationModal = ({ bookingRef, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-500 mb-2">Your flight has been successfully booked.</p>
        <div className="bg-blue-50 rounded-lg px-4 py-3 mb-6 inline-block">
          <p className="text-sm text-gray-500">Booking Reference</p>
          <p className="text-lg font-bold text-blue-600">{bookingRef}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold"
        >
          View My Bookings
        </button>
      </div>
    </div>
  );
};

const BookingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flight = location.state?.flight;

  const [numPassengers, setNumPassengers] = useState(1);
  const [bookingType, setBookingType] = useState('One Way');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedRef, setConfirmedRef] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">No flight selected</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  const totalCost = (flight.price * numPassengers).toFixed(2);
  const taxes = (totalCost * 0.12).toFixed(2);
  const grandTotal = (parseFloat(totalCost) + parseFloat(taxes)).toFixed(2);

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await createBooking({
        user_id: user.user_id,
        flight_id: flight.Flight_ID,
        num_passengers: numPassengers,
        booking_type: bookingType,
      });
      if (res.success) {
        setConfirmedRef(res.booking.booking_reference);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/dashboard')}>✈ ARDS</h1>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/search')} className="text-gray-600 hover:text-blue-600 font-medium">Search Flights</button>
          <button onClick={() => navigate('/bookings')} className="text-gray-600 hover:text-blue-600 font-medium">My Bookings</button>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 font-medium">Profile</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 text-sm font-medium">Logout</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm Booking</h2>

        {/* Flight Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Flight Details</h3>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {flight.origin_code} → {flight.destination_code}
              </p>
              <p className="text-gray-500">{flight.airline} · {flight.Flight_number}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${flight.price}</p>
              <p className="text-gray-400 text-sm">per person</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4">
            <div>
              <p className="font-medium text-gray-700">Departure</p>
              <p>{flight.Departure_time}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Arrival</p>
              <p>{flight.Arrival_time}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Duration</p>
              <p>{flight.Duration}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Available Seats</p>
              <p>{flight.Available_seats}</p>
            </div>
          </div>
        </div>

        {/* Booking Options */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Options</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Passengers</label>
            <select
              value={numPassengers}
              onChange={(e) => setNumPassengers(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="One Way">One Way</option>
              <option value="Round Trip">Round Trip</option>
            </select>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Breakdown</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Base price × {numPassengers} passenger{numPassengers > 1 ? 's' : ''}</span>
              <span>${totalCost}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & fees (12%)</span>
              <span>${taxes}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-blue-600">${grandTotal}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/search')}
            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50 font-medium"
          >
            Back to Search
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmedRef && (
        <ConfirmationModal
          bookingRef={confirmedRef}
          onClose={() => navigate('/bookings')}
        />
      )}
    </div>
  );
};

export default BookingPage;