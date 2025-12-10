let selectedMethod = 'GET';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up method button listeners
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedMethod = this.dataset.method;
            
            // Show/hide request body based on method
            const dataGroup = document.getElementById('dataGroup');
            if (['POST', 'PUT', 'PATCH'].includes(selectedMethod)) {
                dataGroup.style.display = 'block';
            } else {
                dataGroup.style.display = 'none';
            }
        });
    });

    // Check service health on load
    checkHealth();
});

async function testAPI() {
    const publicKey = document.getElementById('publicKey').value;
    const endpoint = document.getElementById('endpoint').value;
    const requestBody = document.getElementById('requestBody').value;
    const headersText = document.getElementById('headers').value;
    
    if (!publicKey) {
        showResponse('Please enter a public API key', 'error');
        return;
    }
    
    if (!endpoint) {
        showResponse('Please enter an endpoint', 'error');
        return;
    }

    const testBtn = document.getElementById('testBtn');
    const originalText = testBtn.innerHTML;
    testBtn.innerHTML = '<span class="loading"></span>Testing...';
    testBtn.disabled = true;

    try {
        let headers = {};
        if (headersText.trim()) {
            try {
                headers = JSON.parse(headersText);
            } catch (e) {
                showResponse('Invalid JSON in headers field', 'error');
                return;
            }
        }

        let data = null;
        if (requestBody.trim() && ['POST', 'PUT', 'PATCH'].includes(selectedMethod)) {
            try {
                data = JSON.parse(requestBody);
            } catch (e) {
                showResponse('Invalid JSON in request body', 'error');
                return;
            }
        }

        const requestData = {
            method: selectedMethod,
            url: endpoint,
            headers: headers
        };

        if (data) {
            requestData.data = data;
        }

        const response = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': publicKey
            },
            body: JSON.stringify(requestData)
        });

        const responseData = await response.json();
        
        if (response.ok) {
            showResponse(JSON.stringify(responseData, null, 2), 'success');
        } else {
            showResponse(JSON.stringify(responseData, null, 2), 'error');
        }

    } catch (error) {
        showResponse(`Network Error: ${error.message}`, 'error');
    } finally {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }
}

async function checkHealth() {
    const statusElement = document.getElementById('serviceStatus');
    const healthBtn = document.getElementById('healthBtn');
    
    statusElement.textContent = 'Checking...';
    
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (response.ok) {
            statusElement.innerHTML = `<span style="color: #48bb78;">● Healthy</span> - ${data.availableKeys}/${data.totalKeys} keys available`;
            statusElement.style.color = '#22543d';
        } else {
            statusElement.innerHTML = `<span style="color: #f56565;">● Unhealthy</span>`;
            statusElement.style.color = '#742a2a';
        }
    } catch (error) {
        statusElement.innerHTML = `<span style="color: #f56565;">● Error</span> - ${error.message}`;
        statusElement.style.color = '#742a2a';
    }
}

function showResponse(content, type = 'info') {
    const responseDiv = document.getElementById('response');
    const responseContent = document.getElementById('responseContent');
    
    responseDiv.style.display = 'block';
    responseDiv.className = `response ${type}`;
    responseContent.textContent = content;
}

// Utility function to format JSON
function formatJSON(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return obj;
    }
}

// Example requests for quick testing
const exampleRequests = {
    'GET Users': {
        method: 'GET',
        endpoint: '/users',
        body: '',
        headers: '{"Content-Type": "application/json"}'
    },
    'POST User': {
        method: 'POST',
        endpoint: '/users',
        body: '{"name": "John Doe", "email": "john@example.com"}',
        headers: '{"Content-Type": "application/json"}'
    },
    'GET Status': {
        method: 'GET',
        endpoint: '/status',
        body: '',
        headers: '{}'
    }
};

// Add example buttons (optional enhancement)
function addExampleButtons() {
    const container = document.querySelector('.container');
    const exampleDiv = document.createElement('div');
    exampleDiv.style.marginTop = '20px';
    exampleDiv.style.paddingTop = '20px';
    exampleDiv.style.borderTop = '1px solid #e2e8f0';
    
    const title = document.createElement('h3');
    title.textContent = 'Example Requests:';
    title.style.marginBottom = '10px';
    title.style.fontSize = '16px';
    title.style.color = '#333';
    
    exampleDiv.appendChild(title);
    
    Object.keys(exampleRequests).forEach(name => {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.style.cssText = 'margin: 5px; padding: 8px 12px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer; font-size: 12px;';
        btn.onclick = () => loadExample(exampleRequests[name]);
        exampleDiv.appendChild(btn);
    });
    
    container.appendChild(exampleDiv);
}

function loadExample(example) {
    // Set method
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.method === example.method) {
            btn.classList.add('active');
        }
    });
    selectedMethod = example.method;
    
    // Set endpoint
    document.getElementById('endpoint').value = example.endpoint;
    
    // Set body
    document.getElementById('requestBody').value = example.body;
    
    // Set headers
    document.getElementById('headers').value = example.headers;
    
    // Show/hide body field
    const dataGroup = document.getElementById('dataGroup');
    if (['POST', 'PUT', 'PATCH'].includes(selectedMethod)) {
        dataGroup.style.display = 'block';
    } else {
        dataGroup.style.display = 'none';
    }
}

// Auto-refresh health status every 30 seconds
setInterval(checkHealth, 30000);