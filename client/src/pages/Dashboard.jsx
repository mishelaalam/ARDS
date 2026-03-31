import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">✈ ARDS</h1>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/search')} className="text-gray-600 hover:text-blue-600 font-medium">Search Flights</button>
          <button onClick={() => navigate('/bookings')} className="text-gray-600 hover:text-blue-600 font-medium">My Bookings</button>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 font-medium">Profile</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 text-sm font-medium">Logout</button>
        </div>
      </nav>

      {/* Welcome */}
      <div className="max-w-4xl mx-auto mt-16 px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-800">Welcome back, {user?.username}! ✈</h2>
        <p className="text-gray-500 mt-3 text-lg">Where would you like to go today?</p>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div
            onClick={() => navigate('/search')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition hover:border-blue-500 border-2 border-transparent"
          >
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800">Search Flights</h3>
            <p className="text-gray-500 text-sm mt-1">Find the best flights for your trip</p>
          </div>

          <div
            onClick={() => navigate('/bookings')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition hover:border-blue-500 border-2 border-transparent"
          >
            <div className="text-4xl mb-3">🎫</div>
            <h3 className="text-lg font-semibold text-gray-800">My Bookings</h3>
            <p className="text-gray-500 text-sm mt-1">View and manage your reservations</p>
          </div>

          <div
            onClick={() => navigate('/profile')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition hover:border-blue-500 border-2 border-transparent"
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-semibold text-gray-800">My Profile</h3>
            <p className="text-gray-500 text-sm mt-1">Update your info and preferences</p>
          </div>
        </div>

        {/* Loyalty points */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-8 inline-block">
          <p className="text-blue-700 font-medium">⭐ Loyalty Points: <span className="font-bold">{user?.loyalty_points || 0}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;