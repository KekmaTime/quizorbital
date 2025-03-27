import spacy
import re
import logging
from typing import List, Dict, Any, Tuple
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.tokenize import sent_tokenize
from vector_store import VectorStore
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    logger.info("Downloading spaCy model...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_md"])
    nlp = spacy.load("en_core_web_md")

class NLPProcessor:
    def __init__(self):
        self.nlp = nlp
        self.important_pos = ["NOUN", "PROPN", "VERB", "ADJ", "NUM"]
        self.vector_store = VectorStore()
        
    def process_text(self, text: str) -> Dict[str, Any]:
        """
        Process text through the NLP pipeline to extract key information.
        
        Args:
            text: Cleaned text from PDF
            
        Returns:
            Dictionary containing processed text information
        """
        logger.info("Processing text through NLP pipeline")
        
        # Process with spaCy
        doc = self.nlp(text)
        
        # Extract sentences
        sentences = [sent.text.strip() for sent in doc.sents]
        
        # Extract entities
        entities = self._extract_entities(doc)
        
        # Extract key terms using TF-IDF
        key_terms = self._extract_key_terms(text)
        
        # Extract important facts
        important_facts = self._extract_important_facts(doc, sentences)
        
        # Segment text into topics
        topics = self._segment_into_topics(text, sentences)
        
        return {
            "sentences": sentences,
            "entities": entities,
            "key_terms": key_terms,
            "important_facts": important_facts,
            "topics": topics,
            "word_count": len(doc),
            "sentence_count": len(sentences)
        }
    
    def _extract_entities(self, doc) -> Dict[str, List[str]]:
        """Extract named entities from the document."""
        entities = {}
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            if ent.text not in entities[ent.label_]:
                entities[ent.label_].append(ent.text)
        
        return entities
    
    def _extract_key_terms(self, text: str, top_n: int = 20) -> List[str]:
        """Extract key terms using TF-IDF."""
        # Split text into paragraphs
        paragraphs = [p for p in text.split('\n\n') if p.strip()]
        
        if len(paragraphs) < 3:
            # If not enough paragraphs, split by newlines
            paragraphs = [p for p in text.split('\n') if p.strip()]
            
        if len(paragraphs) < 3:
            # If still not enough, use sentence tokenization
            paragraphs = sent_tokenize(text)
            
        # Apply TF-IDF
        vectorizer = TfidfVectorizer(
            max_df=0.9, 
            min_df=2, 
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        try:
            tfidf_matrix = vectorizer.fit_transform(paragraphs)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get average TF-IDF score for each term
            tfidf_scores = np.mean(tfidf_matrix.toarray(), axis=0)
            
            # Sort terms by score
            sorted_indices = np.argsort(tfidf_scores)[::-1]
            top_terms = [feature_names[i] for i in sorted_indices[:top_n]]
            
            return top_terms
        except ValueError as e:
            logger.warning(f"TF-IDF extraction failed: {e}. Using fallback method.")
            # Fallback to simple frequency analysis
            doc = self.nlp(text)
            words = [token.text.lower() for token in doc if not token.is_stop and not token.is_punct and token.pos_ in self.important_pos]
            return [word for word, _ in Counter(words).most_common(top_n)]
    
    def _extract_important_facts(self, doc, sentences: List[str], top_n: int = 15) -> List[str]:
        """Extract sentences that likely contain important facts."""
        # Calculate sentence importance based on entities, key terms, and sentence position
        sentence_scores = []
        
        for i, sent in enumerate(doc.sents):
            score = 0
            
            # Sentences at the beginning or end of paragraphs are often important
            if i == 0 or i == len(list(doc.sents)) - 1:
                score += 2
                
            # Sentences with entities are important
            if len(sent.ents) > 0:
                score += len(sent.ents)
                
            # Sentences with important POS tags
            important_tokens = [token for token in sent if token.pos_ in self.important_pos]
            score += len(important_tokens) * 0.5
            
            # Sentences with certain trigger phrases
            trigger_phrases = ["important", "significant", "key", "main", "crucial", "essential", "fundamental"]
            for phrase in trigger_phrases:
                if phrase in sent.text.lower():
                    score += 3
                    break
                    
            # Sentences with numbers often contain facts
            if any(token.like_num for token in sent):
                score += 1
                
            # Normalize by sentence length (favor concise sentences)
            if len(sent) > 0:
                score = score / (len(sent) ** 0.5)
                
            sentence_scores.append((sent.text.strip(), score))
            
        # Sort by score and get top sentences
        important_sentences = [sent for sent, score in sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:top_n]]
        
        return important_sentences
    
    def _segment_into_topics(self, text: str, sentences: List[str]) -> List[Dict[str, Any]]:
        """Segment text into topics based on semantic similarity."""
        # If text is short, treat as a single topic
        if len(sentences) < 10:
            return [{
                "title": "Main Topic",
                "sentences": sentences,
                "key_terms": self._extract_key_terms(text, 5)
            }]
            
        # For longer texts, attempt to identify topic boundaries
        topic_boundaries = self._identify_topic_boundaries(sentences)
        
        topics = []
        current_topic_sentences = []
        current_topic_text = ""
        
        for i, sentence in enumerate(sentences):
            current_topic_sentences.append(sentence)
            current_topic_text += " " + sentence
            
            # If we hit a topic boundary or the end, create a new topic
            if i in topic_boundaries or i == len(sentences) - 1:
                if current_topic_text.strip():
                    # Generate a title for the topic
                    title = self._generate_topic_title(current_topic_text)
                    
                    topics.append({
                        "title": title,
                        "sentences": current_topic_sentences,
                        "key_terms": self._extract_key_terms(current_topic_text, 5)
                    })
                    
                    # Reset for next topic
                    current_topic_sentences = []
                    current_topic_text = ""
        
        return topics
    
    def _identify_topic_boundaries(self, sentences: List[str]) -> List[int]:
        """Identify likely topic boundaries based on semantic shifts."""
        if len(sentences) < 5:
            return []
            
        # Convert sentences to embeddings
        embeddings = [self.nlp(sent).vector for sent in sentences]
        
        # Calculate cosine similarity between adjacent sentences
        similarities = []
        for i in range(len(embeddings) - 1):
            similarity = self._cosine_similarity(embeddings[i], embeddings[i + 1])
            similarities.append(similarity)
            
        # Find points where similarity drops significantly
        mean_similarity = np.mean(similarities)
        std_similarity = np.std(similarities)
        threshold = mean_similarity - (1.5 * std_similarity)
        
        boundaries = []
        for i, similarity in enumerate(similarities):
            if similarity < threshold:
                boundaries.append(i)
                
        # Limit the number of boundaries to avoid over-segmentation
        max_topics = min(5, len(sentences) // 5)
        if len(boundaries) > max_topics:
            # Sort by similarity (lowest first) and take the top N
            sorted_boundaries = sorted([(i, similarities[i]) for i in boundaries], key=lambda x: x[1])
            boundaries = [i for i, _ in sorted_boundaries[:max_topics]]
            boundaries.sort()  # Sort back into sequential order
            
        return boundaries
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        if np.all(vec1 == 0) or np.all(vec2 == 0):
            return 0.0
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    def _generate_topic_title(self, text: str) -> str:
        """Generate a title for a topic based on its content."""
        doc = self.nlp(text)
        
        # Extract noun chunks and entities as potential title components
        title_candidates = []
        
        # Add entities
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PERSON", "GPE", "LOC", "PRODUCT", "EVENT", "WORK_OF_ART"]:
                title_candidates.append(ent.text)
                
        # Add noun chunks
        for chunk in doc.noun_chunks:
            if len(chunk) < 5:  # Keep chunks reasonably short
                title_candidates.append(chunk.text)
                
        # If we have candidates, use the most frequent one
        if title_candidates:
            counter = Counter(title_candidates)
            most_common = counter.most_common(1)[0][0]
            return most_common.title()
            
        # Fallback: use the most important words
        important_words = [token.text for token in doc if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop]
        if important_words:
            counter = Counter(important_words)
            top_words = [word for word, _ in counter.most_common(2)]
            return " ".join(top_words).title()
            
        # Last resort
        return "Topic " + text.split()[0] if text.split() else "Unnamed Topic"
    
    def store_document_embeddings(self, text: str, document_id: str = None) -> str:
        """
        Process text and store embeddings in ChromaDB.
        
        Args:
            text: Text content to process and store
            document_id: Optional document ID, generated if not provided
            
        Returns:
            Document ID
        """
        if document_id is None:
            document_id = str(uuid.uuid4())
        
        logger.info(f"Storing document embeddings for document {document_id}")
        
        # Process the text
        processed_data = self.process_text(text)
        
        # Split text into chunks for embedding storage
        # We'll use sentences grouped into chunks of ~512 tokens
        sentences = processed_data["sentences"]
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            # Rough token count estimation
            sentence_length = len(sentence.split())
            
            if current_length + sentence_length > 512:
                # Store the current chunk and start a new one
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_length = sentence_length
            else:
                current_chunk.append(sentence)
                current_length += sentence_length
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        # Create metadata for each chunk
        metadata_list = []
        for i, chunk in enumerate(chunks):
            # Extract entities in this chunk
            chunk_doc = self.nlp(chunk)
            chunk_entities = [ent.text for ent in chunk_doc.ents]
            
            # Add metadata
            metadata = {
                "source": document_id,
                "chunk_index": i,
                "entities": chunk_entities[:10],  # Limit to 10 entities
                "word_count": len(chunk.split()),
                "topic": processed_data["topics"][i % len(processed_data["topics"])] if processed_data["topics"] else "general"
            }
            metadata_list.append(metadata)
        
        # Store in vector database
        success = self.vector_store.add_document_chunks(
            document_id=document_id,
            chunks=chunks,
            metadata_list=metadata_list
        )
        
        if success:
            logger.info(f"Successfully stored embeddings for document {document_id}")
        else:
            logger.error(f"Failed to store embeddings for document {document_id}")
        
        return document_id
    
    def search_relevant_content(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for content relevant to the query.
        
        Args:
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant content with metadata
        """
        return self.vector_store.search_similar_content(query, n_results) 