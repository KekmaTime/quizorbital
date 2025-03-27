import os
import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get JWT secret key from environment
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
if JWT_SECRET_KEY == "dev-secret-key":
    logger.warning("Using default JWT secret key. This is insecure for production!")

# Token expiration time (in minutes)
TOKEN_EXPIRATION = int(os.getenv("TOKEN_EXPIRATION", "60"))

class Auth:
    @staticmethod
    def generate_password_hash(password):
        """Generate a password hash using werkzeug security."""
        return generate_password_hash(password)
    
    @staticmethod
    def check_password_hash(password_hash, password):
        """Check if the password matches the hash."""
        return check_password_hash(password_hash, password)
    
    @staticmethod
    def generate_token(user_id, role="user"):
        """Generate a JWT token for the user."""
        try:
            payload = {
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRATION),
                'iat': datetime.datetime.utcnow(),
                'sub': user_id,
                'role': role
            }
            return jwt.encode(
                payload,
                JWT_SECRET_KEY,
                algorithm='HS256'
            )
        except Exception as e:
            logger.error(f"Error generating token: {str(e)}")
            return None
    
    @staticmethod
    def decode_token(token):
        """Decode a JWT token and return the payload."""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return {'error': 'Token expired. Please log in again.'}
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token. Please log in again.'}
    
    @staticmethod
    def token_required(f):
        """Decorator to protect routes that require authentication."""
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # Check if token is in headers
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return jsonify({'error': 'Token is missing'}), 401
            
            # Decode token
            payload = Auth.decode_token(token)
            if 'error' in payload:
                return jsonify({'error': payload['error']}), 401
            
            # Add user_id to request
            request.user_id = payload['sub']
            request.user_role = payload.get('role', 'user')
            
            return f(*args, **kwargs)
        
        return decorated
    
    @staticmethod
    def admin_required(f):
        """Decorator to protect routes that require admin privileges."""
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # Check if token is in headers
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return jsonify({'error': 'Token is missing'}), 401
            
            # Decode token
            payload = Auth.decode_token(token)
            if 'error' in payload:
                return jsonify({'error': payload['error']}), 401
            
            # Check if user is admin
            if payload.get('role') != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
            
            # Add user_id to request
            request.user_id = payload['sub']
            request.user_role = payload['role']
            
            return f(*args, **kwargs)
        
        return decorated 