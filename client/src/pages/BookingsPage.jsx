import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, cancelBooking } from '../api/bookings';

const BookingDetailsModal = ({ booking, onClose, onCancel, cancelling }) => {
  if (!booking) return null;

  const getStatusColor = (status) => {
    if (status === 'Confirmed') return 'bg-green-100 text-green-700';
    if (status === 'Cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(booking.Status)}`}>
              {booking.Status}
            </span>
            <span className="text-gray-400 text-sm">Ref: {booking.Booking_reference}</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {booking.origin_code} → {booking.destination_code}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {booking.origin_city} → {booking.destination_city}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Airline</p>
              <p className="font-medium text-gray-800">{booking.airline}</p>
            </div>
            <div>
              <p className="text-gray-400">Flight Number</p>
              <p className="font-medium text-gray-800">{booking.Flight_number}</p>
            </div>
            <div>
              <p className="text-gray-400">Departure</p>
              <p className="font-medium text-gray-800">{booking.Departure_time}</p>
            </div>
            <div>
              <p className="text-gray-400">Arrival</p>
              <p className="font-medium text-gray-800">{booking.Arrival_time}</p>
            </div>
            <div>
              <p className="text-gray-400">Passengers</p>
              <p className="font-medium text-gray-800">{booking.Num_passengers}</p>
            </div>
            <div>
              <p className="text-gray-400">Booking Type</p>
              <p className="font-medium text-gray-800">{booking.Booking_type}</p>
            </div>
            <div>
              <p className="text-gray-400">Booking Date</p>
              <p className="font-medium text-gray-800">
                {new Date(booking.Booking_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Cost</p>
              <p className="font-bold text-blue-600 text-lg">${booking.Total_cost}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 font-medium"
          >
            Close
          </button>
          {booking.Status === 'Confirmed' && (
            <button
              onClick={() => onCancel(booking.Booking_ID)}
              disabled={cancelling === booking.Booking_ID}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
            >
              {cancelling === booking.Booking_ID ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onClick, getStatusColor }) => (
  <div
    onClick={() => onClick(booking)}
    className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition hover:border-blue-300 border-2 border-transparent"
  >
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg font-bold text-gray-800">
            {booking.origin_code} → {booking.destination_code}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(booking.Status)}`}>
            {booking.Status}
          </span>
        </div>
        <p className="text-gray-500 text-sm">{booking.airline} · {booking.Flight_number}</p>
        <p className="text-gray-500 text-sm">{booking.origin_city} → {booking.destination_city}</p>
        <p className="text-gray-400 text-xs mt-1">Click to view details</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-blue-600">${booking.Total_cost}</p>
        <p className="text-gray-400 text-xs">
          {new Date(booking.Booking_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  </div>
);

const BookingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getUserBookings(user.user_id);
        if (res.success) {
          setBookings(res.bookings);
        } else {
          setError('Failed to load bookings');
        }
      } catch (err) {
        setError('Something went wrong');
      }
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  const handleCancel = async (booking_id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(booking_id);
    try {
      const res = await cancelBooking(booking_id);
      if (res.success) {
        setBookings(bookings.map(b =>
          b.Booking_ID === booking_id ? { ...b, Status: 'Cancelled' } : b
        ));
        setSelectedBooking(prev =>
          prev?.Booking_ID === booking_id ? { ...prev, Status: 'Cancelled' } : prev
        );
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert('Failed to cancel booking');
    }
    setCancelling(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    if (status === 'Confirmed') return 'bg-green-100 text-green-700';
    if (status === 'Cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // split bookings into upcoming and past
  const upcomingBookings = bookings.filter(b => b.Status === 'Confirmed');
  const pastBookings = bookings.filter(b => b.Status === 'Cancelled');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/dashboard')}>✈ ARDS</h1>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/search')} className="text-gray-600 hover:text-blue-600 font-medium">Search Flights</button>
          <button onClick={() => navigate('/bookings')} className="text-blue-600 font-medium border-b-2 border-blue-600">My Bookings</button>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 font-medium">Profile</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 text-sm font-medium">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
          <button
            onClick={() => navigate('/search')}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Book Another Flight
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading bookings...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎫</p>
            <p className="text-gray-500 text-lg">No bookings yet</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Search Flights
            </button>
          </div>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Upcoming Bookings
              <span className="ml-2 bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                {upcomingBookings.length}
              </span>
            </h3>
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <BookingCard
                  key={booking.Booking_ID}
                  booking={booking}
                  onClick={setSelectedBooking}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Past Bookings
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                {pastBookings.length}
              </span>
            </h3>
            <div className="space-y-4">
              {pastBookings.map(booking => (
                <div
                  key={booking.Booking_ID}
                  onClick={() => setSelectedBooking(booking)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition hover:border-gray-300 border-2 border-transparent"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-400">
                          {booking.origin_code} → {booking.destination_code}
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                          {booking.Status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{booking.airline} · {booking.Flight_number}</p>
                      <p className="text-gray-400 text-sm">{booking.origin_city} → {booking.destination_city}</p>
                      <p className="text-gray-300 text-xs mt-1">Click to view details</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-300 line-through">${booking.Total_cost}</p>
                      <p className="text-gray-300 text-xs">
                        {new Date(booking.Booking_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No past bookings message */}
        {!loading && pastBookings.length === 0 && upcomingBookings.length > 0 && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            No past bookings
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancel}
        cancelling={cancelling}
      />
    </div>
  );
};

export default BookingsPage;