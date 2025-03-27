import os
import logging
from flask import Flask
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create database tables if they don't exist."""
    # Force reload of environment variables
    load_dotenv(override=True)
    
    # Get database connection string directly
    DATABASE_URL = os.getenv("DATABASE_URL")
    logger.info(f"Using DATABASE_URL: {DATABASE_URL[:30]}...")
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        raise ValueError("DATABASE_URL environment variable is required")
    
    try:
        # Connect directly without using Flask's g object
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        logger.info("Connected to NeonDB PostgreSQL database")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(200) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """)
        
        # Create documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                filename VARCHAR(200) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                content TEXT,
                user_id VARCHAR(36) NOT NULL,
                tags VARCHAR(200),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create quizzes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
                user_id VARCHAR(36) NOT NULL,
                file_id VARCHAR(36),
                topic VARCHAR(100),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (file_id) REFERENCES documents(id)
            )
        """)
        
        # Create questions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id VARCHAR(36) PRIMARY KEY,
                quiz_id VARCHAR(36) NOT NULL,
                question_type VARCHAR(50) NOT NULL,
                question_text TEXT NOT NULL,
                options JSONB,
                correct_answer JSONB NOT NULL,
                difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
                explanation TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
            )
        """)
        
        # Create quiz_results table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_results (
                id VARCHAR(36) PRIMARY KEY,
                quiz_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                score FLOAT NOT NULL,
                completion_time FLOAT NOT NULL,
                average_time FLOAT NOT NULL,
                correct_count INTEGER NOT NULL,
                question_count INTEGER NOT NULL,
                details JSONB,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create voice_responses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voice_responses (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                question_id VARCHAR(36) NOT NULL,
                voice_text TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL,
                confidence FLOAT NOT NULL,
                matched_answer JSONB,
                explanation TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (question_id) REFERENCES questions(id)
            )
        """)
        
        # Create question_results table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_results (
                id VARCHAR(36) PRIMARY KEY,
                quiz_result_id VARCHAR(36) NOT NULL,
                question_id VARCHAR(36) NOT NULL,
                user_answer JSONB,
                is_correct BOOLEAN NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id),
                FOREIGN KEY (question_id) REFERENCES questions(id)
            )
        """)
        
        conn.commit()
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    create_tables() 