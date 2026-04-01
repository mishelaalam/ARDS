/**
 * Profile Page will handle all users implimentation from backend.
 * This page will handles the usersController and preference exports:
 * getUserProfile
 * updateUserInfo
 * updateUserPassword
 * getPreferences, savePreferences, updatePreferences
 * @returns Profile Page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateUserInfo, updatePassword } from '../api/users';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  //handle logout const for nav bar
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  //form states --> for standard profile changes
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    passportNumber: "",
    nationality: "",
    dateOfBirth: ""
  });

  //for changing password --> set a seperate form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  //load user data when components mount
  useEffect(() => {
    if(user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || '',
        passportNumber: user.passportNumber || '',
        nationality: user.nationality || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ""
      });
    }
  }, [user]);
  

  //if there is no user, display error (must be logged in)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  //return <div>Profile Page</div>;

  //html design for page
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
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-600 mt-1">Manage your personal information and security settings</p>
        </div>

      </div>
    </div>
  );
};
export default ProfilePage;