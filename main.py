from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import uuid
import hashlib
import requests
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ADMIN_SECRET = os.getenv("ADMIN_SECRET")
if not GROQ_API_KEY or not ADMIN_SECRET:
    raise ValueError("GROQ_API_KEY and ADMIN_SECRET must be set in environment variables")

# API key storage
API_KEY_FILE = "current_key.json"

def generate_weekly_key():
    """Generate a deterministic weekly API key based on current week"""
    current_week = datetime.now().isocalendar()[:2]  # (year, week_number)
    week_string = f"{current_week[0]}-{current_week[1]}"
    # Create deterministic key from week string + secret
    key_hash = hashlib.sha256((week_string + str(ADMIN_SECRET)).encode()).hexdigest()[:16]
    return f"sk-{key_hash}"

def load_current_key():
    """Load or generate current weekly API key"""
    new_key = generate_weekly_key()
    expiry = datetime.now() + timedelta(days=7)
    
    # Check if we have a stored key that's still valid
    if os.path.exists(API_KEY_FILE):
        try:
            with open(API_KEY_FILE, "r") as f:
                data = json.load(f)
                stored_expiry = datetime.fromisoformat(data["expiry"])
                if datetime.now() < stored_expiry and data["key"] == new_key:
                    return data["key"], stored_expiry
        except (json.JSONDecodeError, KeyError, ValueError):
            pass  # File corrupted, generate new key
    
    # Save new key
    save_current_key(new_key, expiry)
    return new_key, expiry

def save_current_key(key, expiry):
    """Save current API key and expiry"""
    with open(API_KEY_FILE, "w") as f:
        json.dump({"key": key, "expiry": expiry.isoformat()}, f)

# Load current key on startup
current_api_key, key_expiry = load_current_key()

class APIGatewayHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        elif self.path == "/current-key":
            admin_secret = self.headers.get("admin-secret")
            if admin_secret != ADMIN_SECRET:
                self.send_error(403, "Invalid admin secret")
                return
            
            # Refresh key if needed
            global current_api_key, key_expiry
            if datetime.now() >= key_expiry:
                current_api_key, key_expiry = load_current_key()
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = {
                "api_key": current_api_key,
                "expiry": key_expiry.isoformat(),
                "days_remaining": (key_expiry - datetime.now()).days
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        else:
            self.send_error(404, "Not Found")
            return
    
    def do_POST(self):
        # Check API key for all POST requests
        api_key = self.headers.get("x-api-key")
        if not api_key or api_key != current_api_key:
            self.send_error(401, "Invalid or expired API key")
            return
        
        if self.path == "/chat":
            # Get content length
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            # Parse form data
            content_type = self.headers.get("Content-Type", "")
            if "application/x-www-form-urlencoded" in content_type:
                # Parse form data
                parsed_data = parse_qs(post_data.decode())
                prompt = parsed_data.get("prompt", [""])[0]
            elif "application/json" in content_type:
                # Parse JSON
                try:
                    json_data = json.loads(post_data.decode())
                    prompt = json_data.get("prompt", "")
                except json.JSONDecodeError:
                    self.send_error(400, "Invalid JSON")
                    return
            else:
                self.send_error(400, "Unsupported content type")
                return
            
            if not prompt:
                self.send_error(400, "Prompt is required")
                return
            
            # Call Groq API
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.7
                    },
                    timeout=30
                )
                response.raise_for_status()
                data = response.json()
                
                # Return simplified response
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                result = {
                    "response": data["choices"][0]["message"]["content"],
                    "model": data["model"],
                    "usage": data.get("usage", {})
                }
                self.wfile.write(json.dumps(result).encode())
                
            except requests.RequestException as e:
                self.send_error(500, f"Groq API error: {str(e)}")
            except KeyError as e:
                self.send_error(500, f"Invalid response from Groq API: {str(e)}")
        
        else:
            self.send_error(404, "Not Found")
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def run_server():
    port = int(os.environ.get("PORT", 8000))
    server_address = ("", port)
    httpd = HTTPServer(server_address, APIGatewayHandler)
    print(f"Starting server on port {port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()