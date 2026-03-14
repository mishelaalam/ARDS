-- ARDS: Airline Reservation Database System
-- Group 5 - CPSC 471 W26

CREATE DATABASE IF NOT EXISTS ards;
USE ards;

-- USER
CREATE TABLE User (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Password_hash VARCHAR(255) NOT NULL,
    Date_Registered DATE NOT NULL
);

-- CUSTOMER (specialization of User)
CREATE TABLE Customer (
    User_ID INT PRIMARY KEY,
    Loyalty_Points INT DEFAULT 0,
    Account_status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- ADMIN (specialization of User)
CREATE TABLE Admin (
    User_ID INT PRIMARY KEY,
    Role VARCHAR(50),
    Access_Level INT,
    Department VARCHAR(50),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- USER PREFERENCE
CREATE TABLE User_Preference (
    Preference_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Preferred_airlines VARCHAR(100),
    Seat_preference VARCHAR(20),
    Budget_min DECIMAL(10,2),
    Budget_max DECIMAL(10,2),
    Meal_preference VARCHAR(50),
    Preferred_departure_time VARCHAR(20),
    Max_layovers INT,
    Preferred_checked_bags INT,
    Preferred_carry_on_bags INT,
    Preferred_trip_type VARCHAR(20),
    FOREIGN KEY (User_ID) REFERENCES Customer(User_ID)
);

-- SAVED SEARCH
CREATE TABLE Saved_Search (
    Search_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Search_name VARCHAR(100),
    Origin_airport VARCHAR(10),
    Destination_airport VARCHAR(10),
    Departure_date DATE,
    Return_date DATE,
    Num_passengers INT,
    Flexible_dates BOOLEAN DEFAULT FALSE,
    Notify_on_price_change BOOLEAN DEFAULT FALSE,
    Price_threshold DECIMAL(10,2),
    FOREIGN KEY (User_ID) REFERENCES Customer(User_ID)
);

-- AIRLINE
CREATE TABLE Airline (
    Airline_ID INT AUTO_INCREMENT PRIMARY KEY,
    Airline_name VARCHAR(100) NOT NULL,
    Country VARCHAR(50),
    Contact_info VARCHAR(100)
);

-- BAGGAGE POLICY
CREATE TABLE Baggage_Policy (
    Policy_ID INT AUTO_INCREMENT PRIMARY KEY,
    Airline_ID INT NOT NULL,
    Overweight_fee_per_kg DECIMAL(10,2),
    Extra_bag_fee DECIMAL(10,2),
    Personal_item_allowed BOOLEAN DEFAULT TRUE,
    Checked_bag_weight_limit DECIMAL(10,2),
    Carry_on_weight_limit DECIMAL(10,2),
    Carry_on_bags_allowed INT,
    Ticket_class VARCHAR(20),
    Checked_bags_allowed INT,
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID)
);

-- AIRPORT
CREATE TABLE Airport (
    Airport_Code VARCHAR(10) PRIMARY KEY,
    Airport_name VARCHAR(100),
    City VARCHAR(50),
    Country VARCHAR(50),
    Time_zone VARCHAR(50)
);

-- FLIGHT
CREATE TABLE Flight (
    Flight_ID INT AUTO_INCREMENT PRIMARY KEY,
    Airline_ID INT NOT NULL,
    Airport_code VARCHAR(10) NOT NULL,
    Flight_number VARCHAR(20),
    Departure_time DATETIME,
    Arrival_time DATETIME,
    Duration INT,
    Base_price DECIMAL(10,2),
    Status VARCHAR(20),
    Aircraft_type VARCHAR(50),
    Available_seats INT,
    Departure_airport_code VARCHAR(10),
    Arrival_airport_code VARCHAR(10),
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID),
    FOREIGN KEY (Departure_airport_code) REFERENCES Airport(Airport_Code),
    FOREIGN KEY (Arrival_airport_code) REFERENCES Airport(Airport_Code)
);

-- BOOKING
CREATE TABLE Booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Flight_ID INT NOT NULL,
    Total_cost DECIMAL(10,2),
    Status VARCHAR(20),
    Booking_reference VARCHAR(50),
    Booking_type VARCHAR(20),
    Booking_date DATE,
    Num_passengers INT,
    Outbound_flight_ID INT,
    Return_flight_ID INT,
    FOREIGN KEY (User_ID) REFERENCES Customer(User_ID),
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
);

-- PASSENGER (weak entity, depends on Booking)
CREATE TABLE Passenger (
    Passenger_Number INT NOT NULL,
    Booking_ID INT NOT NULL,
    First_Name VARCHAR(50),
    Last_name VARCHAR(50),
    DOB DATE,
    Passport_number VARCHAR(50),
    Passenger_type VARCHAR(20),
    Special_requirements VARCHAR(100),
    Ticket_class VARCHAR(20),
    PRIMARY KEY (Passenger_Number, Booking_ID),
    FOREIGN KEY (Booking_ID) REFERENCES Booking(Booking_ID)
);

-- SEAT (weak entity, depends on Flight)
CREATE TABLE Seat (
    Seat_Number VARCHAR(10) NOT NULL,
    Flight_ID INT NOT NULL,
    Seat_ID INT,
    Seat_Class VARCHAR(20),
    Is_available BOOLEAN DEFAULT TRUE,
    Is_aisle_row BOOLEAN,
    Has_extra_leg_room BOOLEAN,
    PRIMARY KEY (Seat_Number, Flight_ID),
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
);

-- BAGGAGE
CREATE TABLE Baggage (
    Baggage_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_Number INT NOT NULL,
    Booking_ID INT NOT NULL,
    Baggage_type VARCHAR(20),
    Weight DECIMAL(10,2),
    Length DECIMAL(10,2),
    Width DECIMAL(10,2),
    Height DECIMAL(10,2),
    Status VARCHAR(20),
    Fee DECIMAL(10,2),
    Tag_number VARCHAR(50),
    Is_within_allowance BOOLEAN,
    FOREIGN KEY (Passenger_Number, Booking_ID) REFERENCES Passenger(Passenger_Number, Booking_ID)
);

-- CARRIES (N:N between Passenger and Flight)
CREATE TABLE Carries (
    Passenger_Number INT NOT NULL,
    Flight_ID INT NOT NULL,
    Booking_ID INT NOT NULL,
    PRIMARY KEY (Passenger_Number, Flight_ID, Booking_ID),
    FOREIGN KEY (Passenger_Number, Booking_ID) REFERENCES Passenger(Passenger_Number, Booking_ID),
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
);

-- MANAGES (N:N between Admin and Flight)
CREATE TABLE Manages (
    User_ID INT NOT NULL,
    Flight_ID INT NOT NULL,
    PRIMARY KEY (User_ID, Flight_ID),
    FOREIGN KEY (User_ID) REFERENCES Admin(User_ID),
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
);