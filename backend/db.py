import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import g, current_app
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db():
    """Connect to the NeonDB PostgreSQL database and return a connection."""
    if 'db' not in g:
        try:
            # Force reload of environment variables
            load_dotenv(override=True)
            
            # Get database connection string from environment
            DATABASE_URL = os.getenv("DATABASE_URL")
            logger.info(f"Using DATABASE_URL: {DATABASE_URL[:30]}...")
            
            g.db = psycopg2.connect(DATABASE_URL)
            g.db.autocommit = False
            g.cursor = g.db.cursor(cursor_factory=RealDictCursor)
            logger.info("Connected to NeonDB PostgreSQL database")
        except Exception as e:
            logger.error(f"Error connecting to database: {str(e)}")
            raise
    return g.db, g.cursor

def close_db(e=None):
    """Close the database connection."""
    cursor = g.pop('cursor', None)
    if cursor is not None:
        cursor.close()
        
    db = g.pop('db', None)
    if db is not None:
        db.close()
        logger.info("Database connection closed")

# def init_db():
#     """Initialize the database with schema."""
#     logger.info("Initializing NeonDB PostgreSQL database...")
#     
#     try:
#         db, cursor = get_db()
#         
#         # Create tables
#         with current_app.open_resource('schema.sql') as f:
#             cursor.execute(f.read().decode('utf8'))
#         
#         db.commit()
#         logger.info("Database initialized successfully")
#     except Exception as e:
#         logger.error(f"Error initializing database: {str(e)}")
#         db.rollback()
#         raise

def init_app(app):
    """Register database functions with the Flask app."""
    app.teardown_appcontext(close_db) 