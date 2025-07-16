const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const branchRoutes = require('./routes/branchRoutes');
const confRoutes = require('./routes/confRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/auth', authRoutes);
app.use('/organizations', orgRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/branch', branchRoutes);
app.use('/conf', confRoutes);
app.use('/collections', collectionsRoutes);

// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
