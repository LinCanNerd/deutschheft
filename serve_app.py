#!/usr/bin/env python3
"""Serve ./app on http://127.0.0.1:47613 for the Deutschheft launcher, then quit after a minute without requests.

The app caches itself with a service worker, so it also opens when this server isn't running. Serving it at launch
lets the first start work and lets a rebuilt app replace the cached copy. Keep the port fixed: the browser stores
your progress per address.

With --daemon the command returns as soon as the port is listening (or already served) and keeps serving in the
background, so a launcher can open the browser right after it.
"""
import functools
import http.server
import os
import pathlib
import sys
import threading
import time

PORT = 47613
APP = pathlib.Path(__file__).resolve().parent / "app"
IDLE_SECONDS = 60
last_request = time.time()


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        global last_request
        last_request = time.time()
        super().do_GET()


def detach():
    """Fork; the parent exits so the caller continues, the child keeps serving without a terminal."""
    if os.fork():
        os._exit(0)
    os.setsid()
    devnull = os.open(os.devnull, os.O_RDWR)
    for fd in (0, 1, 2):
        os.dup2(devnull, fd)


def main():
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=str(APP)))
    except OSError:
        return  # already running from an earlier launch
    if "--daemon" in sys.argv:
        detach()  # the socket is already listening, so the browser can connect immediately
    threading.Thread(target=server.serve_forever, daemon=True).start()
    while time.time() - last_request < IDLE_SECONDS:
        time.sleep(5)
    server.shutdown()


if __name__ == "__main__":
    main()
