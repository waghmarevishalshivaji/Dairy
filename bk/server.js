// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/authRoutes');
// const orgRoutes = require('./routes/orgRoutes');
// const userRoutes = require('./routes/userRoutes');
// const roleRoutes = require('./routes/roleRoutes');
// const branchRoutes = require('./routes/branchRoutes');
// const confRoutes = require('./routes/confRoutes');
// const collectionsRoutes = require('./routes/collectionsRoutes');
// const paymentsRoutes = require('./routes/paymentRoutes');
// // const billRoutes = require('./routes/billRoutes');
// const billRoutes = require('./routes/billingRoutes');
// const reportRoutes = require('./routes/reportsRoutes');

// const path = require('path');
// const fs = require('fs');

// // Load environment variables
// dotenv.config();

// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(cors());
// app.use(express.json());

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// // app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// // Routes
// app.use('/auth', authRoutes);
// app.use('/organizations', orgRoutes);
// app.use('/users', userRoutes);
// app.use('/roles', roleRoutes);
// app.use('/branch', branchRoutes);
// app.use('/conf', confRoutes);
// app.use('/collections', collectionsRoutes);
// app.use('/payments', paymentsRoutes);
// app.use('/bill', billRoutes);
// app.use('/report', reportRoutes);

// // Starting the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const branchRoutes = require('./routes/branchRoutes');
const confRoutes = require('./routes/confRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes');
const paymentsRoutes = require('./routes/paymentRoutes');
const billRoutes = require('./routes/billingRoutes');
const reportRoutes = require('./routes/reportsRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // NEW

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/organizations', orgRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/branch', branchRoutes);
app.use('/conf', confRoutes);
app.use('/collections', collectionsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/bill', billRoutes);
app.use('/report', reportRoutes);
app.use('/notifications', notificationRoutes); // NEW

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*", // adjust if you want to restrict
    methods: ["GET", "POST"]
  }
});

// Store io instance in app for controllers to access
app.set("io", io);

// Socket events
io.on("connection", (socket) => {
  console.log("🟢 Farmer/Manager connected:", socket.id);

  // Join a dairy room
  socket.on("joinDairy", (dairyId) => {
    socket.join(`dairy_${dairyId}`);
    console.log(`👤 Joined room dairy_${dairyId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// Starting the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
