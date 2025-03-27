import PyPDF2
import re
import logging
from typing import List, Dict, Any
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK resources if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
    """
    logger.info(f"Extracting text from PDF: {file_path}")
    
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)
            
            logger.info(f"PDF has {num_pages} pages")
            
            # Extract text from each page
            text = ""
            for page_num in range(num_pages):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            # Clean the extracted text
            cleaned_text = clean_text(text)
            
            logger.info(f"Successfully extracted {len(cleaned_text)} characters of text")
            return cleaned_text
            
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise

def clean_text(text: str) -> str:
    """
    Clean the extracted text by removing extra whitespace, fixing common OCR issues, etc.
    
    Args:
        text: Raw text extracted from PDF
        
    Returns:
        Cleaned text
    """
    # Replace multiple newlines with a single newline
    text = re.sub(r'\n+', '\n', text)
    
    # Replace multiple spaces with a single space
    text = re.sub(r' +', ' ', text)
    
    # Fix common OCR issues
    text = text.replace('•', '').replace('■', '').replace('□', '')
    
    # Remove non-printable characters
    text = ''.join(c for c in text if c.isprintable() or c == '\n')
    
    return text.strip()

def extract_key_concepts(text: str, num_concepts: int = 10) -> List[str]:
    """
    Extract key concepts from the text using simple frequency analysis.
    
    Args:
        text: Cleaned text from PDF
        num_concepts: Number of key concepts to extract
        
    Returns:
        List of key concepts
    """
    # Tokenize the text
    words = word_tokenize(text.lower())
    
    # Remove stopwords and punctuation
    stop_words = set(stopwords.words('english'))
    words = [word for word in words if word.isalnum() and word not in stop_words and len(word) > 3]
    
    # Count word frequencies
    word_freq = {}
    for word in words:
        if word in word_freq:
            word_freq[word] += 1
        else:
            word_freq[word] = 1
    
    # Sort by frequency and return top concepts
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    key_concepts = [word for word, freq in sorted_words[:num_concepts]]
    
    return key_concepts

def segment_text(text: str) -> List[Dict[str, Any]]:
    """
    Segment the text into logical sections for better question generation.
    
    Args:
        text: Cleaned text from PDF
        
    Returns:
        List of text segments with metadata
    """
    # Split text into paragraphs
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    # Process each paragraph
    segments = []
    for i, paragraph in enumerate(paragraphs):
        # Skip very short paragraphs (likely headers or noise)
        if len(paragraph) < 50:
            continue
            
        # Split paragraph into sentences
        sentences = sent_tokenize(paragraph)
        
        # Skip paragraphs with too few sentences
        if len(sentences) < 2:
            continue
            
        # Extract key concepts for this paragraph
        key_concepts = extract_key_concepts(paragraph, 5)
        
        segments.append({
            "id": i,
            "text": paragraph,
            "sentences": sentences,
            "key_concepts": key_concepts,
            "length": len(paragraph)
        })
    
    return segments 