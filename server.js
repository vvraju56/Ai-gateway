require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Note: This server.js is for local development only
// For Vercel deployment, use api/index.js (serverless functions)

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Key Manager Class
class APIKeyManager {
  constructor() {
    this.keys = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(key => key.trim()) : [];
    this.currentIndex = 0;
    this.failedKeys = new Set();
    
    if (this.keys.length === 0) {
      throw new Error('No API keys configured. Please set API_KEYS environment variable.');
    }
    
    console.log(`Initialized with ${this.keys.length} API keys`);
  }

  getNextKey() {
    // Filter out failed keys
    const availableKeys = this.keys.filter(key => !this.failedKeys.has(key));
    
    if (availableKeys.length === 0) {
      // Reset failed keys if all keys have failed
      console.log('All keys failed, resetting failed keys list');
      this.failedKeys.clear();
      return this.keys[this.currentIndex % this.keys.length];
    }
    
    const key = availableKeys[this.currentIndex % availableKeys.length];
    this.currentIndex = (this.currentIndex + 1) % availableKeys.length;
    return key;
  }

  markKeyAsFailed(key) {
    this.failedKeys.add(key);
    console.log(`Marked key as failed. Total failed keys: ${this.failedKeys.size}`);
  }

  resetFailedKeys() {
    this.failedKeys.clear();
    console.log('Reset failed keys list');
  }
}

const keyManager = new APIKeyManager();

// Authentication middleware
const authenticateAPIKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  const publicKey = process.env.PUBLIC_API_KEY;

  if (!providedKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (providedKey !== publicKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// Helper function to make HTTP requests with retry logic
async function makeRequestWithRetry(config, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiKey = keyManager.getNextKey();
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      };

      console.log(`Attempt ${attempt}: Using API key ending with ...${apiKey.slice(-4)}`);
      
      const response = await axios(config);
      
      // If request is successful, reset failed keys periodically
      if (attempt > 1) {
        console.log('Request successful after retry');
      }
      
      return response;
    } catch (error) {
      const apiKey = config.headers['Authorization']?.replace('Bearer ', '') || config.headers['X-API-Key'];
      
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        keyManager.markKeyAsFailed(apiKey);
        console.log(`API key failed with ${error.response.status}`);
      }

      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Main API proxy endpoint
app.post('/api', authenticateAPIKey, async (req, res) => {
  try {
    const { method = 'GET', url, headers = {}, params = {}, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Construct the full URL
    const baseUrl = process.env.EXTERNAL_API_URL || '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    console.log(`Proxying ${method} request to: ${fullUrl}`);

    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      params,
      timeout: 30000
    };

    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    }

    const response = await makeRequestWithRetry(config);

    // Return response data, headers, and status
    res.status(response.status).json({
      data: response.data,
      status: response.status,
      headers: response.headers
    });

  } catch (error) {
    console.error('API Proxy Error:', error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status).json({
        error: 'External API error',
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'Service unavailable',
        message: 'No response from external API'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    availableKeys: keyManager.keys.length - keyManager.failedKeys.size,
    totalKeys: keyManager.keys.length
  });
});

// Status endpoint for monitoring
app.get('/status', authenticateAPIKey, (req, res) => {
  res.json({
    service: 'API Key Proxy',
    version: '1.0.0',
    status: 'running',
    availableKeys: keyManager.keys.length - keyManager.failedKeys.size,
    totalKeys: keyManager.keys.length,
    failedKeys: keyManager.failedKeys.size,
    uptime: process.uptime()
  });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Key Proxy server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Frontend demo: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});