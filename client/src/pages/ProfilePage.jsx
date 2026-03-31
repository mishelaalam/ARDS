import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser, changePassword } from '../api/users';
import { getUserBookings } from '../api/bookings';
// import BookingCard from '../components/bookings/BookingCard';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); //'profile', 'bookings', 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

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



  return <div>Profile Page</div>;
};
export default ProfilePage;