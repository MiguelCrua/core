"""Local CORE preview with persistent lead capture and gated PDF delivery.
Not a production deployment server. Static-only hosting cannot run this endpoint.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone
import argparse
import json
import os
import re
from urllib.request import Request, urlopen
from urllib.error import URLError

ROOT = Path(__file__).resolve().parent
PDF = ROOT / 'private' / 'Core - Workbook.pdf'
WEBHOOK = os.environ.get('CORE_SHEETS_WEBHOOK', '')
SECRET = os.environ.get('CORE_SHEETS_SECRET', '')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'dist'), **kwargs)

    def error_json(self, status, message):
        data = json.dumps({'error': message}).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/api/workbook':
            return self.error_json(404, 'Pedido não encontrado.')
        if self.headers.get('Origin') != 'http://' + self.headers.get('Host', ''):
            return self.error_json(403, 'Pedido não autorizado.')
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                return self.error_json(400, 'Verifica os dados introduzidos.')
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                return self.error_json(400, 'Verifica os dados introduzidos.')
            name = str(payload.get('name', '')).strip()
            email = str(payload.get('email', '')).strip().lower()
            if not 1 < len(name) <= 120 or len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
                return self.error_json(400, 'Preenche o nome e um email válido.')
            if not PDF.is_file():
                return self.error_json(503, 'O Workbook está temporariamente indisponível.')
            if not WEBHOOK or not SECRET:
                return self.error_json(503, 'O download estará disponível em breve. A ligação ao formulário está a ser preparada.')
            lead = json.dumps({'name': name, 'email': email,
                               'created_at': datetime.now(timezone.utc).isoformat(),
                               'source': 'core-workbook', 'secret': SECRET}).encode()
            request = Request(WEBHOOK, data=lead, headers={'Content-Type': 'application/json'})
            with urlopen(request, timeout=20) as result:
                saved = json.loads(result.read(4096))
            if saved.get('ok') is not True:
                return self.error_json(503, 'Não foi possível guardar o pedido. Tenta novamente.')
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', 'attachment; filename="Core - Workbook.pdf"')
            self.send_header('Content-Length', str(PDF.stat().st_size))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            with PDF.open('rb') as stream:
                while chunk := stream.read(65536):
                    self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            return  # The browser cancelled an in-progress download.
        except (ValueError, TypeError, json.JSONDecodeError):
            self.error_json(400, 'Verifica os dados introduzidos.')
        except (OSError, URLError):
            self.error_json(503, 'Não foi possível guardar o pedido. Tenta novamente.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4174)
    args = parser.parse_args()
    print(f'CORE preview: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
