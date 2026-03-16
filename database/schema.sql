-- ARDS: Airline Reservation Database System
-- Group 5 - CPSC 471 W26


DROP DATABASE IF EXISTS AIRPORT_RESERVATION_DATABASE;
CREATE DATABASE AIRPORT_RESERVATION_DATABASE;
USE AIRPORT_RESERVATION_DATABASE;

-- create tables

CREATE TABLE USER (
    User_ID int NOT NULL,
    Username varchar(255) NOT NULL,
    Email varchar(255) NOT NULL unique,
    Phone varchar(255),
    Password_hash varchar(255) NOT NULL,
    Date_Registered date NOT NULL,
    PRIMARY KEY (User_ID)
);

CREATE TABLE CUSTOMER (
    User_ID int NOT NULL,
    Loyalty_Points int,
    Account_status varchar(255) NOT NULL, 
    PRIMARY KEY (User_ID),
    FOREIGN KEY (User_ID) REFERENCES USER(User_ID) ON DELETE CASCADE
);

CREATE TABLE ADMIN (
    User_ID int NOT NULL,
    Role varchar(255) NOT NULL,
    Access_Level int NOT NULL, 
    Department varchar(255),
    PRIMARY KEY (User_ID),
    FOREIGN KEY (User_ID) REFERENCES USER(User_ID) ON DELETE CASCADE
);

CREATE TABLE USER_PREFERENCE (
    Preference_ID int NOT NULL,
    User_ID int NOT NULL unique,
    Preferred_airlines varchar(255),
    Seat_preference varchar(255),
    Budget_min int,
    Budget_max int,
    Meal_preference varchar(255),
    Preferred_departure_time time,
    Max_layovers int,
    Preferred_checked_bags int,
    Preferred_carry_on_bags int,
    Preferred_trip_type varchar(255),
    PRIMARY KEY (Preference_ID),
    FOREIGN KEY (User_ID) REFERENCES CUSTOMER(User_ID)
);

CREATE TABLE SAVED_SEARCH (
    Search_ID int NOT NULL,
    User_ID int NOT NULL,
    Search_name varchar(255),
    Origin_airport varchar(255) NOT NULL,
    Destination_airport varchar(255) NOT NULL,
    Departure_date date NOT NULL,
    Return_date date,
    Num_passengers int NOT NULL,
    Flexible_dates date,
    Notify_on_price_change bool,
    Price_threshold int,
    PRIMARY KEY (Search_ID),
    FOREIGN KEY (User_ID) REFERENCES CUSTOMER(User_ID)
);

CREATE TABLE AIRLINE (
    Airline_ID int NOT NULL,
    Airline_name varchar(255) NOT NULL unique,
    Country varchar(255),
    Contact_info varchar(255),
    PRIMARY KEY (Airline_ID)
);

CREATE TABLE AIRPORT (
    Airport_Code char(3) NOT NULL,
    Airport_name varchar(255) NOT NULL,
    City varchar(255) NOT NULL,
    Country varchar(255) NOT NULL,
    Time_zone varchar(255),
    PRIMARY KEY (Airport_Code)
);

CREATE TABLE FLIGHT (
    Flight_ID int NOT NULL,
    Airline_ID int NOT NULL,
    Departure_time time NOT NULL,
    Flight_number varchar(5) NOT NULL,
    Arrival_time time,
    Duration time,
    Base_price float NOT NULL,
    Status varchar(255) NOT NULL,
    Aircraft_type varchar(255),
    Available_seats int,
    Departure_Airport_Code varchar(3) NOT NULL,
    Arrival_Airport_Code varchar(3) NOT NULL,
    PRIMARY KEY (Flight_ID),
    FOREIGN KEY (Airline_ID) REFERENCES AIRLINE(Airline_ID),
    FOREIGN KEY (Arrival_Airport_Code) REFERENCES AIRPORT(Airport_Code),
    FOREIGN KEY (Departure_Airport_Code) REFERENCES AIRPORT(Airport_Code)
);

CREATE TABLE BOOKING (
    Booking_ID int NOT NULL,
    User_ID int NOT NULL,
    Total_cost int NOT NULL,
    Status varchar(255) NOT NULL,
    Booking_reference varchar(255) unique,
    Booking_type varchar(255),
    Booking_date date NOT NULL,
    Num_passengers int,
    Outbound_Flight_ID int NOT NULL,
    Return_Flight_ID int,
    PRIMARY KEY (Booking_ID),
    FOREIGN KEY (User_ID) REFERENCES CUSTOMER(User_ID),
    FOREIGN KEY (Outbound_Flight_ID) REFERENCES FLIGHT(Flight_ID),
    FOREIGN KEY (Return_Flight_ID) REFERENCES FLIGHT(Flight_ID)
);

CREATE TABLE manages (
    User_ID int NOT NULL,
    Flight_ID int NOT NULL,
    PRIMARY KEY (User_ID, Flight_ID),
    FOREIGN KEY (User_ID) REFERENCES ADMIN(User_ID),
    FOREIGN KEY (Flight_ID) REFERENCES FLIGHT(Flight_ID)
);

CREATE TABLE BAGGAGE_POLICY (
    Policy_ID int NOT NULL,
    Airline_ID int NOT NULL,
    Overweight_fee_per_kg float NOT NULL,
    Extra_bag_fee float NOT NULL,
    Personal_item_allowed bool,
    Checked_bag_weight_limit float NOT NULL,
    Carry_on_bag_allowed bool,
    Ticket_class varchar(255) NOT NULL,
    Checked_bags_allowed bool,
    PRIMARY KEY (Policy_ID),
    FOREIGN KEY (Airline_ID) REFERENCES AIRLINE(Airline_ID)
);

CREATE TABLE PASSENGER (
    Passenger_Number varchar(255) NOT NULL unique,
    Booking_ID int NOT NULL,
    First_name varchar(255) NOT NULL,
    Last_name varchar(255) NOT NULL,
    DOB date,
    Passport_number varchar(255) NOT NULL,
    Passenger_type varchar(255) NOT NULL,
    Special_requirenments varchar(255),
    Ticket_class varchar(255) NOT NULL,
    PRIMARY KEY (Passenger_Number, Booking_ID),
    FOREIGN KEY (Booking_ID) REFERENCES BOOKING(Booking_ID)
);

CREATE TABLE SEAT (
    Seat_Number varchar(3) NOT NULL,
    Flight_ID int NOT NULL,
    Seat_ID int NOT NULL,
    Seat_class varchar(255),
    Is_available bool NOT NULL,
    Is_exit_row bool,
    Has_extra_leg_room bool,
    PRIMARY KEY (Seat_Number, Flight_ID),
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
);

CREATE TABLE BAGGAGE (
    Baggage_ID int NOT NULL,
    Baggage_type varchar(255),
    Weight float NOT NULL,
    Length float,
    Width float,
    Height float,
    Status varchar(255) NOT NULL,
    Fee float,
    Tag_number int unique,
    Is_within_allowance bool,
    Passenger_Number varchar(255) NOT NULL,
    Booking_ID int NOT NULL,
    PRIMARY KEY (Baggage_ID),
    FOREIGN KEY (Passenger_Number, Booking_ID) REFERENCES PASSENGER(Passenger_Number, Booking_ID)
);

CREATE TABLE carries (
    Passenger_Number varchar(255) NOT NULL,
    Booking_ID int NOT NULL,
    Flight_ID int NOT NULL,
    PRIMARY KEY (Passenger_Number, Booking_ID, Flight_ID),
    FOREIGN KEY (Passenger_Number, Booking_ID) REFERENCES PASSENGER(Passenger_Number, Booking_ID),
    FOREIGN KEY (Flight_ID) REFERENCES FLIGHT(Flight_ID)
);


-- Insert sample data

INSERT INTO USER VALUES
(1, 'hannahx', 'hannah@gmail.com', '4035551111', 'hash123', '2025-01-10'),
(2, 'traveler2', 'alex@gmail.com', '4035552222', 'hash456', '2025-02-15'),
(3, 'admin01', 'admin@yyc.com', '4035553333', 'hash789', '2024-12-01');

INSERT INTO CUSTOMER VALUES
(1, 1200, 'Active'),
(2, 450, 'Active');

INSERT INTO ADMIN VALUES
(3, 'Flight Manager', 5, 'Operations');

INSERT INTO USER_PREFERENCE VALUES
(1, 1, 'Air Canada', 'Window', 200, 800, 'Vegetarian', '08:00:00', 1, 1, 1, 'Round Trip'),
(2, 2, 'WestJet', 'Aisle', 100, 600, 'None', '12:00:00', 2, 1, 1, 'One Way');

INSERT INTO SAVED_SEARCH VALUES
(1, 1, 'Vacation Trip', 'YYC', 'LAX', '2026-06-01', '2026-06-10', 1, NULL, TRUE, 400),
(2, 2, 'Business Trip', 'YYC', 'JFK', '2026-05-20', NULL, 1, NULL, FALSE, NULL);

INSERT INTO AIRLINE VALUES
(1, 'Air Canada', 'Canada', 'support@aircanada.com'),
(2, 'WestJet', 'Canada', 'support@westjet.com'),
(3, 'Delta Air Lines', 'USA', 'support@delta.com'),
(4, 'United Airlines', 'USA', 'support@united.com'),
(5, 'American Airlines', 'USA', 'support@aa.com'),
(6, 'Lufthansa', 'Germany', 'support@lufthansa.com'),
(7, 'British Airways', 'UK', 'support@ba.com'),
(8, 'Emirates', 'UAE', 'support@emirates.com');

INSERT INTO AIRPORT VALUES
('YYC', 'Calgary International Airport', 'Calgary', 'Canada', 'MST'),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'USA', 'PST'),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA', 'EST'),
('ORD', 'O Hare International Airport', 'Chicago', 'USA', 'CST'),
('SFO', 'San Francisco International Airport', 'San Francisco', 'USA', 'PST'),
('SEA', 'Seattle Tacoma International Airport', 'Seattle', 'USA', 'PST'),
('LHR', 'Heathrow Airport', 'London', 'UK', 'GMT'),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France', 'CET'),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE', 'GST'),
('FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'CET');

INSERT INTO FLIGHT VALUES
(101, 1, '08:00:00', 'AC101', '10:30:00', '02:30:00', 350.00, 'On Time', 'Boeing 737', 120, 'YYC', 'LAX'),
(102, 1, '14:00:00', 'AC102', '18:30:00', '04:30:00', 360.00, 'On Time', 'Boeing 737', 115, 'LAX', 'YYC'),
(103, 2, '09:30:00', 'WS201', '15:00:00', '05:30:00', 420.00, 'Delayed', 'Airbus A320', 100, 'YYC', 'JFK'),
(104, 2, '07:30:00', 'WS310', '09:00:00', '01:30:00', 180.00, 'On Time', 'Boeing 737', 130, 'YYC', 'SEA'),
(105, 3, '11:00:00', 'DL220', '15:30:00', '04:30:00', 320.00, 'On Time', 'Airbus A320', 150, 'SEA', 'ORD'),
(106, 4, '16:00:00', 'UA450', '18:45:00', '02:45:00', 250.00, 'On Time', 'Boeing 737', 140, 'ORD', 'JFK'),
(107, 5, '19:30:00', 'AA100', '22:15:00', '02:45:00', 280.00, 'Delayed', 'Airbus A321', 120, 'JFK', 'LAX'),
(108, 6, '10:00:00', 'LH760', '12:00:00', '02:00:00', 450.00, 'On Time', 'Airbus A320', 160, 'FRA', 'LHR'),
(109, 7, '14:00:00', 'BA150', '16:30:00', '02:30:00', 420.00, 'On Time', 'Airbus A320', 155, 'LHR', 'CDG'),
(110, 8, '02:00:00', 'EK202', '08:00:00', '06:00:00', 900.00, 'On Time', 'Boeing 777', 300, 'DXB', 'LHR'),
(111, 1, '13:00:00', 'AC325', '16:30:00', '03:30:00', 310.00, 'On Time', 'Airbus A321', 140, 'YYC', 'SFO'),
(112, 2, '17:30:00', 'WS411', '20:45:00', '03:15:00', 295.00, 'On Time', 'Boeing 737', 125, 'SFO', 'YYC');

INSERT INTO BOOKING VALUES
(1, 1, 700, 'Confirmed', 'REF12345', 'Round Trip', '2026-03-01', 1, 101, 102),
(2, 2, 420, 'Confirmed', 'REF67890', 'One Way', '2026-03-05', 1, 103, NULL);

INSERT INTO manages VALUES
(3, 101),
(3, 102),
(3, 103);

INSERT INTO BAGGAGE_POLICY VALUES
(1, 1, 20.0, 50.0, TRUE, 23.0, TRUE, 'Economy', TRUE),
(2, 2, 18.0, 45.0, TRUE, 20.0, TRUE, 'Economy', TRUE);

INSERT INTO PASSENGER VALUES
('P001', 1, 'Hannah', 'Xia', '2003-05-10', 'A12345678', 'Adult', NULL, 'Economy'),
('P002', 2, 'Alex', 'Johnson', '1995-09-20', 'B98765432', 'Adult', 'Wheelchair', 'Economy');

INSERT INTO SEAT VALUES
('12A', 101, 1, 'Economy', TRUE, FALSE, FALSE),
('14C', 102, 2, 'Economy', TRUE, FALSE, FALSE),
('10B', 103, 3, 'Economy', TRUE, FALSE, TRUE);

INSERT INTO BAGGAGE VALUES
(1, 'Checked', 20.5, 70, 50, 30, 'Loaded', 0, 11111, TRUE, 'P001', 1),
(2, 'Carry-on', 8.0, 55, 35, 25, 'Loaded', 0, 22222, TRUE, 'P002', 2);

INSERT INTO carries VALUES
('P001', 1, 101),
('P001', 1, 102),
('P002', 2, 103);

-- test queries
SELECT * FROM FLIGHT;
SELECT * FROM USER;
SELECT COUNT(*) FROM USER;