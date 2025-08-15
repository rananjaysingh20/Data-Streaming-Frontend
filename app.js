class MT5TickStream {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.selectedCurrencies = new Set();
        this.tickData = new Map();
        this.apiToken = ''; // Empty token for development (matches backend default)
        this.backendUrl = 'https://william-convenient-partner-chairman.trycloudflare.com';
        this.defaultCurrencies = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD']; // Default currencies to monitor
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2 seconds
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        this.initializeConnection(); // Auto-connect on startup
    }

    initializeElements() {
        this.elements = {
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            apiToken: document.getElementById('api-token'),
            connectBtn: document.getElementById('connect-btn'),
            disconnectBtn: document.getElementById('disconnect-btn'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchResults: document.getElementById('search-results'),
            selectedList: document.getElementById('selected-list'),
            tickDisplay: document.getElementById('tick-display')
        };
    }

    bindEvents() {
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.elements.searchBtn.addEventListener('click', () => this.searchCurrencies());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCurrencies();
        });
    }

    async initializeConnection() {
        // Set default token in UI
        this.elements.apiToken.value = this.apiToken;
        
        // Auto-connect to backend
        console.log('🚀 Auto-connecting to backend...');
        await this.connect();
        
        // Add default currencies if connection successful
        if (this.isConnected) {
            console.log('📊 Adding default currencies...');
            this.defaultCurrencies.forEach(currency => {
                this.addCurrency(currency);
            });
            
            // Also search for EUR currencies to populate the search results
            this.elements.searchInput.value = 'EUR';
            await this.searchCurrencies();
        }
    }

    async connect() {
        this.apiToken = this.elements.apiToken.value.trim();
        
        if (!this.apiToken) {
            console.log('ℹ️ No API token configured (using empty token for development)');
            this.apiToken = '';
            this.elements.apiToken.value = this.apiToken;
        }

        console.log('🔌 Attempting to connect to backend...');
        this.updateConnectionStatus('connecting');
        
        try {
            // Test connection with health check
            console.log('🏥 Testing backend health...');
            const response = await fetch(`${this.backendUrl}/health`);
            if (!response.ok) {
                throw new Error(`Backend health check failed: ${response.status}`);
            }
            
            const healthData = await response.json();
            console.log('✅ Backend health check passed:', healthData);

            // Establish WebSocket connection
            const wsUrl = this.apiToken 
                ? `${this.backendUrl.replace('http', 'ws')}/ws/ticks?token=${encodeURIComponent(this.apiToken)}`
                : `${this.backendUrl.replace('http', 'ws')}/ws/ticks`;
            console.log('🔗 Connecting to WebSocket:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🎉 WebSocket connected successfully!');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                this.subscribeToSelectedCurrencies();
                this.startPingInterval();
            };

            this.ws.onmessage = async (event) => {
                await this.handleWebSocketMessage(event);
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.stopPingInterval();
                
                // Attempt to reconnect if it wasn't a manual disconnect
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                console.error('❌ WebSocket URL was:', wsUrl);
                console.error('❌ WebSocket ready state:', this.ws.readyState);
                this.updateConnectionStatus('disconnected');
            };

        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.updateConnectionStatus('disconnected');
            
            // Show user-friendly error message
            this.showConnectionError(error.message);
        }
    }

    disconnect() {
        console.log('🔌 Disconnecting from backend...');
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect'); // Normal closure
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        this.stopPingInterval();
    }

    async attemptReconnect() {
        this.reconnectAttempts++;
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        this.updateConnectionStatus('connecting');
        
        setTimeout(async () => {
            try {
                await this.connect();
                if (this.isConnected) {
                    console.log('✅ Reconnection successful!');
                    this.reconnectAttempts = 0; // Reset counter on successful connection
                }
            } catch (error) {
                console.error('❌ Reconnection failed:', error);
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('❌ Max reconnection attempts reached. Please check your backend server.');
                    this.showConnectionError('Max reconnection attempts reached. Please refresh the page and ensure backend is running.');
                }
            }
        }, this.reconnectDelay);
    }

    showConnectionError(message) {
        // Create a user-friendly error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'connection-error';
        errorDiv.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 8px; margin: 16px 0; border: 1px solid #f5c6cb;">
                <strong>Connection Error:</strong> ${message}
                <br><small>Make sure the backend server is running on https://william-convenient-partner-chairman.trycloudflare.com</small>
            </div>
        `;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.connection-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message to the page
        document.querySelector('.connection-settings').appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }

    updateConnectionStatus(status) {
        const { statusIndicator, statusText, connectBtn, disconnectBtn } = this.elements;
        
        statusIndicator.className = `status-dot ${status}`;
        
        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
                connectBtn.disabled = true;
                disconnectBtn.disabled = true;
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                break;
        }
    }

    async searchCurrencies() {
        const query = this.elements.searchInput.value.trim();
        if (!query) {
            console.warn('⚠️ No search query provided');
            return;
        }

        console.log(`🔍 Searching for currencies: "${query}"`);

        try {
            const response = await fetch(`${this.backendUrl}/api/symbols?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-API-Key': this.apiToken
                }
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Found ${data.results.length} currencies:`, data.results.map(r => r.name));
            this.displaySearchResults(data.results);

        } catch (error) {
            console.error('❌ Search error:', error);
            this.showSearchError(error.message);
        }
    }

    showSearchError(message) {
        this.elements.searchResults.innerHTML = `
            <div class="empty-state" style="color: #dc3545;">
                <div class="icon">⚠️</div>
                <p>Search failed: ${message}</p>
                <small>Check console for details</small>
            </div>
        `;
    }

    displaySearchResults(currencies) {
        const { searchResults } = this.elements;
        
        if (currencies.length === 0) {
            searchResults.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No currencies found</p></div>';
            return;
        }

        searchResults.innerHTML = currencies.map(currency => {
            const isSelected = this.selectedCurrencies.has(currency.name);
            return `
                <div class="currency-item">
                    <span>${currency.name}</span>
                    <button class="add-btn" 
                            data-symbol="${currency.name}"
                            ${isSelected ? 'disabled' : ''}>
                        ${isSelected ? 'Added' : 'Add'}
                    </button>
                </div>
            `;
        }).join('');

        // Add event listeners to the new buttons
        searchResults.querySelectorAll('.add-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const symbol = e.target.getAttribute('data-symbol');
                this.addCurrency(symbol);
            });
        });
    }

    addCurrency(symbol) {
        if (this.selectedCurrencies.has(symbol)) {
            console.log(`⚠️ Currency ${symbol} is already selected`);
            return;
        }

        console.log(`➕ Adding currency: ${symbol}`);
        this.selectedCurrencies.add(symbol);
        this.updateSelectedCurrenciesList();
        this.updateTickDisplayEmptyState();
        
        // Subscribe to this specific currency
        this.subscribeToSingleCurrency(symbol);
        
        // Update search results to show this currency as added
        this.refreshSearchResults();
    }

    removeCurrency(symbol) {
        console.log(`➖ Removing currency: ${symbol}`);
        this.selectedCurrencies.delete(symbol);
        this.updateSelectedCurrenciesList();
        this.updateTickDisplayEmptyState();
        this.unsubscribeFromCurrency(symbol);
        this.removeTickDisplay(symbol);
        
        // Update search results to show this currency as available again
        this.refreshSearchResults();
    }

    updateSelectedCurrenciesList() {
        const { selectedList } = this.elements;
        
        if (this.selectedCurrencies.size === 0) {
            selectedList.innerHTML = '<div class="empty-state"><div class="icon">📊</div><p>No currencies selected</p></div>';
            return;
        }

        selectedList.innerHTML = Array.from(this.selectedCurrencies).map(symbol => `
            <div class="selected-currency">
                <span>${symbol}</span>
                <button class="remove-btn" data-symbol="${symbol}">
                    Remove
                </button>
            </div>
        `).join('');

        // Add event listeners to the remove buttons
        selectedList.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const symbol = e.target.getAttribute('data-symbol');
                this.removeCurrency(symbol);
            });
        });
    }

    subscribeToSelectedCurrencies() {
        if (!this.isConnected || !this.ws) {
            console.log('⚠️ Cannot subscribe: WebSocket not connected');
            return;
        }

        const symbols = Array.from(this.selectedCurrencies);
        if (symbols.length > 0) {
            console.log(`📡 Subscribing to currencies: ${symbols.join(', ')}`);
            this.ws.send(JSON.stringify({
                action: 'subscribe',
                symbols: symbols
            }));
        }
    }

    subscribeToSingleCurrency(symbol) {
        if (!this.isConnected || !this.ws) {
            console.log(`⚠️ Cannot subscribe to ${symbol}: WebSocket not connected`);
            return;
        }

        console.log(`📡 Subscribing to currency: ${symbol}`);
        // Send exactly the message format the backend expects
        this.ws.send(JSON.stringify({
            action: 'subscribe',
            symbols: [symbol]
        }));
    }

    unsubscribeFromCurrency(symbol) {
        if (!this.isConnected || !this.ws) {
            return;
        }

        console.log(`📡 Unsubscribing from currency: ${symbol}`);
        this.ws.send(JSON.stringify({
            action: 'unsubscribe',
            symbols: [symbol]
        }));
    }

    refreshSearchResults() {
        // Re-trigger the last search to update button states
        const query = this.elements.searchInput.value.trim();
        if (query) {
            this.searchCurrencies();
        }
    }

    async handleWebSocketMessage(event) {
        try {
            let messageText;
            
            // Handle both text and binary (Blob) messages
            if (event.data instanceof Blob) {
                console.log('📦 Received binary WebSocket message (Blob)');
                messageText = await event.data.text();
            } else {
                console.log('📝 Received text WebSocket message');
                messageText = event.data;
            }
            
            console.log('📋 Raw message text:', messageText);
            const message = JSON.parse(messageText);
            
            switch (message.type) {
                case 'connected':
                    console.log('🎉 WebSocket connected:', message.message);
                    break;
                case 'ticks':
                    console.log(`📈 Received ${message.data.length} tick updates:`, message.data.map(t => `${t.symbol}=${t.bid}/${t.ask}`));
                    // Process each tick update exactly as backend sends them
                    this.processTickUpdates(message.data);
                    break;
                case 'subscribed':
                    console.log('✅ Successfully subscribed to symbols:', message.symbols);
                    break;
                case 'unsubscribed':
                    console.log('➖ Successfully unsubscribed from symbols:', message.symbols);
                    break;
                case 'pong':
                    console.log('🏓 Received pong - connection alive');
                    break;
                case 'error':
                    console.error('❌ WebSocket server error:', message.error);
                    break;
                default:
                    console.log('❓ Unknown message type:', message.type, message);
            }
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
            console.log('Raw message:', event.data);
            console.log('Message type:', typeof event.data);
            console.log('Is Blob:', event.data instanceof Blob);
        }
    }

    processTickUpdates(ticks) {
        // Process tick updates exactly as they come from backend
        ticks.forEach(tick => {
            console.log(`💰 ${tick.symbol}: Bid=${tick.bid}, Ask=${tick.ask}, Last=${tick.last}, Time=${tick.time_iso}`);
            
            // Store the tick data
            this.tickData.set(tick.symbol, tick);
            
            // Update the display immediately
            this.renderTickData(tick);
        });
    }

    renderTickData(tick) {
        const { tickDisplay } = this.elements;
        const symbol = tick.symbol;
        
        // Clear empty state when first tick data arrives
        const emptyState = tickDisplay.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        let tickCard = document.getElementById(`tick-${symbol}`);
        
        if (!tickCard) {
            console.log(`📊 Creating tick display card for ${symbol}`);
            tickCard = document.createElement('div');
            tickCard.id = `tick-${symbol}`;
            tickCard.className = 'tick-card';
            tickDisplay.appendChild(tickCard);
        }

        // Use the exact data structure from backend
        const displayTime = tick.time_iso ? new Date(tick.time_iso).toLocaleString() : 'N/A';
        const localTime = tick.time ? new Date(tick.time).toLocaleTimeString() : 'N/A';
        
        tickCard.innerHTML = `
            <div class="symbol">${symbol}</div>
            <div class="price-info">
                <div class="price-item bid">
                    <div class="label">Bid</div>
                    <div class="value">${tick.bid !== null ? tick.bid.toFixed(5) : 'N/A'}</div>
                </div>
                <div class="price-item ask">
                    <div class="label">Ask</div>
                    <div class="value">${tick.ask !== null ? tick.ask.toFixed(5) : 'N/A'}</div>
                </div>
                <div class="price-item last">
                    <div class="label">Last</div>
                    <div class="value">${tick.last !== null ? tick.last.toFixed(5) : 'N/A'}</div>
                </div>
            </div>
            <div class="additional-info">
                <div class="volume">Volume: ${tick.volume !== null ? tick.volume.toLocaleString() : 'N/A'}</div>
                <div class="spread">Spread: ${(tick.bid !== null && tick.ask !== null) ? (tick.ask - tick.bid).toFixed(5) : 'N/A'}</div>
            </div>
            <div class="time">🕒 ${localTime} | 📊 ${displayTime}</div>
        `;

        // Add highlight effect for new data (matches backend 10Hz updates)
        tickCard.style.animation = 'none';
        tickCard.offsetHeight; // Trigger reflow
        tickCard.style.animation = 'highlight 0.5s ease';
    }

    removeTickDisplay(symbol) {
        const tickCard = document.getElementById(`tick-${symbol}`);
        if (tickCard) {
            tickCard.remove();
        }
        this.tickData.delete(symbol);
    }

    updateUI() {
        this.updateSelectedCurrenciesList();
        this.updateTickDisplayEmptyState();
    }

    updateTickDisplayEmptyState() {
        const { tickDisplay } = this.elements;
        
        // Only show empty state if no currencies are selected
        if (this.selectedCurrencies.size === 0) {
            tickDisplay.innerHTML = '<div class="empty-state"><div class="icon">📈</div><p>No currencies selected for monitoring</p></div>';
        } else if (tickDisplay.children.length === 0 || tickDisplay.querySelector('.empty-state')) {
            // Clear empty state when currencies are selected
            tickDisplay.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><p>Waiting for tick data...</p></div>';
        }
    }

    // Keep-alive ping
    startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.ws) {
                this.ws.send(JSON.stringify({ action: 'ping' }));
            }
        }, 30000); // Ping every 30 seconds
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing MT5 Tick Stream application...');
    app = new MT5TickStream();
    
    // Make app globally available for debugging
    window.app = app;
    console.log('✅ Application initialized and available as window.app');
});

// Add CSS animation for tick updates
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { background-color: #fff3cd; }
        100% { background-color: #f8f9fa; }
    }
`;
document.head.appendChild(style);
