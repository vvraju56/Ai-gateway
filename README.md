# AI API Gateway

A production-ready Python HTTP server that securely proxies to Groq's Llama-3 API with automatic weekly key rotation. Deployable on Render FREE tier.

## Features

- **Groq API Proxy**: Secure proxy to Llama-3 70B model
- **Automatic API Key Rotation**: Generates new key every 7 days, only one valid key at a time
- **Security**: Never exposes Groq API key to users
- **Zero Dependencies**: Only uses Python standard library + requests
- **Render Deployment**: Optimized for free tier
- **Pure Python**: No FastAPI, Pydantic, or heavy frameworks

## Tech Stack

- Python 3.11+
- HTTP Server (standard library)
- Requests
- JSON + hashlib (standard library)

## Setup

1. Clone this repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `ADMIN_SECRET`: Secret for viewing current API key

## Local Development

Run the server:
```bash
python main.py
```

## Render Deployment

### Web Service Configuration

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. **Runtime**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `python main.py`
6. **Environment Variables**:
   - `GROQ_API_KEY`: `your_groq_api_key_here`
   - `ADMIN_SECRET`: `your_admin_secret_here`
7. Click **Deploy**

### Important Render Settings

- **Instance Type**: Free (CPU)
- **Health Check Path**: `/health`
- **Auto-Deploy**: Enabled (for updates)

## Weekly API Key Rotation

The server automatically generates a new API key every 7 days using a deterministic algorithm based on the current week number.

### How It Works

- Keys are generated from: `year-week + admin_secret` hash
- Only the current week's key is valid
- Previous week's keys automatically expire
- No cron jobs required - rotation happens automatically
- Keys are stored in `current_key.json` for persistence

### Key Format

```
sk-xxxxxxxxxxxxxxxx (16 characters)
```

## API Endpoints

### Health Check
```bash
curl https://your-render-app.onrender.com/health
```

### View Current API Key (Admin Only)
```bash
curl -X GET https://your-render-app.onrender.com/current-key \
  -H "admin-secret: YOUR_ADMIN_SECRET"
```

Response:
```json
{
  "api_key": "sk-1a2b3c4d5e6f7g8h",
  "expiry": "2024-01-15T10:30:00",
  "days_remaining": 6
}
```

### Chat with Groq (Form Data)
```bash
curl -X POST https://your-render-app.onrender.com/chat \
  -H "x-api-key: sk-1a2b3c4d5e6f7g8h" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "prompt=Hello, how are you?"
```

### Chat with Groq (JSON)
```bash
curl -X POST https://your-render-app.onrender.com/chat \
  -H "x-api-key: sk-1a2b3c4d5e6f7g8h" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

Response:
```json
{
  "response": "Hello! I'm doing well, thank you for asking...",
  "model": "llama3-70b-8192",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

## CLI Client Example

```python
import requests
import json

# Replace with your actual values
API_URL = "https://your-render-app.onrender.com"
ADMIN_SECRET = "your_admin_secret"

def get_current_key():
    """Get the current weekly API key"""
    response = requests.get(
        f"{API_URL}/current-key",
        headers={"admin-secret": ADMIN_SECRET}
    )
    response.raise_for_status()
    return response.json()["api_key"]

def chat(prompt, api_key):
    """Send a chat request"""
    response = requests.post(
        f"{API_URL}/chat",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json"
        },
        json={"prompt": prompt}
    )
    response.raise_for_status()
    data = response.json()
    return data["response"]

# Usage example
if __name__ == "__main__":
    try:
        api_key = get_current_key()
        print(f"Current API key: {api_key}")
        
        response = chat("Tell me a joke", api_key)
        print(f"AI Response: {response}")
        
    except requests.RequestException as e:
        print(f"Error: {e}")
```

## Continue.dev Integration (VS Code Copilot Alternative)

Add to your Continue.dev config (`~/.continue/config.json`):

```json
{
  "models": [
    {
      "title": "My AI Gateway",
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "apiKey": "sk-1a2b3c4d5e6f7g8h",
      "apiBase": "https://your-render-app.onrender.com"
    }
  ]
}
```

**Important**: Update the `apiKey` weekly by calling the `/current-key` endpoint.

## Security Features

- ✅ Groq API key stored securely in environment variables
- ✅ Admin secret required for viewing current key
- ✅ Automatic weekly key rotation
- ✅ Only one valid API key at a time
- ✅ Invalid or expired keys rejected with HTTP 401
- ✅ No sensitive data exposed in responses
- ✅ Health check endpoint for monitoring
- ✅ Request timeouts to prevent hanging

## Performance & Reliability

### Render Free Tier Optimizations

- **Memory Usage**: < 50MB (well under 512MB limit)
- **Startup Time**: < 5 seconds
- **Request Handling**: Synchronous with proper timeouts
- **Error Handling**: Comprehensive error responses
- **Persistence**: JSON file for key storage

### Why This Works on Render Free

1. **Zero Heavy Dependencies**: Only Python standard library + requests
2. **CPU Only**: No GPU requirements
3. **Fast Startup**: No framework initialization delays
4. **Minimal Memory**: Tiny resource footprint
5. **Persistent Storage**: Uses file system for key storage

## Troubleshooting

### Common Issues

**401 Unauthorized**: 
- Check your API key is current (call `/current-key`)
- Verify the `x-api-key` header is set correctly

**403 Forbidden**:
- Check your `admin-secret` header for `/current-key` endpoint

**500 Server Error**:
- Verify `GROQ_API_KEY` environment variable is set
- Check Groq API status

**Deployment Issues**:
- Ensure all environment variables are set on Render
- Check build logs for dependency installation errors

### Debug Mode

The server runs silently by default. Any errors will appear in Render logs.

## Monitoring

### Health Check

The `/health` endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-10T15:30:00"
}
```

Use this for Render's health checks and monitoring.

### Rate Limits

- No built-in rate limiting (Render handles this)
- Groq API has its own rate limits
- Consider implementing rate limiting for production use

## Architecture

### Pure Python Implementation

This server uses only Python's built-in HTTP server:
- No FastAPI, Flask, or other frameworks
- No Pydantic or validation libraries
- No async/await complexity
- Minimal attack surface
- Guaranteed compatibility

### Request Flow

1. Client sends request with API key
2. Server validates API key
3. Server forwards request to Groq API
4. Server returns simplified response to client
5. All Groq API keys remain secure on server

## License

MIT License - feel free to use and modify.