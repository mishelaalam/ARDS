import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations, getAirports } from '../api/flights';

const CategoryTag = ({ label }) => {
  const colors = {
    'Best Overall': 'bg-green-100 text-green-700 border border-green-300',
    'Cheapest': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    'Fastest': 'bg-red-100 text-red-700 border border-red-300',
    'Good Choice': 'bg-gray-100 text-gray-600 border border-gray-300',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[label] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
};

// Autocomplete Airport Input Component
const AirportInput = ({ label, airports, value, onChange, disabled, placeholder }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const ref = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // filter airports based on query
  const filtered = airports.filter(a =>
    a.City.toLowerCase().includes(query.toLowerCase()) ||
    a.Airport_Code.toLowerCase().includes(query.toLowerCase()) ||
    a.Country.toLowerCase().includes(query.toLowerCase()) ||
    a.Airport_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6); // show max 6 results

  const handleSelect = (airport) => {
    onChange(airport.Airport_Code);
    setDisplayValue(`${airport.City} (${airport.Airport_Code})`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setDisplayValue('');
    onChange('');
    setShowDropdown(true);
  };

  const handleFocus = () => {
    if (!disabled) setShowDropdown(true);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={displayValue || query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
      />
      {disabled && (
        <p className="text-gray-400 text-xs mt-1">Select a departure city first</p>
      )}

      {/* Dropdown */}
      {showDropdown && !disabled && (query.length > 0 || showDropdown) && filtered.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {filtered.map(a => (
            <div
              key={a.Airport_Code}
              onClick={() => handleSelect(a)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-blue-600 font-bold text-sm w-10">{a.Airport_Code}</span>
              <div>
                <p className="text-gray-800 text-sm font-medium">{a.City}</p>
                <p className="text-gray-400 text-xs">{a.Airport_name}, {a.Country}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FlightCard = ({ flight, onBook, onDetails }) => (
  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-200">
    <div className="flex gap-2 mb-3 flex-wrap">
      {flight.labels.map((label, i) => (
        <CategoryTag key={i} label={label} />
      ))}
    </div>
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xl font-bold text-gray-800">
            {flight.origin_code} → {flight.destination_code}
          </span>
        </div>
        <p className="text-gray-500 text-sm">{flight.airline} · {flight.Flight_number}</p>
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <div>
            <p className="text-gray-400 text-xs">Departure</p>
            <p className="font-medium">{flight.departure_time_formatted}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Arrival</p>
            <p className="font-medium">{flight.arrival_time_formatted}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Duration</p>
            <p className="font-medium">{flight.Duration}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Seats Left</p>
            <p className="font-medium">{flight.Available_seats}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold text-blue-600">{flight.price_formatted}</p>
        <p className="text-gray-400 text-xs mb-3">per person</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onBook(flight)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Book Now
          </button>
          <button
            onClick={() => onDetails(flight)}
            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            More Details
          </button>
        </div>
      </div>
    </div>
  </div>
);

const FlightDetailsModal = ({ flight, onClose, onBook }) => {
  if (!flight) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Flight Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {flight.origin_code} → {flight.destination_code}
            </p>
            <p className="text-gray-500 text-sm mt-1">{flight.airline} · {flight.Flight_number}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {flight.labels.map((label, i) => (
              <CategoryTag key={i} label={label} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Departure</p>
              <p className="font-medium text-gray-800">{flight.departure_time_formatted}</p>
            </div>
            <div>
              <p className="text-gray-400">Arrival</p>
              <p className="font-medium text-gray-800">{flight.arrival_time_formatted}</p>
            </div>
            <div>
              <p className="text-gray-400">Duration</p>
              <p className="font-medium text-gray-800">{flight.Duration}</p>
            </div>
            <div>
              <p className="text-gray-400">Available Seats</p>
              <p className="font-medium text-gray-800">{flight.Available_seats}</p>
            </div>
            <div>
              <p className="text-gray-400">Stops</p>
              <p className="font-medium text-gray-800">Non-stop</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-medium text-gray-800">{flight.Status}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Price</span>
              <span className="text-2xl font-bold text-blue-600">{flight.price_formatted}</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">per person, excluding taxes</p>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 font-medium"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onBook(flight); }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState({
    from: '',
    to: '',
    passengers: 1,
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const res = await getAirports();
        if (res.success) setAirports(res.airports);
      } catch (err) {
        console.error('Failed to load airports');
      }
    };
    fetchAirports();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.from || !form.to) {
      setError('Please select both departure and destination airports');
      return;
    }
    if (form.from === form.to) {
      setError('Departure and destination cannot be the same');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const res = await getRecommendations({
        from: form.from,
        to: form.to,
        passengers: form.passengers,
        user_id: user.user_id
      });

      if (res.success) {
        setFlights(res.recommendations);
      } else {
        setError(res.error || 'No flights found');
        setFlights([]);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleBook = (flight) => {
    navigate('/booking', { state: { flight } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/dashboard')}>✈ ARDS</h1>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/search')} className="text-blue-600 font-medium border-b-2 border-blue-600">Search Flights</button>
          <button onClick={() => navigate('/bookings')} className="text-gray-600 hover:text-blue-600 font-medium">My Bookings</button>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 font-medium">Profile</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 text-sm font-medium">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search Flights</h2>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <AirportInput
                label="From"
                airports={airports}
                value={form.from}
                onChange={(code) => setForm({ ...form, from: code, to: '' })}
                placeholder="Type a city or airport..."
              />
              <AirportInput
                label="To"
                airports={airports.filter(a => a.Airport_Code !== form.from)}
                value={form.to}
                onChange={(code) => setForm({ ...form, to: code })}
                disabled={!form.from}
                placeholder="Type a city or airport..."
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <select
                  name="passengers"
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {flights.length > 0
                ? `Top ${flights.length} Recommended Flights`
                : 'No flights found'}
            </h3>

            <div className="space-y-4">
              {flights.map((flight) => (
                <FlightCard
                  key={flight.Flight_ID}
                  flight={flight}
                  onBook={handleBook}
                  onDetails={setSelectedFlight}
                />
              ))}
            </div>

            {flights.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">✈️</p>
                <p className="text-gray-500">No flights found for this route.</p>
                <p className="text-gray-400 text-sm mt-1">Try a different route</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flight Details Modal */}
      <FlightDetailsModal
        flight={selectedFlight}
        onClose={() => setSelectedFlight(null)}
        onBook={handleBook}
      />
    </div>
  );
};

export default SearchPage;