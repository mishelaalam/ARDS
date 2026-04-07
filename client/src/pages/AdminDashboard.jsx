/**
 * AdminDashboard page that serves as the main page for administrators to manage the application.
 * This page will provide functionalities such as viewing all flights, managing bookings, 
 * and performing CRUD operations on flight data.
 * @returns adminDashboard page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllFlights, getAllBookings, addFlight, updateFlight, deleteFlight } from '../api/admin';

const AdminDashboard = () => {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [showModal, setShowModal] = useState(false);
    //the state for when a user is Editing flights
    const [editingFlight, setEditingFlight] = useState(false);
    //set a loading time when waiting for user response
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" }); //to display messages for updates

    //handle logout const for nav bar
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    //flightform
    const [flightForm, setFlightForm] = useState({ 
        airline_id: "",
        flight_number: "",
        departure_time: "",
        arrival_time: "",
        duration: "",
        base_price: "",
        status: "On Time",
        aircraft_type: "",
        available_seats: "",
        departure_airport_code: "",
        arrival_airport_code: ""
    });

    //when opening dashboard, loadFlights
    useEffect(() => {
        loadFlights();
    }, []);

    //use async to make it more consice and easier
    const loadFlights = async () => {
        setLoading(true);
        const response = await getAllFlights();
        if(response.success) {
            setFlights(response.flights);
        }
        setLoading(false);
    };

    //handle an input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFlightForm(prev => ({ ...prev, [name]: value}));
    };

    //open a modal for adding a flight
    const openAddModal = () => {
        setEditingFlight(null);
        //set the flight form based on input from adding
        setFlightForm({
            airline_id: "",
            flight_number: "",
            departure_time: "",
            arrival_time: "",
            duration: "",
            base_price: "",
            status: "On Time",
            aircraft_type: "",
            available_seats: "",
            departure_airport_code: "",
            arrival_airport_code: ""
        });
        setShowModal(true);
    };

    //open model for editing a flight
    //same concept as adding
    const openEditModal = (flight) => {
        setEditingFlight(flight);
        setFlightForm({
            airline_id: flight.airline_id || flight.Airline_ID || "",
            flight_number: flight.Flight_number || "",
            departure_time: flight.Departure_time || "",
            arrival_time: flight.Arrival_time || "",
            duration: flight.Duration || "",
            base_price: flight.Base_price || "",
            status: flight.Status || "On Time",
            aircraft_type: flight.Aircraft_type || "",
            available_seats: flight.Available_seats || "",
            departure_airport_code: flight.origin_code || flight.Departure_Airport_Code || "",
            arrival_airport_code: flight.destination_code || flight.Arrival_Airport_Code || ""
        });
        setShowModal(true);
    };

    //function to handle submit with async instead of .then now
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: ""});

        let response;
        if(editingFlight) {
            response = await updateFlight(editingFlight.Flight_ID, flightForm);
        } else {
            response = await addFlight(flightForm);
        }

        //if submission is successful, set message
        if (response.success) {
            setMessage({ type: "success", text: editingFlight ? "Flight updated successfully!" : "Flight added successfully!" });
            setShowModal(false); //get rid of the modal
            loadFlights(); //load all flights again to dashboard
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } else {
            setMessage({ type: "error", text: response.error || "Operation failed" });
        }
        setLoading(false);
    };

    //function to handle deleting
    const handleDelete = async (flightId) => {
        //add a confirmation request for the deletion of a flight
        if (window.confirm("Are you sure you want to delete this flight?")) {
        setLoading(true);
        const response = await deleteFlight(flightId);

        //if successful response, send message
        if (response.success) {
            setMessage({ type: "success", text: "Flight deleted successfully!" });
            loadFlights();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } else {
            setMessage({ type: "error", text: response.error || "Failed to delete flight" });
        }
        setLoading(false);
        }
    };

    return ( 
    <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/admin')}>✈ ARDS Admin</h1>
            <div className="flex items-center gap-6">
                <span className="text-gray-600">Welcome, {user?.username}</span>
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600">User Dashboard</button>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600">Logout</button>
            </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Manage Flights</h2>
                    <p className="text-gray-600">Add, edit, or remove flights from the system</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    + Add New Flight
                </button>
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

        </div>
    </div>);
};

export default AdminDashboard;