from app import app
import uvicorn.middleware.wsgi

# This file serves as the ASGI entry point for gunicorn with uvicorn workers
# It imports the Connexion app from app.py and wraps it with WSGIMiddleware
# to adapt the WSGI application to the ASGI interface

# Wrap the WSGI app with WSGIMiddleware to make it compatible with ASGI
application = uvicorn.middleware.wsgi.WSGIMiddleware(app)
