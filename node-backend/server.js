require('dotenv').config();
const app = require('./src/app');  // Import the configured app
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize MongoDB connection
    await initializeDatabase();
    console.log('✅ MongoDB connection established successfully.');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 