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
import { getPreferences, updatePreferences, savePreferences } from '../api/searches';

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
    username: "",
    email: "",
    phone: "",
  });

  //for changing password --> set a seperate form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  //preferences form states
  const [preferences, setPreferences] = useState({
    preferred_airlines: "",
    seat_preference: "",
    budget_min: "",
    budget_max: "",
    meal_preference: "",
    preferred_departure_time: "",
    max_layovers: "",
    preferred_checked_bags: "",
    preferred_carry_on_bags: "",
    preferred_trip_type: ""
  });
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);

  //load user data when components mount
  useEffect(() => {
    if(user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || '',
      });
    }
  }, [user]);

  //============== HANDLE PREFERENCES --> ALL FUNCTIONS =============

  //load preferences when tab changes to preferences
  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = () => {
    const userId = user.user_id;
    if (!userId) return;

    setLoading(true);
    getPreferences(userId)
      .then(response => {
        if (response.success && response.preferences) {
          setPreferences({
            preferred_airlines: response.preferences.Preferred_airlines || "",
            seat_preference: response.preferences.Seat_preference || "",
            budget_min: response.preferences.Budget_min || "",
            budget_max: response.preferences.Budget_max || "",
            meal_preference: response.preferences.Meal_preference || "",
            preferred_departure_time: response.preferences.Preferred_departure_time || "",
            max_layovers: response.preferences.Max_layovers || "",
            preferred_checked_bags: response.preferences.Preferred_checked_bags || "",
            preferred_carry_on_bags: response.preferences.Preferred_carry_on_bags || "",
            preferred_trip_type: response.preferences.Preferred_trip_type || ""
          });
        }
      })
      .catch(error => {
        console.error('Error loading preferences:', error);
      })
      .finally(() => setLoading(false));
  };

const handlePreferencesChange = (e) => {
  const { name, value } = e.target;
  setPreferences(prev => ({ ...prev, [name]: value }));
};

const handlePreferencesSubmit = (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ type: "", text: "" });

  const userId = user.user_id;

  if (!userId) {
    setMessage({ type: "error", text: "User ID not found" });
    setLoading(false);
    return;
  }

  //filter out empty values
  const updateData = {};
  Object.keys(preferences).forEach(key => {
    if (preferences[key] !== "" && preferences[key] !== null && preferences[key] !== undefined) {
      updateData[key] = preferences[key];
    }
  });

  //handle updating and saving preferences, in case the user has not set a preference yet
  getPreferences(userId)
    .then(response => {
      if(response.success && response.preferences) {
        //preference exists, update them
        return updatePreferences(userId, updateData);
      } else {
        //no preference found, save a new one
        return savePreferences(userId, updateData);
      }
    })
    //normal message responses
    .then(response => {
      if (response.success) {
        setIsEditingPrefs(false);
        setMessage({ type: "success", text: "Preferences updated successfully!" });
      } else {
          setMessage({ type: "error", text: response.error || "Failed to update preferences" });
      }
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setLoading(false);
    })
    .catch(error => {
      setMessage({ type: "error", text: "Failed to update preferences" });
      setLoading(false);
    });
  };

  //============== PROFILE AND PASSWORD FUNCTIONS =======================
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

    //get user_id from user object
    const userId = user.User_ID || user.user_id;

    //if no userId found send error
    if(!userId) {
      setMessage({ type: "error", text: "User ID not found" });
      setLoading(false);
      return;
    }

    console.log('Calling updateUserInfo with:', { userId, profileForm });

    //await user response for updating user information
    //call update with userID and profile Form
    updateUserInfo(userId, profileForm) //--> set in profile Form
      .then(response => {
        
        if(response.success) {
          //update the user in context with the new data
          const updatedUser = {
            ...user,
            username: profileForm.username,
            email: profileForm.email,
            phone: profileForm.phone
          };
          setUser(updatedUser); //setUser response to the data given by the user
          setIsEditing(false); //setIsEditing to false --> done editing
          //success message
          setMessage({ type: "success", text: "Profile updated successfully!" });
        
        //if fail
        } else {
          setMessage({ type: "error", text: response.error || "Failed to update profile" });
        }

        //set a timeout in case of any error
        setTimeout(() => setMessage({ type: "", text: "" }), 3000); //set timeout, not using async await
        setLoading(false); //change loading to false after the operation
      })
      //handle any errors
      .catch(error => {
        setMessage({ 
          type: "error", 
          text: "Failed to update profile" 
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

    //like updating personal profile, get user_id from user object
    const userId = user.User_ID || user.user_id;
    
    if (!userId) {
      setMessage({ type: "error", text: "User ID not found" });
      setLoading(false);
      return;
    }

    //update passwordForm
    //call updatePassword with user_id, current password, and new password
    updatePassword(userId, passwordForm.currentPassword, passwordForm.newPassword)
      .then(response => {
        if(response.success) {
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });

          setMessage({ type: "success", text: "Password changed successfully!" });
        } else {
          console.log("here");
          setMessage({ type: "error", text: response.error || "Failed to change password" });
        }
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        setLoading(false);
      })
      .catch(error => {
        console.log("no");
        setMessage({ 
          type: "error", 
          text: "Failed to change password" 
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
          <p className="text-gray-600 mt-1">Manage your personal information, security settings, and preferences</p>
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
        <div className = "bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className = "px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50">
                    Edit Profile
                  </button> 
                ) : (
                  <button
                    onClick={() => {setIsEditing(false);
                      setProfileForm({
                        username: user.username || "",
                        email: user.email || "",
                        phone: user.phone || '',
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                    Cancel
                    </button>
                )}
            </div>
            
            <form onSubmit={handleProfileSubmit}>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/*Username Field*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={profileForm.username || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  autoComplete="username"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
              </div>

              {/*Email Address Field*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  autoComplete="email"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
              </div>

              {/*Phone Number Field*/}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone || ""}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    autoComplete="tel"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditing ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
              </div>
             </div>

             {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
             )}
            </form>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>
             <form onSubmit={handlePasswordSubmit} className="max-w-md">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                <p className="mt-1 text-xs text-gray-500">Password must be at least 5 characters</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Changing Password..." : "Change Password"}
              </button>
             </form>
          </div>
        </div>

        {/* Flight Preferences Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Flight Preferences</h3>
              {!isEditingPrefs ? (
                <button
                  onClick={() => setIsEditingPrefs(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50">
                  Edit Preferences
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditingPrefs(false);
                    loadPreferences();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
              )}
            </div>
            
            <form onSubmit={handlePreferencesSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="preferred_airlines" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Airlines
                  </label>
                  <input
                    id="preferred_airlines"
                    type="text"
                    name="preferred_airlines"
                    value={preferences.preferred_airlines || ""}
                    onChange={handlePreferencesChange}
                    disabled={!isEditingPrefs}
                    placeholder="e.g., Air Canada, WestJet"
                    autoComplete="off"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                </div>

                <div>
                  <label htmlFor="seat_preference" className="block text-sm font-medium text-gray-700 mb-2">
                    Seat Preference
                  </label>
                  <select
                    id="seat_preference"
                    name="seat_preference"
                    value={preferences.seat_preference || ""}
                    onChange={handlePreferencesChange}
                    disabled={!isEditingPrefs}
                    autoComplete="off"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}>
                    <option value="">Select preference</option>
                    <option value="Window">Window</option>
                    <option value="Aisle">Aisle</option>
                    <option value="Middle">Middle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Min ($)
                    </label>
                    <input
                      id="budget_min"
                      type="number"
                      name="budget_min"
                      value={preferences.budget_min || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                  <div>
                    <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Max ($)
                    </label>
                    <input
                      id="budget_max"
                      type="number"
                      name="budget_max"
                      value={preferences.budget_max || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                </div>

                <div>
                  <label htmlFor="meal_preference" className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Preference
                  </label>
                  <select
                    id="meal_preference"
                    name="meal_preference"
                    value={preferences.meal_preference || ""}
                    onChange={handlePreferencesChange}
                    disabled={!isEditingPrefs}
                    autoComplete="off"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}>
                    <option value="">Select preference</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Gluten Free">Gluten Free</option>
                    <option value="Kosher">Kosher</option>
                    <option value="Halal">Halal</option>
                    <option value="None">No preference</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferred_trip_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Trip Type
                  </label>
                  <select
                    id="preferred_trip_type"
                    name="preferred_trip_type"
                    value={preferences.preferred_trip_type || ""}
                    onChange={handlePreferencesChange}
                    disabled={!isEditingPrefs}
                    autoComplete="off"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}>
                    <option value="">Select preference</option>
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="max_layovers" className="block text-sm font-medium text-gray-700 mb-2">
                      Max Layovers
                    </label>
                    <input
                      id="max_layovers"
                      type="number"
                      name="max_layovers"
                      value={preferences.max_layovers || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      min="0"
                      max="5"
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                  <div>
                    <label htmlFor="preferred_departure_time" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Departure Time
                    </label>
                    <input
                      id="preferred_departure_time"
                      type="time"
                      name="preferred_departure_time"
                      value={preferences.preferred_departure_time || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferred_checked_bags" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Checked Bags
                    </label>
                    <input
                      id="preferred_checked_bags"
                      type="number"
                      name="preferred_checked_bags"
                      value={preferences.preferred_checked_bags || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      min="0"
                      max="5"
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                  <div>
                    <label htmlFor="preferred_carry_on_bags" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Carry-on Bags
                    </label>
                    <input
                      id="preferred_carry_on_bags"
                      type="number"
                      name="preferred_carry_on_bags"
                      value={preferences.preferred_carry_on_bags || ""}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPrefs}
                      min="0"
                      max="2"
                      autoComplete="off"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditingPrefs ? "bg-gray-50 text-gray-500" : "bg-white"}`}/>
                  </div>
                </div>
              </div>

              {isEditingPrefs && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {loading ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;