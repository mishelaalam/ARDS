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
import { searchFlights } from '../api/flights'; //basic search feature is used for admin to search for a flight to manage

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

    //search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState('flight_number'); //flight_number, airline, from, to
    const [isSearching, setIsSearching] = useState(false);

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

    //========= admin search functions =================
    //handle searching from admin, we allow the admin to be able to search for specific flights they want to manage
    //and update instead of having ti manually scroll through all flights displayed to find the
    //right one
    const handleSearch = async (e) => {
        e.preventDefault(); //prevent default again
        if(!searchTerm.trim()) {
            //if search is empty, reload all flights
            await loadFlights();
            setIsSearching(false);
            return;
        }

        //set loading and isSearching to true when handling search --> search is not empty
        setLoading(true);
        setIsSearching(true);
        
        //the search parameters --> this contains the resulting flights
        let searchParams = {};
        
        //build search parameters based on what admin wants to search by
        //allow admin to search by flight number, airline, from, and to
        switch(searchBy) {
            case 'flight_number':
                searchParams = { flight_number: searchTerm };
                break;
            case 'airline':
                searchParams = { airline: searchTerm };
                break;
            case 'from':
                searchParams = { from: searchTerm };
                break;
            case 'to':
                searchParams = { to: searchTerm };
                break;
            default:
                searchParams = { flight_number: searchTerm };
        }
        
        //add limit to get more results
        searchParams.limit = 100;
        
        //wait for response
        const response = await searchFlights(searchParams);
        
        if (response.success) { //if response is successful, set displaying flights to the flight results
            setFlights(response.flights); //set flights to normalized flights
            if (response.count === 0) { //if the response gives no flights
                setMessage({ type: "error", text: "No flights found matching your search" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            }
        //if response is unsuccessful, handle error
        } else {
            setMessage({ type: "error", text: "Search failed" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
        
        setLoading(false); //set loading back to false
    };

    //clear search function to clear the search params for next search
    const clearSearch = async () => {
        setSearchTerm("");
        setIsSearching(false);
        await loadFlights();
    };

    //========= manage flight functions ====================
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
            base_price: flight.Base_price || flight.price || "",
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

            {/* Search Bar */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <form onSubmit={handleSearch} className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search By</label>
                        <select 
                            value={searchBy} 
                            onChange={(e) => setSearchBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="flight_number">Flight Number</option>
                            <option value="airline">Airline Name</option>
                            <option value="from">Departure Airport/City</option>
                            <option value="to">Arrival Airport/City</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Search by ${searchBy.replace('_', ' ')}...`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Search
                        </button>
                        {isSearching && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                                Clear
                            </button>
                        )}
                    </div>
                </form>
                {isSearching && (
                    <div className="mt-2 text-sm text-gray-600">
                        Showing search results • {flights.length} flight(s) found
                    </div>
                )}
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

            {/* Flights Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                    <div className="text-center py-8">Loading flights...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airline ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airline</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departure</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {flights.length === 0 ? (
                                <tr>
                                   <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                                        No flights found
                                    </td> 
                                </tr>
                            ) : (
                                flights.map((flight) => (
                                    <tr key={flight.Flight_ID}>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{flight.Flight_number}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.airline_id || flight.Airline_ID || "N/A"}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.airline || flight.airline_name || "N/A"}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.origin_code || flight.Departure_Airport_Code}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.destination_code || flight.Arrival_Airport_Code}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.Departure_time?.substring(0, 5)}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.Arrival_time?.substring(0, 5)}</td>
                                        <td className="px-4 py-4 text-sm text-gray-900">${flight.Base_price || flight.base_price || flight.price || "0"}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{flight.Available_seats}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                flight.Status === 'On Time' ? 'bg-green-100 text-green-800' : 
                                                flight.Status === 'Delayed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {flight.Status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm space-x-2">
                                            <button onClick={() => openEditModal(flight)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                            <button onClick={() => handleDelete(flight.Flight_ID)} className="text-red-600 hover:text-red-800">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* Add/Edit Flight Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            {editingFlight ? 'Edit Flight' : 'Add New Flight'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Airline ID</label>
                                    <input type="number" name="airline_id" value={flightForm.airline_id} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
                                    <input type="text" name="flight_number" value={flightForm.flight_number} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                                    <input type="time" name="departure_time" value={flightForm.departure_time} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                                    <input type="time" name="arrival_time" value={flightForm.arrival_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (HH:MM:SS)</label>
                                    <input type="text" name="duration" value={flightForm.duration} onChange={handleInputChange} placeholder="02:30:00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                                    <input type="number" name="base_price" value={flightForm.base_price} onChange={handleInputChange} required step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={flightForm.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option value="On Time">On Time</option>
                                        <option value="Delayed">Delayed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Aircraft Type</label>
                                    <input type="text" name="aircraft_type" value={flightForm.aircraft_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                                    <input type="number" name="available_seats" value={flightForm.available_seats} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Airport Code</label>
                                    <input type="text" name="departure_airport_code" value={flightForm.departure_airport_code} onChange={handleInputChange} required maxLength="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Airport Code</label>
                                    <input type="text" name="arrival_airport_code" value={flightForm.arrival_airport_code} onChange={handleInputChange} required maxLength="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{loading ? 'Saving...' : (editingFlight ? 'Update' : 'Add')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </div>);
};

export default AdminDashboard;