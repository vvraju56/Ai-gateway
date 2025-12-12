# API Key Combiner

A modern, responsive web tool for combining multiple API keys into a single encoded format. Built with vanilla HTML, CSS, and JavaScript featuring a beautiful glassmorphism design.

## ✨ Features

- 🔑 **Multi-Key Input**: Paste multiple API keys (one per line)
- 📁 **.env File Upload**: Automatically extract API keys from environment files
- 🔐 **Base64 Encoding**: Securely combine keys into an encoded format
- 📋 **Copy to Clipboard**: One-click copy of combined keys
- 🎨 **Modern UI**: Glassmorphism design with smooth animations
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/vvraju56/Multiple-api-into-one.git
   cd Multiple-api-into-one
   ```

2. Open `public/index.html` in your browser:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server public -p 8000
   
   # Or simply open the file directly in your browser
   open public/index.html
   ```

### Vercel Deployment

#### Method 1: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vvraju56/Multiple-api-into-one.git)

#### Method 2: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   vercel --prod
   ```

#### Method 3: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub account to Vercel
3. Import the repository and deploy automatically

## 📁 Project Structure

```
Multiple-api-into-one/
├── public/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Styles and animations
│   └── script.js           # JavaScript functionality
├── vercel.json             # Vercel configuration
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🛠️ How It Works

### 1. **Input API Keys**
- Paste multiple API keys, one per line
- Or upload a `.env` file to automatically extract keys

### 2. **Generate Combined Key**
- Click "Generate Combined Key" to encode all keys
- Keys are combined into a JSON object and Base64 encoded

### 3. **Copy and Use**
- Copy the encoded key with one click
- Decode on your backend using:
  ```javascript
  const decoded = JSON.parse(atob(encodedKey));
  // Returns: { keys: ["key1", "key2", "key3"], created: timestamp }
  ```

### .env File Support

The tool automatically detects and extracts API keys from various formats:

```env
# Comma-separated keys
API_KEYS=sk-key1,sk-key2,sk-key3

# Individual key variables
OPENAI_KEY=sk-1234567890
SECRET_KEY=abc123def456

# Mixed formats
MULTIPLE_KEYS=key1,key2,key3
SINGLE_KEY=xyz789
```

## 🎨 Design Features

- **Glassmorphism UI**: Modern frosted glass effects
- **Smooth Animations**: Elegant hover and transition effects
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Easy on the eyes with gradient backgrounds
- **Accessibility**: Proper focus states and keyboard navigation

## 🌐 Live Demo

Check out the live demo: [https://your-vercel-app.vercel.app](https://your-vercel-app.vercel.app)

## 🔧 Configuration

### Vercel Environment Variables (Optional)

If you need environment variables, add them in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add your variables (copy from `.env.example`)

### Custom Domain

1. In Vercel dashboard, go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## 📱 Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Author**: [VV](https://vvraju.netlify.app/)
- **GitHub**: [vvraju56](https://github.com/vvraju56)
- **LinkedIn**: [Vishnu Raju V](https://www.linkedin.com/in/vishnuraju-v-757b9929b)

## ⭐ Support

If you find this project useful, please give it a star ⭐ on GitHub!

---

Made with ❤️ by [VV](https://vvraju.netlify.app/)