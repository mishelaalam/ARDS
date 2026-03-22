const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const flightRoutes = require('./routes/flights');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const searchRoutes = require('./routes/searches');
const adminRoutes = require('./routes/admin');

app.use('/flights', flightRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/bookings', bookingRoutes);
app.use('/searches', searchRoutes);
app.use('/admin', adminRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
