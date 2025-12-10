const axios = require('axios');

// Initialize API keys from environment variables
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(key => key.trim()) : [];
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'https://api.example.com';

// Track current key index for round-robin rotation
let keyIndex = 0;

// Validate environment variables
if (!PUBLIC_API_KEY) {
  console.error('PUBLIC_API_KEY environment variable is required');
}
if (API_KEYS.length === 0) {
  console.error('API_KEYS environment variable is required');
}

/**
 * Get next API key based on rotation strategy
 * @param {string} mode - 'round-robin' or 'random'
 * @returns {string} - Selected API key
 */
function getApiKey(mode = 'round-robin') {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }

  let selectedKey;
  
  if (mode === 'random') {
    // Random selection mode
    const randomIndex = Math.floor(Math.random() * API_KEYS.length);
    selectedKey = API_KEYS[randomIndex];
    console.log(`Random mode: Selected key index ${randomIndex}`);
  } else {
    // Round-robin mode (default)
    selectedKey = API_KEYS[keyIndex];
    keyIndex = (keyIndex + 1) % API_KEYS.length;
    console.log(`Round-robin mode: Selected key index ${keyIndex - 1}`);
  }

  return selectedKey;
}

/**
 * Main Vercel serverless function handler
 */
module.exports = async (req, res) => {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract rotation mode from query parameter (default: round-robin)
    const rotationMode = req.query.mode || 'round-robin';
    
    // Validate rotation mode
    if (!['round-robin', 'random'].includes(rotationMode)) {
      return res.status(400).json({ 
        error: 'Invalid rotation mode. Use "round-robin" or "random"' 
      });
    }

    // Authentication middleware: Check public API key
    const providedApiKey = req.headers['x-api-key'];
    
    if (!providedApiKey) {
      return res.status(401).json({ 
        error: 'API key required in X-API-Key header' 
      });
    }

    if (providedApiKey !== PUBLIC_API_KEY) {
      return res.status(401).json({ 
        error: 'Invalid API key' 
      });
    }

    // Get selected private API key
    let selectedPrivateKey;
    try {
      selectedPrivateKey = getApiKey(rotationMode);
    } catch (error) {
      return res.status(500).json({ 
        error: 'API key configuration error' 
      });
    }

    console.log(`Using private key ending with ...${selectedPrivateKey.slice(-4)}`);
    console.log(`Request method: ${req.method}`);
    console.log(`Rotation mode: ${rotationMode}`);

    // Build external API request configuration
    const externalApiUrl = `${EXTERNAL_API_URL}/data`;
    
    const axiosConfig = {
      method: 'GET',
      url: externalApiUrl,
      headers: {
        'Authorization': `Bearer ${selectedPrivateKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'API-Key-Aggregator/1.0.0'
      },
      timeout: 25000, // 25 second timeout for Vercel functions
      // Forward query parameters to external API
      params: req.query
    };

    // Handle request body for POST/PUT requests
    if (req.body && Object.keys(req.body).length > 0) {
      axiosConfig.data = req.body;
      axiosConfig.method = req.method || 'POST';
    }

    console.log(`Proxying request to: ${externalApiUrl}`);

    try {
      // Make request to external API with selected private key
      const externalResponse = await axios(axiosConfig);
      
      console.log(`External API response status: ${externalResponse.status}`);

      // Return successful response from external API
      return res.status(externalResponse.status).json({
        success: true,
        data: externalResponse.data,
        status: externalResponse.status,
        headers: externalResponse.headers,
        metadata: {
          rotationMode,
          keyUsed: `...${selectedPrivateKey.slice(-4)}`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (externalError) {
      console.error('External API error:', externalError.message);

      // Handle different types of external API errors
      if (externalError.response) {
        // External API responded with error status
        const status = externalError.response.status;
        const errorData = externalError.response.data;

        if (status === 401 || status === 403) {
          // Authentication failed - this key might be invalid
          return res.status(500).json({ 
            error: 'Upstream API failed - Authentication error with private key',
            details: errorData,
            keyUsed: `...${selectedPrivateKey.slice(-4)}`
          });
        } else if (status >= 400 && status < 500) {
          // Client error
          return res.status(status).json({ 
            error: 'Upstream API client error',
            details: errorData,
            status: status
          });
        } else {
          // Server error
          return res.status(502).json({ 
            error: 'Upstream API server error',
            details: errorData,
            status: status
          });
        }
      } else if (externalError.request) {
        // Network error - no response received
        return res.status(503).json({ 
          error: 'Upstream API failed - No response from external service',
          details: externalError.message
        });
      } else {
        // Other errors (timeout, etc.)
        return res.status(500).json({ 
          error: 'Upstream API failed',
          details: externalError.message 
        });
      }
    }

  } catch (handlerError) {
    console.error('Handler error:', handlerError);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: handlerError.message 
    });
  }
};