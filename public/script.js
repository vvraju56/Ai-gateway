// DOM Elements
const envFileInput = document.getElementById('envFile');
const multiKeysTextarea = document.getElementById('multiKeys');
const combinedKeyTextarea = document.getElementById('combinedKey');

// Main Functions
function combineKeys() {
    const rawInput = document.getElementById("multiKeys").value.trim();

    if (!rawInput) {
        showNotification("Please paste API keys first.", "warning");
        return;
    }

    const keys = rawInput.split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0);

    if (keys.length === 0) {
        showNotification("Please enter valid API keys", "warning");
        return;
    }

    // Create a combined encoded key
    const combinedObj = {
        keys: keys,
        created: Math.floor(Date.now() / 1000) // Unix timestamp
    };

    const encoded = btoa(JSON.stringify(combinedObj));

    document.getElementById("combinedKey").value = encoded;
    showNotification(`Successfully combined ${keys.length} API keys`, "success");
}

function copyCombined() {
    const output = document.getElementById("combinedKey");
    const text = output.value.trim();
    
    if (!text) {
        showNotification("No combined key to copy", "warning");
        return;
    }
    
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification("Combined key copied!", "success");
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const output = document.getElementById("combinedKey");
    output.select();
    document.execCommand('copy');
    showNotification("Combined key copied!", "success");
}

// .env File Reader Function
function readEnvFile() {
    const fileInput = document.getElementById("envFile");
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.name.endsWith('.env')) {
        showNotification("Please upload a .env file", "error");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const content = event.target.result;

        // Parse .env lines
        const lines = content.split("\n");
        let extractedKeys = [];

        lines.forEach(line => {
            line = line.trim();

            // Skip empty lines or comments
            if (!line || line.startsWith("#")) return;

            // Process key=value format
            const equalIndex = line.indexOf("=");
            if (equalIndex === -1) return;

            const key = line.substring(0, equalIndex).trim();
            const value = line.substring(equalIndex + 1).trim();

            if (!value) return;

            // If API_KEYS=key1,key2,key3
            if (key === "API_KEYS") {
                extractedKeys.push(...value.split(",").map(v => v.trim()));
            }
            // If single keys (example: KEY1=xxxx)
            else if (key.toLowerCase().includes("key")) {
                extractedKeys.push(value.trim());
            }
        });

        if (extractedKeys.length > 0) {
            // Get existing keys and merge with extracted ones
            const existingKeys = document.getElementById("multiKeys").value.trim();
            const allKeys = existingKeys ? 
                [...new Set([...extractedKeys, ...existingKeys.split("\n").map(k => k.trim())])] : 
                extractedKeys;
            
            document.getElementById("multiKeys").value = allKeys.join("\n");
            showNotification(`${extractedKeys.length} API keys loaded from .env file!`, "success");
        } else {
            showNotification("No API keys found in this .env file.", "warning");
        }
        
        // Clear the file input
        fileInput.value = '';
    };

    reader.readAsText(file);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i> ';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i> ';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i> ';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i> ';
    }
    
    notification.innerHTML = icon + message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(139, 195, 74, 0.9))';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(233, 30, 99, 0.9))';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(255, 193, 7, 0.9))';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(103, 58, 183, 0.9))';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set placeholder text
    if (multiKeysTextarea) {
        multiKeysTextarea.placeholder = `Example API keys:
sk-1234567890abcdef
sk-fedcba0987654321
sk-abcdef1234567890

Or upload a .env file to automatically extract API keys...`;
    }
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    console.log('API Key Combiner initialized successfully');
});

// Drag and drop functionality for .env files (optional enhancement)
document.addEventListener('DOMContentLoaded', function() {
    const multiKeysCard = document.querySelector('.card');
    
    if (multiKeysCard) {
        multiKeysCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            multiKeysCard.style.background = 'rgba(255, 255, 255, 0.12)';
        });
        
        multiKeysCard.addEventListener('dragleave', (e) => {
            e.preventDefault();
            multiKeysCard.style.background = 'rgba(255, 255, 255, 0.08)';
        });
        
        multiKeysCard.addEventListener('drop', (e) => {
            e.preventDefault();
            multiKeysCard.style.background = 'rgba(255, 255, 255, 0.08)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.env')) {
                envFileInput.files = files;
                readEnvFile();
            }
        });
    }
});