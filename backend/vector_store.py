import os
import logging
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize the vector store with ChromaDB.
        
        Args:
            persist_directory: Directory to persist ChromaDB data
        """
        logger.info(f"Initializing ChromaDB with persistence at {persist_directory}")
        
        # Ensure the directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False
            )
        )
        
        # Initialize sentence transformer for embeddings
        self.sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Create default embedding function
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Initialize collections
        self._initialize_collections()
        
    def _initialize_collections(self):
        """Initialize the required collections in ChromaDB."""
        # Collection for document chunks
        self.document_collection = self.client.get_or_create_collection(
            name="document_chunks",
            embedding_function=self.embedding_function,
            metadata={"description": "Document chunks for semantic search"}
        )
        
        # Collection for questions
        self.question_collection = self.client.get_or_create_collection(
            name="questions",
            embedding_function=self.embedding_function,
            metadata={"description": "Generated questions for similarity matching"}
        )
        
        # Collection for user responses
        self.response_collection = self.client.get_or_create_collection(
            name="user_responses",
            embedding_function=self.embedding_function,
            metadata={"description": "User responses for analysis"}
        )
        
        logger.info("ChromaDB collections initialized")
    
    def add_document_chunks(self, 
                           document_id: str, 
                           chunks: List[str], 
                           metadata_list: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Add document chunks to the vector store.
        
        Args:
            document_id: Unique identifier for the document
            chunks: List of text chunks from the document
            metadata_list: Optional list of metadata for each chunk
            
        Returns:
            Success status
        """
        try:
            # Generate IDs for each chunk
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Use default metadata if none provided
            if metadata_list is None:
                metadata_list = [{"source": document_id, "chunk_index": i} for i in range(len(chunks))]
            
            # Add chunks to collection
            self.document_collection.add(
                ids=chunk_ids,
                documents=chunks,
                metadatas=metadata_list
            )
            
            logger.info(f"Added {len(chunks)} chunks from document {document_id} to vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document chunks to vector store: {str(e)}")
            return False
    
    def add_questions(self, 
                     quiz_id: str, 
                     questions: List[Dict[str, Any]]) -> bool:
        """
        Add generated questions to the vector store.
        
        Args:
            quiz_id: Unique identifier for the quiz
            questions: List of question dictionaries
            
        Returns:
            Success status
        """
        try:
            # Extract question text and metadata
            question_texts = []
            question_ids = []
            metadata_list = []
            
            for i, question in enumerate(questions):
                question_text = question.get("question", "")
                question_texts.append(question_text)
                question_ids.append(f"{quiz_id}_question_{i}")
                
                # Create metadata from question attributes
                metadata = {
                    "quiz_id": quiz_id,
                    "question_index": i,
                    "difficulty": question.get("difficulty", "medium"),
                    "type": question.get("type", "multiple-choice")
                }
                metadata_list.append(metadata)
            
            # Add questions to collection
            self.question_collection.add(
                ids=question_ids,
                documents=question_texts,
                metadatas=metadata_list
            )
            
            logger.info(f"Added {len(questions)} questions from quiz {quiz_id} to vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error adding questions to vector store: {str(e)}")
            return False
    
    def search_similar_content(self, 
                              query: str, 
                              n_results: int = 5, 
                              collection_name: str = "document_chunks") -> List[Dict[str, Any]]:
        """
        Search for content similar to the query.
        
        Args:
            query: Search query text
            n_results: Number of results to return
            collection_name: Name of collection to search
            
        Returns:
            List of similar content with metadata
        """
        try:
            # Get the appropriate collection
            collection = self.client.get_collection(
                name=collection_name,
                embedding_function=self.embedding_function
            )
            
            # Perform the search
            results = collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            # Format the results
            formatted_results = []
            if results and results['documents'] and len(results['documents']) > 0:
                documents = results['documents'][0]
                metadatas = results['metadatas'][0]
                distances = results['distances'][0]
                
                for i in range(len(documents)):
                    formatted_results.append({
                        "content": documents[i],
                        "metadata": metadatas[i],
                        "similarity": 1.0 - distances[i]  # Convert distance to similarity score
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []
    
    def get_similar_questions(self, question_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Find questions similar to the given question text.
        
        Args:
            question_text: The question text to find similar questions for
            n_results: Number of similar questions to return
            
        Returns:
            List of similar questions with metadata
        """
        return self.search_similar_content(
            query=question_text,
            n_results=n_results,
            collection_name="questions"
        )
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete all chunks associated with a document.
        
        Args:
            document_id: Unique identifier for the document
            
        Returns:
            Success status
        """
        try:
            # Delete by filtering on metadata
            self.document_collection.delete(
                where={"source": document_id}
            )
            
            logger.info(f"Deleted all chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document from vector store: {str(e)}")
            return False
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        try:
            embeddings = self.sentence_transformer.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            return [] 