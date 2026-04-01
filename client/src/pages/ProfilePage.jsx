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

  //the state for when a user is Editing the profile
  const [isEditing, setIsEditing] = useState(false);
  //set a loading time when waiting for user response
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" }); //to display messages for updates

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

  //function that handles profile changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  //function that handles password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  //function that handles profile submissions
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    //await user response for updating user information
    updateUserInfo(profileForm) //--> set in profile Form
      .then(response => {
        setUser(response.data); //setUser response to the data given by the user
        setIsEditing(false); //setIsEditing to false --> done editing
        //success message
        setMessage({ type: "success", text: "Profile updated successfully!" });

        setTimeout(() => setMessage({ type: "", text: "" }), 3000); //set timeout, not using async await
        setLoading(false); //change loading to false after the operation
      })
      //handle any errors
      .catch(error => {
        setMessage({ 
          type: "error", 
          text: error.response?.data?.message || "Failed to update profile" 
        });
        setLoading(false); //once error is done, set loading to false
      });
  };

  //function that handles password submissions
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    //Validation --> vallidate that the new password entered matches the confirmed password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    //password must be of length at least 5 or greater
    if (passwordForm.newPassword.length < 5) {
      setMessage({ type: "error", text: "Password must be at least 5 characters" });
      return;
    }

    //start loading
    setLoading(true);
    setMessage({ type: "", text: "" });

    //update passwordForm
    updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
      .then(() => {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setMessage({ type: "success", text: "Password changed successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        setLoading(false);
      })
      .catch(error => {
        setMessage({ 
          type: "error", 
          text: error.response?.data?.message || "Failed to change password" 
        });
        setLoading(false);
      });
  };

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

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Information Section */}

      </div>
    </div>
  );
};
export default ProfilePage;