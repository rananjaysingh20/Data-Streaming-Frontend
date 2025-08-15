#!/usr/bin/env python3
"""
Simple HTTP server for serving the MT5 Tick Stream frontend
This avoids CORS issues when accessing the backend from file:// protocol
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def main():
    # Change to the directory containing this script
    os.chdir(Path(__file__).parent)
    
    PORT = 3000
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Add CORS headers to responses
    class CORSRequestHandler(Handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            super().end_headers()
    
    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            print(f"🚀 Starting frontend server...")
            print(f"📡 Server running at: http://localhost:{PORT}")
            print(f"🌐 Opening browser automatically...")
            print(f"📋 Make sure your backend is running at: http://127.0.0.1:8000")
            print(f"⏹️  Press Ctrl+C to stop the server")
            print()
            
            # Open browser automatically
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use. Try a different port or stop the other server.")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
