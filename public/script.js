// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const rotationModeSelect = document.getElementById('rotationMode');
const httpMethodSelect = document.getElementById('httpMethod');
const queryParamsTextarea = document.getElementById('queryParams');
const requestBodyTextarea = document.getElementById('requestBody');
const requestBodyGroup = document.getElementById('requestBodyGroup');
const callProxyBtn = document.getElementById('callProxyBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const resultStatus = document.getElementById('resultStatus');
const resultTime = document.getElementById('resultTime');
const resultContent = document.getElementById('resultContent');
const errorContent = document.getElementById('errorContent');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Show/hide request body based on HTTP method
    httpMethodSelect.addEventListener('change', function() {
        const method = this.value;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            requestBodyGroup.style.display = 'block';
        } else {
            requestBodyGroup.style.display = 'none';
        }
    });

    // Add enter key support for API key input
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            callProxy();
        }
    });
});

/**
 * Main function to call the proxy API
 */
async function callProxy() {
    const apiKey = apiKeyInput.value.trim();
    const rotationMode = rotationModeSelect.value;
    const httpMethod = httpMethodSelect.value;
    const queryParamsText = queryParamsTextarea.value.trim();
    const requestBodyText = requestBodyTextarea.value.trim();

    // Validation
    if (!apiKey) {
        showError('Please enter a public API key');
        return;
    }

    // Parse query parameters
    let queryParams = {};
    if (queryParamsText) {
        try {
            queryParams = JSON.parse(queryParamsText);
        } catch (e) {
            showError('Invalid JSON in query parameters');
            return;
        }
    }

    // Parse request body
    let requestBody = null;
    if (requestBodyText) {
        try {
            requestBody = JSON.parse(requestBodyText);
        } catch (e) {
            showError('Invalid JSON in request body');
            return;
        }
    }

    // Show loading state
    showLoading();
    
    try {
        // Build request URL with rotation mode
        const url = new URL('/api/proxy', window.location.origin);
        url.searchParams.set('mode', rotationMode);

        // Prepare request configuration
        const fetchConfig = {
            method: httpMethod,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        };

        // Add query parameters to URL
        Object.keys(queryParams).forEach(key => {
            url.searchParams.set(key, queryParams[key]);
        });

        // Add request body for POST/PUT requests
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
            fetchConfig.body = JSON.stringify(requestBody);
        }

        console.log('Making request to:', url.toString());
        console.log('Request config:', fetchConfig);

        // Make the API call
        const response = await fetch(url.toString(), fetchConfig);
        const data = await response.json();

        if (response.ok) {
            showSuccess(data, response.status);
        } else {
            showError(data.error || 'Unknown error', response.status, data);
        }

    } catch (error) {
        console.error('Network error:', error);
        showError(`Network error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Show loading state
 */
function showLoading() {
    loadingDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    callProxyBtn.disabled = true;
    callProxyBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingDiv.style.display = 'none';
    callProxyBtn.disabled = false;
    callProxyBtn.innerHTML = '<span class="btn-icon">🚀</span> Call Proxy API';
}

/**
 * Show successful response
 */
function showSuccess(data, status) {
    resultsDiv.style.display = 'block';
    errorDiv.style.display = 'none';

    // Update status badge
    resultStatus.textContent = `${status} Success`;
    resultStatus.className = 'status-badge success';
    
    // Update timestamp
    resultTime.textContent = new Date().toLocaleString();

    // Format and display response
    const formattedResponse = JSON.stringify(data, null, 2);
    resultContent.textContent = formattedResponse;

    // Add syntax highlighting
    applySyntaxHighlighting(resultContent);
}

/**
 * Show error message
 */
function showError(message, status = null, data = null) {
    errorDiv.style.display = 'block';
    resultsDiv.style.display = 'none';

    const errorContentText = status ? 
        `Status: ${status}\nMessage: ${message}${data ? `\nDetails: ${JSON.stringify(data, null, 2)}` : ''}` :
        message;

    errorContent.textContent = errorContentText;
}

/**
 * Clear all results
 */
function clearResults() {
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
}

/**
 * Load example configurations
 */
function loadExample(type) {
    switch (type) {
        case 'basic':
            httpMethodSelect.value = 'GET';
            queryParamsTextarea.value = '';
            requestBodyTextarea.value = '';
            rotationModeSelect.value = 'round-robin';
            requestBodyGroup.style.display = 'none';
            break;
            
        case 'withParams':
            httpMethodSelect.value = 'GET';
            queryParamsTextarea.value = JSON.stringify({
                limit: 10,
                page: 1,
                category: 'users'
            }, null, 2);
            requestBodyTextarea.value = '';
            rotationModeSelect.value = 'round-robin';
            requestBodyGroup.style.display = 'none';
            break;
            
        case 'post':
            httpMethodSelect.value = 'POST';
            queryParamsTextarea.value = '';
            requestBodyTextarea.value = JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user'
            }, null, 2);
            rotationModeSelect.value = 'round-robin';
            requestBodyGroup.style.display = 'block';
            break;
            
        case 'randomMode':
            httpMethodSelect.value = 'GET';
            queryParamsTextarea.value = JSON.stringify({
                limit: 5
            }, null, 2);
            requestBodyTextarea.value = '';
            rotationModeSelect.value = 'random';
            requestBodyGroup.style.display = 'none';
            break;
    }
}

/**
 * Basic syntax highlighting for JSON
 */
function applySyntaxHighlighting(element) {
    let json = element.textContent;
    
    // Add basic syntax highlighting
    json = json
        .replace(/(".*?")/g, '<span class="json-string">$1</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\b-?\d+\.?\d*\b/g, '<span class="json-number">$&</span>');
    
    element.innerHTML = json;
}

/**
 * Format JSON with proper indentation
 */
function formatJSON(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return obj;
    }
}

/**
 * Copy response to clipboard
 */
function copyToClipboard() {
    const text = resultContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const originalText = callProxyBtn.innerHTML;
        callProxyBtn.innerHTML = '<span class="btn-icon">✅</span> Copied!';
        setTimeout(() => {
            callProxyBtn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to call API
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        callProxy();
    }
    
    // Escape to clear results
    if (e.key === 'Escape') {
        clearResults();
    }
});

// Add copy button functionality
document.addEventListener('DOMContentLoaded', function() {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.onclick = copyToClipboard;
    
    const resultHeader = document.querySelector('.result-header');
    if (resultHeader) {
        resultHeader.appendChild(copyBtn);
    }
});