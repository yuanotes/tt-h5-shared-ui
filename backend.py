"""Shared static UI assets for mini-dashboard HTML5 electronic prototypes.

This module lives in its own git repo (tt-h5-shared-ui) and is consumed as a
submodule by mini-dashboards. server.py auto-discovers this backend.py and
calls register() to serve /shared-ui/ static files.
"""
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent


def register(app):
    app.router.add_static("/shared-ui", MODULE_DIR, show_index=False)
