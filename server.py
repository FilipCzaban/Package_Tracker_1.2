import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 80

class TrackerHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        # Pokud požadavek míří na naše lokální API pro 17TRACK
        if self.path.startswith('/api/17track'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Zjistíme, jestli voláme /register nebo /gettrackinfo
            endpoint = self.path.replace('/api/17track', '')
            target_url = "https://api.17track.net/track/v2.2" + endpoint
            
            # Přepošleme požadavek přímo do cloudu 17TRACKu
            req = urllib.request.Request(target_url, data=post_data, headers={
                '17token': '2F67B64127F5DF46107DC83162CE3757',
                'Content-Type': 'application/json'
            })
            
            try:
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.status)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(response.read())
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(e.read())
        else:
            super().do_POST()

with socketserver.TCPServer(("", PORT), TrackerHandler) as httpd:
    print(f"Server běží na portu {PORT}. Připraveno pro 17TRACK API proxy.")
    httpd.serve_forever()
