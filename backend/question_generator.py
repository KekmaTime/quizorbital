import os
import logging
import json
import random
import re  # This import is missing but used in _parse_openai_response
from typing import List, Dict, Any, Union
from dotenv import load_dotenv
from openai import OpenAI
from nlp_processor import NLPProcessor
from adaptive_learning import AdaptiveLearning
import nltk

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Check if API key is available
if not client.api_key:
    logger.error("OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables.")

# Download required NLTK resources
try:
    logger.info("Checking and downloading required NLTK resources...")
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('maxent_ne_chunker', quiet=True)
    nltk.download('words', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    logger.error(f"Error downloading NLTK resources: {str(e)}")

class QuestionGenerator:
    def __init__(self):
        self.nlp_processor = NLPProcessor()
        self.adaptive_learning = AdaptiveLearning()
        self.question_types = {
            "multiple-choice": self._generate_multiple_choice,
            "true-false": self._generate_true_false,
            "descriptive": self._generate_descriptive,
            "fill-blank": self._generate_fill_blank,
        }

    def generate_questions(
        self, 
        text: str, 
        difficulty: str = "intermediate", 
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate questions from the provided text.
        
        Args:
            text: The text to generate questions from
            difficulty: The difficulty level (beginner, intermediate, advanced)
            num_questions: Number of questions to generate
            question_types: List of question types to include
            
        Returns:
            List of generated questions
        """
        logger.info(f"Generating {num_questions} questions at {difficulty} difficulty")

        # Process text with NLP pipeline
        processed_text = self.nlp_processor.process_text(text)

        # Determine question types to use
        if not question_types:
            question_types = list(self.question_types.keys())
        else:
            # Validate question types
            question_types = [qt for qt in question_types if qt in self.question_types]
            if not question_types:
                logger.warning("No valid question types provided. Using all types.")
                question_types = list(self.question_types.keys())

        # Distribute questions among types
        questions_per_type = self._distribute_questions(num_questions, question_types)

        # Generate questions
        all_questions = []
        for q_type, count in questions_per_type.items():
            if count > 0:
                questions = self.question_types[q_type](
                    processed_text, 
                    difficulty, 
                    count
                )
                all_questions.extend(questions)

        # Shuffle questions
        random.shuffle(all_questions)

        # Assign IDs
        for i, question in enumerate(all_questions):
            question["id"] = str(i + 1)

        return all_questions

    def _distribute_questions(self, num_questions: int, question_types: List[str]) -> Dict[str, int]:
        """Distribute questions among different types."""
        result = {qt: 0 for qt in self.question_types.keys()}

        # Ensure at least one question per selected type if possible
        min_per_type = min(1, num_questions // len(question_types))
        remaining = num_questions - (min_per_type * len(question_types))

        for qt in question_types:
            result[qt] = min_per_type

        # Distribute remaining questions
        while remaining > 0:
            for qt in question_types:
                if remaining > 0:
                    result[qt] += 1
                    remaining -= 1
                else:
                    break

        return result

    def _generate_multiple_choice(
        self, 
        processed_text: Dict[str, Any], 
        difficulty: str, 
        count: int
    ) -> List[Dict[str, Any]]:
        """Generate multiple-choice questions."""
        logger.info(f"Generating {count} multiple-choice questions")

        # Extract key information for the prompt
        key_terms = processed_text["key_terms"][:10]
        important_facts = processed_text["important_facts"][:5]

        # Create a context for the AI
        context = "\n".join([
            "Key terms: " + ", ".join(key_terms),
            "Important facts:",
            "\n".join([f"- {fact}" for fact in important_facts])
        ])

        # Create the prompt
        prompt = f"""
        Generate {count} multiple-choice questions based on the following content. 
        Each question should have 4 options with exactly one correct answer.
        
        Difficulty level: {difficulty}
        
        Content summary:
        {context}
        
        For each question, provide:
        1. The question text
        2. Four options (A, B, C, D)
        3. The correct answer
        4. A brief explanation of why the answer is correct
        
        Format your response as a JSON array with objects containing:
        {{
            "type": "multiple-choice",
            "text": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option text",
            "difficulty": "{difficulty}",
            "explanation": "Explanation of the correct answer"
        }}
        """

        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator specializing in creating high-quality quiz questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000)

            # Extract and parse the response
            content = response.choices[0].message.content
            questions = self._parse_openai_response(content, "multiple-choice")

            # Validate and clean up questions
            valid_questions = []
            for q in questions:
                if self._validate_multiple_choice(q):
                    valid_questions.append(q)

                    # Ensure we only return the requested number
                    if len(valid_questions) >= count:
                        break

            return valid_questions[:count]

        except Exception as e:
            logger.error(f"Error generating multiple-choice questions: {str(e)}")
            # Return a fallback question if API fails
            return [self._create_fallback_question("multiple-choice", difficulty) for _ in range(count)]

    def _generate_true_false(
        self, 
        processed_text: Dict[str, Any], 
        difficulty: str, 
        count: int
    ) -> List[Dict[str, Any]]:
        """Generate true/false questions."""
        logger.info(f"Generating {count} true-false questions")

        # Extract key information for the prompt
        important_facts = processed_text["important_facts"]
        
        # Define difficulty descriptions outside the f-string
        difficulty_descriptions = {
            "beginner": "basic understanding",
            "intermediate": "good understanding and some critical thinking",
            "advanced": "deep understanding and careful analysis"
        }
        difficulty_desc = difficulty_descriptions.get(difficulty, "good understanding")

        # Create the prompt
        prompt = f"""
        Generate {count} true/false questions based on the following content.
        
        Difficulty level: {difficulty}
        
        Content facts:
        {" ".join([f"- {fact}" for fact in important_facts])}
        
        For each question, provide:
        1. A statement that is either true or false
        2. Whether the statement is true or false
        3. A brief explanation
        
        Format your response as a JSON array with objects containing:
        {{
            "type": "true-false",
            "text": "Statement text",
            "correctAnswer": true or false,
            "difficulty": "{difficulty}",
            "explanation": "Explanation of why the statement is true or false"
        }}
        
        For {difficulty} difficulty, create statements that require {difficulty_desc} of the content.
        """

        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator specializing in creating high-quality quiz questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500)

            # Extract and parse the response
            content = response.choices[0].message.content
            questions = self._parse_openai_response(content, "true-false")

            # Validate and clean up questions
            valid_questions = []
            for q in questions:
                if self._validate_true_false(q):
                    valid_questions.append(q)

                    # Ensure we only return the requested number
                    if len(valid_questions) >= count:
                        break

            return valid_questions[:count]

        except Exception as e:
            logger.error(f"Error generating true-false questions: {str(e)}")
            # Return a fallback question if API fails
            return [self._create_fallback_question("true-false", difficulty) for _ in range(count)]

    def _generate_descriptive(self, processed_text, difficulty, count):
        """Generate descriptive questions."""
        try:
            # Similar implementation to your other question generation methods
            prompt = f"""
            Create {count} descriptive questions about the following text.
            Each question should be answerable with a short paragraph.
            Difficulty level: {difficulty}
            
            Text: {processed_text['summary']}
            
            Format each question as:
            {{
                "type": "descriptive",
                "text": "Question text here?",
                "correctAnswer": "Sample answer that would be considered correct",
                "difficulty": "{difficulty}",
                "explanation": "Explanation of the correct answer"
            }}
            """

            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator specializing in creating high-quality quiz questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000)

            # Extract and parse the response
            content = response.choices[0].message.content
            questions = self._parse_openai_response(content, "descriptive")

            # Validate and clean up questions
            valid_questions = []
            for q in questions:
                if self._validate_descriptive(q):
                    valid_questions.append(q)

                    # Ensure we only return the requested number
                    if len(valid_questions) >= count:
                        break

            return valid_questions[:count]

        except Exception as e:
            logger.error(f"Error generating descriptive questions: {str(e)}")
            # Return a fallback question if API fails
            return [self._create_fallback_question("descriptive", difficulty) for _ in range(count)]

    def _validate_descriptive(self, question):
        """Validate a descriptive question."""
        required_fields = ['text', 'correctAnswer', 'difficulty']
        return all(field in question for field in required_fields)

    def _parse_openai_response(self, response_text: str, expected_type: str) -> List[Dict[str, Any]]:
        """Parse the response from OpenAI into structured question objects."""
        try:
            # Extract JSON from the response (it might be wrapped in markdown code blocks)
            json_match = re.search(r'```(?:json)?(.*?)```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = response_text

            # Parse the JSON
            questions = json.loads(json_str)

            # Ensure it's a list
            if not isinstance(questions, list):
                questions = [questions]

            # Ensure each question has the expected type
            for q in questions:
                q["type"] = expected_type

            return questions

        except Exception as e:
            logger.error(f"Error parsing OpenAI response: {str(e)}")
            logger.debug(f"Response text: {response_text}")
            return []

    def _validate_multiple_choice(self, question: Dict[str, Any]) -> bool:
        """Validate a multiple-choice question."""
        required_fields = ["text", "options", "correctAnswer", "explanation"]

        # Check required fields
        for field in required_fields:
            if field not in question:
                return False

        # Check options
        if not isinstance(question["options"], list) or len(question["options"]) < 2:
            return False

        # Check correct answer is in options
        if question["correctAnswer"] not in question["options"]:
            return False

        return True

    def _validate_true_false(self, question: Dict[str, Any]) -> bool:
        """Validate a true/false question."""
        required_fields = ["text", "correctAnswer", "explanation"]

        # Check required fields
        for field in required_fields:
            if field not in question:
                return False

        # Check correct answer is boolean
        if not isinstance(question["correctAnswer"], bool):
            # Try to convert string "true"/"false" to boolean
            if isinstance(question["correctAnswer"], str):
                lower_answer = question["correctAnswer"].lower()
                if lower_answer == "true":
                    question["correctAnswer"] = True
                elif lower_answer == "false":
                    question["correctAnswer"] = False
                else:
                    return False
            else:
                return False

        return True

    def _create_fallback_question(self, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Create a fallback question when API calls fail."""
        if question_type == "multiple-choice":
            return {
                "type": "multiple-choice",
                "text": "What is the main topic of this document?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A",
                "difficulty": difficulty,
                "explanation": "This is a fallback question."
            }
        elif question_type == "true-false":
            return {
                "type": "true-false",
                "text": "This document contains important information.",
                "correctAnswer": True,
                "difficulty": difficulty,
                "explanation": "This is a fallback question."
            }
        elif question_type == "descriptive":
            return {
                "type": "descriptive",
                "text": "Describe the main concepts covered in this document.",
                "correctAnswer": "A comprehensive answer would cover the key points from the document.",
                "difficulty": difficulty,
                "explanation": "This is a general question about the document content."
            }
        elif question_type == "fill-blank":
            return {
                "type": "fill-blank",
                "text": "The main topic of this document is _____.",
                "correctAnswer": "the subject matter",
                "difficulty": difficulty,
                "explanation": "This is a fallback question."
            }
        # Add other question types as needed
        else:
            return {
                "type": question_type,
                "text": "Generic fallback question",
                "correctAnswer": "Generic answer",
                "difficulty": difficulty,
                "explanation": "This is a fallback question."
            }

    def generate_questions_from_query(
        self, 
        text: str,
        query: str,
        difficulty: str = "intermediate", 
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate questions relevant to a specific query using vector search.
        
        Args:
            text: The full text to generate questions from
            query: The query to focus questions on
            difficulty: The difficulty level (beginner, intermediate, advanced)
            num_questions: Number of questions to generate
            question_types: List of question types to include
            
        Returns:
            List of generated questions focused on the query topic
        """
        logger.info(f"Generating {num_questions} questions related to '{query}'")

        # First, store the document embeddings if not already done
        document_id = self.nlp_processor.store_document_embeddings(text)

        # Search for content relevant to the query
        relevant_content = self.nlp_processor.search_relevant_content(
            query=query,
            n_results=min(5, num_questions)
        )

        # Extract the text from the relevant content
        if relevant_content:
            # Create a focused text from the relevant chunks
            focused_text = "\n\n".join([result["content"] for result in relevant_content])

            # Generate questions from this focused text
            return self.generate_questions(
                focused_text,
                difficulty=difficulty,
                num_questions=num_questions,
                question_types=question_types
            )
        else:
            # Fallback to regular question generation if no relevant content found
            logger.warning(f"No content relevant to '{query}' found. Using full text.")
            return self.generate_questions(
                text,
                difficulty=difficulty,
                num_questions=num_questions,
                question_types=question_types
            )

    def generate_adaptive_questions(
        self,
        text: str,
        user_id: str,
        topic: str,
        current_performance: Dict[str, Any] = None,
        historical_performance: List[Dict[str, Any]] = None,
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate questions with adaptive difficulty based on user performance.
        
        Args:
            text: The text to generate questions from
            user_id: The user's unique identifier
            topic: The topic or subject area
            current_performance: Current quiz performance metrics
            historical_performance: List of previous performance records
            num_questions: Number of questions to generate
            question_types: List of question types to include
            
        Returns:
            List of generated questions with adaptive difficulty
        """
        logger.info(f"Generating adaptive questions for user {user_id} on topic {topic}")

        # Determine appropriate difficulty based on user performance
        if current_performance:
            difficulty = self.adaptive_learning.calculate_next_difficulty(
                user_id, topic, current_performance, historical_performance
            )
        else:
            # Default to intermediate for new users/topics
            difficulty = "intermediate"

        logger.info(f"Selected difficulty level: {difficulty}")

        # Generate questions at the determined difficulty level
        return self.generate_questions(
            text=text,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types
        )

    def _generate_fill_blank(self, processed_text: Dict[str, Any], difficulty: str, count: int) -> List[Dict[str, Any]]:
        """Generate fill-in-the-blank questions."""
        logger.info(f"Generating {count} fill-in-the-blank questions")

        # Extract key information for the prompt
        sentences = processed_text.get("sentences", [])
        key_terms = processed_text.get("key_terms", [])

        # Define difficulty descriptions outside the f-string
        difficulty_descriptions = {
            "beginner": "basic recall of facts",
            "intermediate": "understanding of concepts and relationships",
            "advanced": "application of complex concepts and critical thinking"
        }
        difficulty_desc = difficulty_descriptions.get(difficulty, "good understanding")

        # Create the prompt
        prompt = f"""
        Generate {count} fill-in-the-blank questions based on the following content.
        
        Difficulty level: {difficulty}
        
        Content:
        {processed_text.get('summary', '')}
        
        Key terms: {', '.join(key_terms[:10])}
        
        For each question, provide:
        1. A sentence with a blank where a key word or phrase should be
        2. The correct answer that goes in the blank
        3. A brief explanation
        
        Format your response as a JSON array with objects containing:
        {{
            "type": "fill-blank",
            "text": "Sentence with _____ for the blank",
            "correctAnswer": "word or phrase that goes in the blank",
            "difficulty": "{difficulty}",
            "explanation": "Explanation of why this is the correct answer"
        }}
        
        For {difficulty} difficulty, create questions that require {difficulty_desc} of the content.
        """

        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator specializing in creating high-quality quiz questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500)

            # Extract and parse the response
            content = response.choices[0].message.content
            questions = self._parse_openai_response(content, "fill-blank")

            # Validate and clean up questions
            valid_questions = []
            for q in questions:
                if self._validate_fill_blank(q):
                    valid_questions.append(q)

                    # Ensure we only return the requested number
                    if len(valid_questions) >= count:
                        break

            return valid_questions[:count]

        except Exception as e:
            logger.error(f"Error generating fill-blank questions: {str(e)}")
            # Return a fallback question if API fails
            return [self._create_fallback_question("fill-blank", difficulty) for _ in range(count)]

    def _validate_fill_blank(self, question: Dict[str, Any]) -> bool:
        """Validate a fill-in-the-blank question."""
        required_fields = ["text", "correctAnswer", "explanation"]

        # Check required fields
        for field in required_fields:
            if field not in question:
                return False

        # Check that the text contains a blank (represented by underscores)
        if not isinstance(question["text"], str) or "___" not in question["text"]:
            return False

        return True

    @staticmethod
    def process_questions(questions):
        """Process and standardize question fields."""
        processed_questions = []
        
        for question in questions:
            # Standardize field names
            if 'answer' in question and 'correctAnswer' not in question:
                question['correctAnswer'] = question.pop('answer')
                
            # Ensure required fields exist
            if 'text' not in question or ('correctAnswer' not in question and 'answer' not in question) or 'type' not in question:
                logger.warning(f"Skipping question with missing fields: {question}")
                continue
                
            processed_questions.append(question)
            
        return processed_questions

# Function to be called from app.py
def generate_questions(
    text: str, 
    difficulty: str = "intermediate", 
    num_questions: int = 5,
    question_types: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate questions from the provided text.
    
    Args:
        text: The text to generate questions from
        difficulty: The difficulty level (beginner, intermediate, advanced)
        num_questions: Number of questions to generate
        question_types: List of question types to include
        
    Returns:
        List of generated questions
    """
    generator = QuestionGenerator()
    return generator.generate_questions(text, difficulty, num_questions, question_types) 