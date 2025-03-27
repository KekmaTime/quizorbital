import os
import logging
import argparse
from embedding_generator import EmbeddingGenerator
from db import get_db, init_db
from models import Document
from flask import Flask
from tqdm import tqdm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_embeddings_for_all_documents(app):
    """Generate embeddings for all documents in the database."""
    with app.app_context():
        # Initialize database
        init_db()
        
        # Get all documents
        documents = Document.query.all()
        logger.info(f"Found {len(documents)} documents in the database")
        
        # Initialize embedding generator
        embedding_generator = EmbeddingGenerator()
        
        # Process each document
        success_count = 0
        for doc in tqdm(documents, desc="Generating embeddings"):
            # Create metadata for the document
            document_metadata = {
                "title": doc.title,
                "description": doc.description,
                "tags": doc.tags.split(',') if doc.tags else [],
                "user_id": doc.user_id,
                "file_type": "pdf",
                "word_count": len(doc.content.split()) if doc.content else 0
            }
            
            # Skip documents with no content
            if not doc.content or len(doc.content) < 100:
                logger.warning(f"Skipping document {doc.id} due to insufficient content")
                continue
            
            # Store embeddings
            success = embedding_generator.store_document_embeddings(
                document_id=str(doc.id),
                text=doc.content,
                metadata=document_metadata,
                strategy="hybrid"
            )
            
            if success:
                success_count += 1
            else:
                logger.error(f"Failed to store embeddings for document {doc.id}")
        
        logger.info(f"Successfully generated embeddings for {success_count}/{len(documents)} documents")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate embeddings for documents")
    parser.add_argument("--strategy", type=str, default="hybrid", 
                        choices=["sentence", "chunk", "paragraph", "hybrid"],
                        help="Embedding strategy to use")
    args = parser.parse_args()
    
    # Create a Flask app context
    app = Flask(__name__)
    app.config.from_pyfile('config.py', silent=True)
    
    logger.info(f"Generating embeddings using {args.strategy} strategy")
    generate_embeddings_for_all_documents(app)
    logger.info("Embedding generation complete") 