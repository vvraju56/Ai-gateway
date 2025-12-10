# API Key Aggregator - Vercel Serverless

A production-ready API key aggregator built with Vercel serverless functions that combines multiple private API keys into a single public endpoint with automatic rotation.

## 🚀 Features

- **Serverless Architecture**: Runs on Vercel with zero cold start overhead
- **API Key Aggregation**: Accept one public API key and manage multiple private API keys
- **Dual Rotation Modes**: Round-robin and random key selection strategies
- **Secure Authentication**: Middleware validates public API key via headers
- **Error Handling**: Comprehensive error responses for all failure scenarios
- **Modern Frontend**: Clean, responsive interface with real-time testing
- **CORS Enabled**: Cross-origin requests supported
- **Environment Configured**: Secure environment variable management

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Vercel account (free tier works)
- Multiple API keys from your target service
- One public API key for client authentication

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vvraju56/Multiple-api-into-one.git
   cd Multiple-api-into-one
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual API keys:
   ```env
   PUBLIC_API_KEY=your_public_key_here
   API_KEYS=key1,key2,key3,key4,key5
   EXTERNAL_API_URL=https://api.example.com
   NODE_ENV=development
   ```

5. **Start local development server**
   ```bash
   npm run dev
   ```
   
   Visit: http://localhost:3000

## 🌐 Deployment

### Option 1: Vercel CLI Deployment

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy your project**
   ```bash
   vercel
   ```
   
   Follow the prompts to link your project

3. **Set environment variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these variables:
     ```
     PUBLIC_API_KEY=your_actual_public_key
     API_KEYS=key1,key2,key3,key4,key5
     EXTERNAL_API_URL=https://api.example.com
     NODE_ENV=production
     ```

4. **Redeploy to apply variables**
   ```bash
   vercel --prod
   ```

### Option 2: Vercel Dashboard Deployment

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Import on Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the project settings

3. **Configure Environment Variables**
   - In project settings → Environment Variables
   - Add the same variables as above

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-project-name.vercel.app`

## 📡 API Usage

### Main Endpoint

**POST** `/api/proxy?mode=round-robin|random`

#### Headers
```
Content-Type: application/json
X-API-Key: your_public_key_here
```

#### Request Body (JSON)
```json
{
  "method": "GET|POST|PUT|DELETE",
  "data": {}, // Optional request body for POST/PUT
  "any_other_field": "value"
}
```

#### Query Parameters
- `mode` (optional): `"round-robin"` (default) or `"random"`
- Any other parameters will be forwarded to the external API

#### Success Response (200)
```json
{
  "success": true,
  "data": {}, // Response from external API
  "status": 200,
  "headers": {},
  "metadata": {
    "rotationMode": "round-robin",
    "keyUsed": "...key4",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "API key required in X-API-Key header"
}
```

**401 Invalid Key**
```json
{
  "error": "Invalid API key"
}
```

**500 Upstream Failure**
```json
{
  "error": "Upstream API failed - Authentication error with private key",
  "details": {},
  "keyUsed": "...key4"
}
```

## 🧪 Testing

### Frontend Testing
1. Open your deployed URL or http://localhost:3000
2. Enter your public API key
3. Select rotation mode (round-robin or random)
4. Configure request parameters
5. Click "Call Proxy API"
6. View real-time responses

### curl Testing

**Basic GET Request:**
```bash
curl -X POST "https://your-project.vercel.app/api/proxy?mode=round-robin" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_public_key_here" \
  -d '{}'
```

**POST with Data:**
```bash
curl -X POST "https://your-project.vercel.app/api/proxy?mode=random" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_public_key_here" \
  -d '{
    "method": "POST",
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

**With Query Parameters:**
```bash
curl -X POST "https://your-project.vercel.app/api/proxy?limit=10&page=1" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_public_key_here" \
  -d '{}'
```

## 📁 Project Structure

```
api-key-proxy/
├── package.json              # Dependencies and scripts
├── .env.example             # Environment variables template
├── vercel.json              # Vercel configuration
├── api/
│   └── proxy.js              # Serverless function
└── public/
    ├── index.html             # Frontend demo
    ├── script.js              # Frontend logic
    └── styles.css             # Styling
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PUBLIC_API_KEY` | Yes | Public key for client authentication | `public_key_123` |
| `API_KEYS` | Yes | Comma-separated private API keys | `key1,key2,key3` |
| `EXTERNAL_API_URL` | No | Base URL for external API | `https://api.example.com` |
| `NODE_ENV` | No | Environment setting | `production` |

### Key Rotation Strategies

#### Round-Robin (Default)
- Cycles through keys sequentially
- Ensures even distribution
- Predictable pattern
- Use `?mode=round-robin`

#### Random
- Selects keys randomly
- Better for avoiding rate limits
- Less predictable pattern
- Use `?mode=random`

## 🔒 Security Features

- **Header Authentication**: Secure API key validation via `X-API-Key` header
- **Environment Isolation**: Private keys never exposed to frontend
- **CORS Protection**: Configurable cross-origin policies
- **Input Validation**: JSON parsing with error handling
- **Rate Limiting**: Built-in protection (configurable)
- **Error Sanitization**: No sensitive data in error responses

## 📊 Monitoring & Debugging

### Serverless Logs
- View logs in Vercel dashboard
- Real-time request tracking
- Error monitoring
- Performance metrics

### Frontend Features
- Real-time request/response display
- Syntax highlighting for JSON
- Error message formatting
- Copy to clipboard functionality
- Keyboard shortcuts (Ctrl+Enter, Escape)

## 🚀 Advanced Usage

### Custom External API
Modify `EXTERNAL_API_URL` to point to your target API:
```env
EXTERNAL_API_URL=https://api.github.com
EXTERNAL_API_URL=https://api.openai.com/v1
EXTERNAL_API_URL=https://api.stripe.com/v1
```

### Request Forwarding
The proxy forwards:
- Query parameters to external API
- Request body for POST/PUT requests
- Custom headers (except authentication)
- HTTP methods (GET, POST, PUT, DELETE)

### Response Transformation
Responses include:
- Original external API data
- Response metadata
- Key rotation information
- Timestamps and status codes

## 🛠️ Development Scripts

```bash
npm run dev      # Start local development server
npm run build    # Build for production
npm run deploy   # Deploy to Vercel production
```

## 🔧 Customization

### Adding New Rotation Modes
In `api/proxy.js`, modify the `getApiKey()` function:
```javascript
function getApiKey(mode = 'round-robin') {
  // Add your custom logic here
  if (mode === 'weighted') {
    // Implement weighted selection
  }
  // ... existing logic
}
```

### Custom Authentication
Modify the authentication section in `api/proxy.js`:
```javascript
// Add custom validation logic
if (providedApiKey !== PUBLIC_API_KEY) {
  // Custom error handling
  return res.status(401).json({ 
    error: 'Custom authentication failed' 
  });
}
```

## 🐛 Troubleshooting

### Common Issues

**"No API keys configured"**
- Check `API_KEYS` environment variable
- Ensure keys are comma-separated
- Verify Vercel environment variables

**"Invalid API key" (401)**
- Verify `PUBLIC_API_KEY` matches exactly
- Check header spelling: `X-API-Key`
- Ensure no extra spaces in key

**"Upstream API failed" (500)**
- Check external API URL is correct
- Verify private API keys are valid
- Check external API service status

**CORS Errors**
- Ensure proper headers in serverless function
- Check frontend request headers
- Verify Vercel configuration

### Debug Mode
Add console logging for debugging:
```javascript
console.log('Request received:', {
  method: req.method,
  headers: req.headers,
  query: req.query
});
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Live Demo

Once deployed, your service will be available at:
`https://your-project-name.vercel.app`

### Available Endpoints
- Frontend: `https://your-project-name.vercel.app/`
- API Proxy: `https://your-project-name.vercel.app/api/proxy`
- Health Check: Built into response metadata

---

**Built with ❤️ for modern serverless architecture on Vercel**