import logging
import numpy as np
from typing import List, Dict, Any, Union, Optional
from sentence_transformers import SentenceTransformer
import torch
import os
import json
from tqdm import tqdm
import time
from nltk.tokenize import sent_tokenize
import spacy
from vector_store import VectorStore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """
    Generates and manages embeddings for uploaded content.
    Supports multiple embedding models and strategies.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", cache_dir: str = "./embeddings_cache"):
        """
        Initialize the embedding generator.
        
        Args:
            model_name: Name of the sentence-transformers model to use
            cache_dir: Directory to cache embeddings
        """
        self.model_name = model_name
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
        # Load the embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        # Initialize vector store
        self.vector_store = VectorStore()
        
        # Try to load spaCy for advanced text processing
        try:
            self.nlp = spacy.load("en_core_web_sm")
            self.use_spacy = True
        except:
            logger.warning("SpaCy model not available. Using basic text processing.")
            self.use_spacy = False
        
        logger.info("Embedding generator initialized")
    
    def generate_embeddings(self, 
                           text: str, 
                           strategy: str = "sentence", 
                           chunk_size: int = 512,
                           overlap: int = 50) -> Dict[str, Any]:
        """
        Generate embeddings for text using the specified strategy.
        
        Args:
            text: Text to generate embeddings for
            strategy: Embedding strategy ('sentence', 'chunk', 'paragraph', 'hybrid')
            chunk_size: Maximum chunk size in tokens (for 'chunk' strategy)
            overlap: Overlap between chunks in tokens
            
        Returns:
            Dictionary with generated embeddings and metadata
        """
        logger.info(f"Generating embeddings using {strategy} strategy")
        
        # Generate a unique ID for this text based on content hash
        text_id = str(hash(text))[:10]
        
        # Check if we have cached embeddings
        cache_path = os.path.join(self.cache_dir, f"{text_id}_{strategy}.json")
        if os.path.exists(cache_path):
            logger.info(f"Loading cached embeddings from {cache_path}")
            with open(cache_path, 'r') as f:
                return json.load(f)
        
        # Process text based on strategy
        if strategy == "sentence":
            segments = self._segment_by_sentences(text)
        elif strategy == "chunk":
            segments = self._segment_by_chunks(text, chunk_size, overlap)
        elif strategy == "paragraph":
            segments = self._segment_by_paragraphs(text)
        elif strategy == "hybrid":
            segments = self._segment_hybrid(text, chunk_size)
        else:
            logger.warning(f"Unknown strategy: {strategy}. Using 'sentence' strategy.")
            segments = self._segment_by_sentences(text)
        
        # Generate embeddings for segments
        embeddings = self._batch_encode(segments)
        
        # Create result dictionary
        result = {
            "text_id": text_id,
            "strategy": strategy,
            "model": self.model_name,
            "segment_count": len(segments),
            "segments": segments,
            "embeddings": embeddings.tolist() if isinstance(embeddings, np.ndarray) else embeddings,
            "timestamp": time.time()
        }
        
        # Cache the results
        with open(cache_path, 'w') as f:
            json.dump(result, f)
        
        logger.info(f"Generated {len(segments)} embeddings for text")
        return result
    
    def store_document_embeddings(self, 
                                 document_id: str, 
                                 text: str,
                                 metadata: Dict[str, Any] = None,
                                 strategy: str = "hybrid") -> bool:
        """
        Generate and store embeddings for a document in the vector store.
        
        Args:
            document_id: Unique identifier for the document
            text: Document text
            metadata: Additional metadata for the document
            strategy: Embedding strategy to use
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Storing embeddings for document {document_id}")
            
            # Generate embeddings
            embedding_result = self.generate_embeddings(text, strategy=strategy)
            segments = embedding_result["segments"]
            
            # Prepare metadata for each segment
            metadata_list = []
            for i, segment in enumerate(segments):
                segment_metadata = {
                    "source": document_id,
                    "segment_index": i,
                    "segment_count": len(segments),
                    "strategy": strategy
                }
                
                # Add document metadata if provided
                if metadata:
                    for key, value in metadata.items():
                        # Convert lists to strings for ChromaDB compatibility
                        if isinstance(value, list):
                            segment_metadata[key] = ','.join(map(str, value))
                        else:
                            segment_metadata[key] = value
                
                # Add entities if using spaCy
                if self.use_spacy and len(segment) < 1000000:  # Avoid processing very large segments
                    doc = self.nlp(segment)
                    entities = [ent.text for ent in doc.ents]
                    segment_metadata["entities"] = ','.join(entities[:10])  # Convert list to string
                
                metadata_list.append(segment_metadata)
            
            # Store in vector database
            success = self.vector_store.add_document_chunks(
                document_id=document_id,
                chunks=segments,
                metadata_list=metadata_list
            )
            
            if success:
                logger.info(f"Successfully stored embeddings for document {document_id}")
            else:
                logger.error(f"Failed to store embeddings for document {document_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error storing document embeddings: {str(e)}")
            return False
    
    def _segment_by_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        sentences = sent_tokenize(text)
        return sentences
    
    def _segment_by_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs."""
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        return paragraphs
    
    def _segment_by_chunks(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Split text into overlapping chunks of approximately equal size."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def _segment_hybrid(self, text: str, max_chunk_size: int) -> List[str]:
        """
        Hybrid segmentation that respects paragraph boundaries but ensures
        chunks don't exceed max_chunk_size.
        """
        paragraphs = self._segment_by_paragraphs(text)
        chunks = []
        
        current_chunk = []
        current_size = 0
        
        for para in paragraphs:
            para_size = len(para.split())
            
            if para_size > max_chunk_size:
                # If paragraph is too large, split it into smaller chunks
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                para_chunks = self._segment_by_chunks(para, max_chunk_size, 0)
                chunks.extend(para_chunks)
            elif current_size + para_size > max_chunk_size:
                # If adding this paragraph would exceed max size, start a new chunk
                chunks.append(' '.join(current_chunk))
                current_chunk = [para]
                current_size = para_size
            else:
                # Add paragraph to current chunk
                current_chunk.append(para)
                current_size += para_size
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _batch_encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode texts in batches to avoid memory issues with large documents.
        
        Args:
            texts: List of text segments to encode
            batch_size: Batch size for encoding
            
        Returns:
            Array of embeddings
        """
        if not texts:
            return np.array([])
        
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            with torch.no_grad():
                embeddings = self.model.encode(batch)
            all_embeddings.append(embeddings)
        
        return np.vstack(all_embeddings) 