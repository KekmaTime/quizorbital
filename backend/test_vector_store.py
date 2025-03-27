import os
import logging
from vector_store import VectorStore
from nlp_processor import NLPProcessor
from pdf_processor import extract_text_from_pdf

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_vector_store():
    """Test the vector store functionality."""
    # Initialize vector store
    vector_store = VectorStore()
    
    # Test adding and retrieving document chunks
    test_chunks = [
        "ChromaDB is a database for storing and searching embeddings.",
        "Vector embeddings are useful for semantic search applications.",
        "QUIZORBIS uses embeddings to find similar content for quiz generation."
    ]
    
    test_metadata = [
        {"source": "test_doc", "topic": "databases"},
        {"source": "test_doc", "topic": "embeddings"},
        {"source": "test_doc", "topic": "applications"}
    ]
    
    # Add chunks
    success = vector_store.add_document_chunks(
        document_id="test_doc",
        chunks=test_chunks,
        metadata_list=test_metadata
    )
    
    print(f"Added test chunks: {success}")
    
    # Search for similar content
    results = vector_store.search_similar_content(
        query="semantic search with embeddings",
        n_results=2
    )
    
    print("\nSearch results:")
    for i, result in enumerate(results):
        print(f"{i+1}. Content: {result['content']}")
        print(f"   Similarity: {result['similarity']:.4f}")
        print(f"   Metadata: {result['metadata']}")
    
    # Test with NLP processor
    nlp_processor = NLPProcessor()
    
    # Generate embeddings
    sample_text = """
    ChromaDB is an open-source embedding database. It allows you to store 
    and query embeddings and their associated metadata. It's designed to be 
    fast, scalable, and easy to use. ChromaDB can be used for semantic search, 
    recommendation systems, and other applications that require similarity matching.
    """
    
    doc_id = nlp_processor.store_document_embeddings(sample_text)
    print(f"\nStored document with ID: {doc_id}")
    
    # Test searching with the NLP processor
    search_results = nlp_processor.search_relevant_content(
        query="What is ChromaDB used for?",
        n_results=2
    )
    
    print("\nNLP processor search results:")
    for i, result in enumerate(search_results):
        print(f"{i+1}. Content: {result['content']}")
        print(f"   Similarity: {result['similarity']:.4f}")
        print(f"   Metadata: {result['metadata']}")
    
    # Test with a PDF file if available
    pdf_path = "sample.pdf"
    if os.path.exists(pdf_path):
        print(f"\nTesting with PDF file: {pdf_path}")
        pdf_text = extract_text_from_pdf(pdf_path)
        pdf_doc_id = nlp_processor.store_document_embeddings(pdf_text, "sample_pdf")
        
        # Search for content in the PDF
        pdf_results = nlp_processor.search_relevant_content(
            query="main topic of the document",
            n_results=3
        )
        
        print("\nPDF search results:")
        for i, result in enumerate(pdf_results):
            print(f"{i+1}. Content: {result['content'][:100]}...")  # Show just the beginning
            print(f"   Similarity: {result['similarity']:.4f}")
            print(f"   Metadata: {result['metadata']}")
    
    return vector_store

if __name__ == "__main__":
    print("Testing ChromaDB vector store integration...")
    test_vector_store()
    print("\nTest completed!") 