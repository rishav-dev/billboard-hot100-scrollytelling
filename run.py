import http.server
import socketserver
import threading
import webbrowser
import os

PORT = 8000

# Serve files from the current directory (where this script is)
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler

def open_browser():
    url = f"http://localhost:{PORT}/index.html"
    webbrowser.open(url)
    print(f"Opened {url} in your browser")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}/index.html")
    # Open browser after a short delay so server is ready
    threading.Timer(1.0, open_browser).start()
    httpd.serve_forever()
