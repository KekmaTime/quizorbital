from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import logging
import uuid
import json
from flask_jwt_extended import jwt_required, get_jwt_identity, JWTManager
from datetime import datetime, timedelta

# Import our custom modules
from pdf_processor import extract_text_from_pdf
from question_generator import generate_questions, QuestionGenerator
from auth import Auth
from db import get_db, close_db, init_app
from models import Document, Quiz, Question, QuizResult, VoiceResponse
from proficiency_model import ProficiencyPredictor
from adaptive_learning import AdaptiveLearning
from embedding_generator import EmbeddingGenerator
from voice_processor import VoiceProcessor
from cold_start import ColdStartSolver
from recommendation_system import RecommendationSystem

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Update CORS configuration to properly handle preflight requests
CORS(app, 
     resources={r"/api/*": {"origins": ["http://localhost:8080", "http://127.0.0.1:8080"]}},
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"])

# For production, you would want to restrict origins:
# frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5000')
# CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024  # 25MB max upload size

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize database
# with app.app_context():
#     init_db()

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=int(os.getenv("TOKEN_EXPIRATION", "60")))
jwt = JWTManager(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "QUIZORBIS API is running"}), 200

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['email', 'password', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        # Get database connection and cursor
        db_conn, cursor = get_db()
        
        # Check if user already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s", 
            (data['email'],)
        )
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({"error": "User already exists"}), 409
        
        # Generate password hash
        password_hash = Auth.generate_password_hash(data['password'])
        
        # Insert new user
        user_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (%s, %s, %s, %s, %s, NOW())",
            (user_id, data['email'], password_hash, data['name'], 'user')
        )
        db_conn.commit()
        
        # Generate token
        token = Auth.generate_token(user_id)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "email": data['email'],
                "name": data['name']
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return jsonify({"error": f"Error registering user: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        # Get database connection and cursor
        db_conn, cursor = get_db()
        
        # Get user by email
        cursor.execute(
            "SELECT id, email, password_hash, name, role FROM users WHERE email = %s", 
            (data['email'],)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Check password
        if not Auth.check_password_hash(user['password_hash'], data['password']):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Generate token
        token = Auth.generate_token(user['id'], user['role'])
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error logging in: {str(e)}")
        return jsonify({"error": f"Error logging in: {str(e)}"}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        # Get database connection and cursor
        db_conn, cursor = get_db()
        
        # Get user by id
        cursor.execute(
            "SELECT id, email, name, role, created_at FROM users WHERE id = %s", 
            (get_jwt_identity(),)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "role": user['role'],
                "created_at": user['created_at']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        return jsonify({"error": f"Error getting user: {str(e)}"}), 500

# Protected routes
@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload and process a PDF file."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Secure the filename
            filename = secure_filename(file.filename)
            
            # Create a unique filename with UUID
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save the file
            file.save(filepath)
            
            # Extract text from PDF
            text = extract_text_from_pdf(filepath)
            
            if not text or len(text) < 100:
                return jsonify({'error': 'Could not extract sufficient text from the PDF'}), 400
                
            # Get additional metadata from request
            title = request.form.get('title', filename)
            description = request.form.get('description', '')
            tags = request.form.get('tags', '')
            
            # Store document in database using raw SQL
            db_conn, cursor = get_db()
            
            # Create document record
            document_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO documents (id, title, description, filename, file_path, content, user_id, tags, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())",
                (document_id, title, description, unique_filename, filepath, text, current_user, tags)
            )
            db_conn.commit()
            
            # Generate embeddings for the document
            embedding_generator = EmbeddingGenerator()
            
            # Create metadata for the document
            document_metadata = {
                "title": title,
                "description": description,
                "tags": ','.join(tags.split(',')) if tags else "",
                "user_id": current_user,
                "file_type": "pdf",
                "word_count": len(text.split())
            }
            
            # Store embeddings asynchronously
            # In a production environment, this would be a background task
            success = embedding_generator.store_document_embeddings(
                document_id=document_id,
                text=text,
                metadata=document_metadata,
                strategy="hybrid"
            )
            
            if not success:
                logger.warning(f"Failed to store embeddings for document {document_id}")
            
            return jsonify({
                'message': 'File uploaded successfully',
                'document_id': document_id,
                'title': title,
                'word_count': len(text.split()),
                'embeddings_stored': success
            }), 201
            
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/generate', methods=['POST'])
@jwt_required()
def generate_quiz():
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Updated required fields to match frontend
    required_fields = ['document_id', 'difficulty', 'num_questions']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        # Get document info from database using document_id
        db_conn, cursor = get_db()
        cursor.execute(
            "SELECT id, file_path, content FROM documents WHERE id = %s", 
            (data['document_id'],)
        )
        document_info = cursor.fetchone()
        
        if not document_info:
            return jsonify({"error": "Document not found"}), 404
        
        # Extract text from the PDF
        extracted_text = document_info['content']  # Use the content directly from DB
        
        if not extracted_text or len(extracted_text) < 100:
            logger.warning(f"Insufficient text content for document {data['document_id']}")
            return jsonify({"error": "Insufficient text content in document"}), 400
        
        try:
            # Generate questions based on the extracted text
            question_generator = QuestionGenerator()
            questions = question_generator.generate_questions(
                text=extracted_text,
                num_questions=data['num_questions'],
                difficulty=data['difficulty'],
                question_types=data.get('question_types', ['multiple-choice', 'true-false', 'fill-blank'])
            )
            
            # Process and standardize questions
            questions = QuestionGenerator.process_questions(questions)
            
            if not questions or len(questions) == 0:
                logger.warning("No questions were generated")
                return jsonify({"error": "Failed to generate questions"}), 500
                
        except Exception as qe:
            logger.error(f"Error in question generation: {str(qe)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"error": f"Question generation failed: {str(qe)}"}), 500
        
        # Create a new quiz in the database
        current_user = get_jwt_identity()
        quiz_id = str(uuid.uuid4())
        title = data.get('title', f"Quiz on {document_info['id'][:8]}")
        
        cursor.execute(
            "INSERT INTO quizzes (id, title, description, difficulty, user_id, file_id, created_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())",
            (
                quiz_id,
                title,
                f"Quiz generated from document: {document_info['id']}",
                data['difficulty'],
                current_user,
                document_info['id']
            )
        )
        
        # Save questions to database
        saved_questions = 0
        for question in questions:
            question_id = str(uuid.uuid4())
            
            # Handle different field names for the answer
            correct_answer = None
            if 'correctAnswer' in question:
                correct_answer = question['correctAnswer']
            elif 'answer' in question:
                correct_answer = question['answer']
            else:
                logger.warning(f"Question missing answer field: {question}")
                continue  # Skip this question
                
            cursor.execute(
                "INSERT INTO questions (id, quiz_id, question_text, question_type, difficulty, options, correct_answer, explanation) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    question_id,
                    quiz_id,
                    question['text'],
                    question['type'],
                    question['difficulty'],
                    json.dumps(question.get('options', [])) if 'options' in question else None,
                    json.dumps(correct_answer),
                    question.get('explanation', '')
                )
            )
            saved_questions += 1
        
        db_conn.commit()
        
        # Return the quiz ID and other relevant info
        return jsonify({
            "message": "Quiz generated successfully",
            "id": quiz_id,
            "title": title,
            "num_questions": saved_questions
        }), 201
        
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        # Add more detailed error logging
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz/topic', methods=['POST'])
@jwt_required()
def generate_topic_quiz():
    """Generate a quiz focused on a specific topic or query."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Parse request data
        data = request.json
        document_id = data.get('document_id')
        topic_query = data.get('topic_query')
        difficulty = data.get('difficulty', 'intermediate')
        num_questions = int(data.get('num_questions', 5))
        question_types = data.get('question_types', None)
        
        # Validate inputs
        if not document_id or not topic_query:
            return jsonify({'error': 'Document ID and topic query are required'}), 400
            
        # Retrieve document from database
        document = Document.query.filter_by(id=document_id, user_id=current_user).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
            
        # Get the document text
        document_text = document.content
        
        # Initialize question generator
        question_generator = QuestionGenerator()
        
        # Generate questions focused on the topic
        questions = question_generator.generate_questions_from_query(
            text=document_text,
            query=topic_query,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types
        )
        
        # Create a new quiz
        quiz = Quiz(
            title=f"Quiz on {topic_query}",
            description=f"Generated from document '{document.title}' focused on '{topic_query}'",
            difficulty=difficulty,
            user_id=current_user,
            document_id=document_id
        )
        
        db.session.add(quiz)
        db.session.flush()  # Get the quiz ID without committing
        
        # Add questions to the quiz
        for q in questions:
            question = Question(
                quiz_id=quiz.id,
                text=q['question'],
                question_type=q['type'],
                difficulty=q['difficulty'],
                options=json.dumps(q.get('options', [])),
                correct_answer=json.dumps(q['answer']),
                explanation=q.get('explanation', '')
            )
            db.session.add(question)
            
        # Commit to database
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz generated successfully',
            'quiz_id': quiz.id,
            'questions': questions
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error generating topic quiz: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/adaptive', methods=['POST'])
@jwt_required()
def generate_adaptive_quiz():
    """Generate an adaptive quiz based on user performance."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Parse request data
        data = request.json
        document_id = data.get('document_id')
        topic = data.get('topic', 'general')
        num_questions = int(data.get('num_questions', 5))
        question_types = data.get('question_types', None)
        
        # Validate inputs
        if not document_id:
            return jsonify({'error': 'Document ID is required'}), 400
            
        # Retrieve document from database
        document = Document.query.filter_by(id=document_id, user_id=current_user).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
            
        # Get the document text
        document_text = document.content
        
        # Get user's historical performance
        historical_performance = []
        
        # Get user's previous quizzes on this topic
        previous_quizzes = Quiz.query.filter_by(
            user_id=current_user, 
            topic=topic
        ).order_by(Quiz.created_at.desc()).limit(5).all()
        
        for quiz in previous_quizzes:
            # Get quiz results
            quiz_results = QuizResult.query.filter_by(
                quiz_id=quiz.id,
                user_id=current_user
            ).first()
            
            if quiz_results:
                historical_performance.append({
                    "quiz_id": quiz.id,
                    "topic": topic,
                    "difficulty": quiz.difficulty,
                    "correct_ratio": quiz_results.score / 100,
                    "avg_response_time": quiz_results.average_time,
                    "timestamp": quiz.created_at
                })
        
        # Initialize question generator
        question_generator = QuestionGenerator()
        
        # Generate adaptive questions
        questions = question_generator.generate_adaptive_questions(
            text=document_text,
            user_id=current_user,
            topic=topic,
            historical_performance=historical_performance,
            num_questions=num_questions,
            question_types=question_types
        )
        
        # Create a new quiz
        quiz = Quiz(
            title=f"Adaptive Quiz on {topic}",
            description=f"Personalized quiz generated from '{document.title}'",
            difficulty="adaptive",
            user_id=current_user,
            document_id=document_id,
            topic=topic
        )
        
        db.session.add(quiz)
        db.session.flush()  # Get the quiz ID without committing
        
        # Add questions to the quiz
        for q in questions:
            question = Question(
                quiz_id=quiz.id,
                text=q['question'],
                question_type=q['type'],
                difficulty=q['difficulty'],
                options=json.dumps(q.get('options', [])),
                correct_answer=json.dumps(q['answer']),
                explanation=q.get('explanation', '')
            )
            db.session.add(question)
            
        # Commit to database
        db.session.commit()
        
        return jsonify({
            'message': 'Adaptive quiz generated successfully',
            'quiz_id': quiz.id,
            'questions': questions
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error generating adaptive quiz: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/<quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz_result(quiz_id):
    """Submit results for a completed quiz."""
    try:
        current_user = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        if 'answers' not in data:
            return jsonify({"error": "No answers provided"}), 400
            
        # Get database connection
        db_conn, cursor = get_db()
        
        # Check if the quiz exists
        cursor.execute(
            "SELECT id FROM quizzes WHERE id = %s",
            (quiz_id,)
        )
        quiz = cursor.fetchone()
        
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
            
        # Get quiz questions
        cursor.execute(
            "SELECT id, correct_answer FROM questions WHERE quiz_id = %s",
            (quiz_id,)
        )
        questions = cursor.fetchall()
        
        # Create a map of question_id to correct_answer
        question_map = {q['id']: json.loads(q['correct_answer']) if q['correct_answer'] else "" for q in questions}
        
        # Calculate score
        correct_count = 0
        total_questions = len(questions)
        
        # Create quiz result
        result_id = str(uuid.uuid4())
        time_spent = data.get('time_spent', 0)
        
        # Process answers and calculate score
        for answer in data['answers']:
            question_id = answer.get('question_id')
            user_answer = answer.get('answer')
            
            if question_id in question_map:
                correct_answer = question_map[question_id]
                is_correct = False
                
                # Check if answer is correct based on question type
                if isinstance(correct_answer, list):
                    # For multiple choice, check if user selected all correct options
                    is_correct = set(user_answer) == set(correct_answer)
                else:
                    # For text/fill-in-blank, do case-insensitive comparison
                    is_correct = str(user_answer).lower() == str(correct_answer).lower()
                
                if is_correct:
                    correct_count += 1
                    
                # Store individual question result
                cursor.execute(
                    "INSERT INTO question_results (id, quiz_result_id, question_id, user_answer, is_correct) VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), result_id, question_id, json.dumps(user_answer), is_correct)
                )
        
        # Calculate final score as percentage
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        # Store overall quiz result
        cursor.execute(
            "INSERT INTO quiz_results (id, quiz_id, user_id, score, time_spent, created_at) VALUES (%s, %s, %s, %s, %s, NOW())",
            (result_id, quiz_id, current_user, score, time_spent)
        )
        
        db_conn.commit()
        
        return jsonify({
            "message": "Quiz submitted successfully",
            "result_id": result_id,
            "score": score,
            "correct_count": correct_count,
            "total_questions": total_questions
        }), 201
        
    except Exception as e:
        logger.error(f"Error submitting quiz result: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz/voice-response', methods=['POST'])
@jwt_required()
def process_voice_response():
    """Process a voice response for a quiz question."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Parse request data
        data = request.json
        question_id = data.get('question_id')
        voice_text = data.get('voice_text')
        
        if not question_id or not voice_text:
            return jsonify({'error': 'Question ID and voice text are required'}), 400
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Get the question
        cursor.execute(
            "SELECT id, question_type, correct_answer FROM questions WHERE id = %s",
            (question_id,)
        )
        question = cursor.fetchone()
        
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        # Get the correct answer
        correct_answer = json.loads(question['correct_answer'])
        
        # Initialize voice processor
        voice_processor = VoiceProcessor()
        
        # Process the voice response
        result = voice_processor.process_voice_response(
            voice_text=voice_text,
            expected_answer=correct_answer,
            question_type=question['question_type']
        )
        
        # Generate a UUID for the voice response
        voice_response_id = str(uuid.uuid4())
        
        # Store the voice response
        cursor.execute(
            """
            INSERT INTO voice_responses 
            (id, user_id, question_id, voice_text, is_correct, confidence, matched_answer, explanation, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """,
            (
                voice_response_id,
                current_user,
                question_id,
                voice_text,
                result['is_correct'],
                result['confidence'],
                json.dumps(result['matched_answer']) if result['matched_answer'] is not None else None,
                result['explanation']
            )
        )
        db_conn.commit()
        
        return jsonify({
            'message': 'Voice response processed successfully',
            'result': result
        }), 200
        
    except Exception as e:
        if 'db_conn' in locals():
            db_conn.rollback()
        logger.error(f"Error processing voice response: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/onboarding', methods=['POST'])
@jwt_required()
def user_onboarding():
    """Process user onboarding information and create initial profile."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Parse request data
        data = request.json
        background_info = data.get('background_info', {})
        
        if not background_info:
            return jsonify({'error': 'Background information is required'}), 400
        
        # Initialize cold start solver
        cold_start = ColdStartSolver()
        
        # Create initial profile
        profile = cold_start.create_initial_profile(current_user, background_info)
        
        return jsonify({
            'message': 'User profile created successfully',
            'profile': profile
        }), 201
        
    except Exception as e:
        logger.error(f"Error processing user onboarding: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/recommendations', methods=['GET'])
@jwt_required()
def get_user_recommendations():
    """Get personalized content recommendations for the user."""
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Get available documents
        cursor.execute(
            "SELECT id, title, description, tags, user_id, created_at FROM documents WHERE user_id = %s OR user_id = 'public' ORDER BY created_at DESC",
            (current_user,)
        )
        documents = cursor.fetchall()
        
        # Convert to dictionary format for recommendation system
        doc_list = []
        for doc in documents:
            doc_list.append({
                'id': doc['id'],
                'title': doc['title'],
                'description': doc['description'],
                'tags': doc['tags'].split(',') if doc['tags'] else [],
                'topic': doc['tags'].split(',')[0] if doc['tags'] else 'general',
                'difficulty': 'intermediate'  # Default difficulty
            })
        
        # Initialize recommendation system
        recommendation_system = RecommendationSystem()
        
        # Get recommendations
        recommendations = recommendation_system.get_recommendations(
            current_user, doc_list
        )
        
        return jsonify({
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET', 'POST'])
@jwt_required()
def user_profile():
    """Get or update user profile information."""
    current_user = get_jwt_identity()
    
    # Get database connection
    db_conn, cursor = get_db()
    
    if request.method == 'GET':
        try:
            # Get user profile
            cursor.execute(
                "SELECT id, email, name, role, created_at FROM users WHERE id = %s",
                (current_user,)
            )
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Get user's documents
            cursor.execute(
                "SELECT id, title, description, tags, created_at FROM documents WHERE user_id = %s ORDER BY created_at DESC",
                (current_user,)
            )
            documents = cursor.fetchall()
            
            # Get user's quizzes
            cursor.execute(
                "SELECT id, title, difficulty, created_at FROM quizzes WHERE user_id = %s ORDER BY created_at DESC",
                (current_user,)
            )
            quizzes = cursor.fetchall()
            
            return jsonify({
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "name": user['name'],
                    "role": user['role'],
                    "created_at": user['created_at']
                },
                "documents": documents,
                "quizzes": quizzes
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return jsonify({"error": f"Error getting user profile: {str(e)}"}), 500
    
    elif request.method == 'POST':
        try:
            data = request.json
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Update user profile
            update_fields = []
            update_values = []
            
            if 'name' in data:
                update_fields.append("name = %s")
                update_values.append(data['name'])
            
            if 'email' in data:
                # Check if email is already taken
                cursor.execute(
                    "SELECT id FROM users WHERE email = %s AND id != %s",
                    (data['email'], current_user)
                )
                existing_user = cursor.fetchone()
                
                if existing_user:
                    return jsonify({"error": "Email already in use"}), 409
                
                update_fields.append("email = %s")
                update_values.append(data['email'])
            
            if not update_fields:
                return jsonify({"error": "No fields to update"}), 400
            
            # Add user ID to values
            update_values.append(current_user)
            
            # Update user
            cursor.execute(
                f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
                tuple(update_values)
            )
            db_conn.commit()
            
            return jsonify({
                "message": "Profile updated successfully"
            }), 200
            
        except Exception as e:
            db_conn.rollback()
            logger.error(f"Error updating user profile: {str(e)}")
            return jsonify({"error": f"Error updating user profile: {str(e)}"}), 500

@app.route('/api/documents', methods=['GET'])
@jwt_required()
def get_documents():
    """Get all documents for the current user."""
    try:
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Query documents from NeonDB
        cursor.execute(
            "SELECT id, title, description, tags, created_at FROM documents WHERE user_id = %s ORDER BY created_at DESC",
            (current_user,)
        )
        documents = cursor.fetchall()
        
        return jsonify(documents), 200
        
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/document/<document_id>', methods=['GET'])
@jwt_required()
def get_document(document_id):
    """Get a specific document by ID."""
    try:
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Query document from NeonDB
        cursor.execute(
            "SELECT id, title, description, tags, created_at FROM documents WHERE id = %s AND user_id = %s",
            (document_id, current_user)
        )
        document = cursor.fetchone()
        
        if not document:
            return jsonify({"error": "Document not found"}), 404
            
        return jsonify(document), 200
        
    except Exception as e:
        logger.error(f"Error fetching document: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    """Get a specific quiz by ID with its questions."""
    try:
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Query quiz from database
        cursor.execute(
            "SELECT id, title, difficulty, created_at FROM quizzes WHERE id = %s",
            (quiz_id,)
        )
        quiz = cursor.fetchone()
        
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
            
        # Check if the user has access to this quiz
        cursor.execute(
            "SELECT user_id FROM quizzes WHERE id = %s",
            (quiz_id,)
        )
        quiz_owner = cursor.fetchone()
        
        if not quiz_owner or quiz_owner['user_id'] != current_user:
            return jsonify({"error": "You don't have access to this quiz"}), 403
            
        # Get quiz questions - using the correct column names from your schema
        cursor.execute(
            "SELECT id, question_text as text, question_type as type, difficulty, options, correct_answer, explanation FROM questions WHERE quiz_id = %s",
            (quiz_id,)
        )
        questions = cursor.fetchall()
        
        # Process questions to format them properly
        formatted_questions = []
        for q in questions:
            question = {
                "id": q['id'],
                "text": q['text'],
                "type": q['type'],
                "difficulty": q['difficulty'],
                "options": json.loads(q['options']) if q['options'] else [],
                "correctAnswer": json.loads(q['correct_answer']),
                "explanation": q['explanation']
            }
            formatted_questions.append(question)
            
        # Return the quiz with its questions
        return jsonify({
            "id": quiz['id'],
            "title": quiz['title'],
            "difficulty": quiz['difficulty'],
            "created_at": quiz['created_at'],
            "questions": formatted_questions
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching quiz: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz/<quiz_id>/results', methods=['GET'])
@jwt_required()
def get_quiz_results(quiz_id):
    """Get results for a specific quiz attempt."""
    try:
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Check if the user has access to this quiz
        cursor.execute(
            "SELECT user_id FROM quizzes WHERE id = %s",
            (quiz_id,)
        )
        quiz_owner = cursor.fetchone()
        
        if not quiz_owner or quiz_owner['user_id'] != current_user:
            return jsonify({"error": "You don't have access to this quiz"}), 403
            
        # Get the latest quiz result
        cursor.execute(
            "SELECT id, score, time_spent, created_at FROM quiz_results WHERE quiz_id = %s AND user_id = %s ORDER BY created_at DESC LIMIT 1",
            (quiz_id, current_user)
        )
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": "No results found for this quiz"}), 404
            
        # Get question results
        cursor.execute(
            "SELECT q.id, q.text, q.question_type, q.difficulty, q.options, q.correct_answer, qr.user_answer, qr.is_correct " +
            "FROM questions q " +
            "JOIN question_results qr ON q.id = qr.question_id " +
            "WHERE qr.quiz_result_id = %s",
            (result['id'],)
        )
        question_results = cursor.fetchall()
        
        # Format question results
        formatted_questions = []
        for qr in question_results:
            question = {
                "id": qr['id'],
                "text": qr['text'],
                "type": qr['question_type'],
                "difficulty": qr['difficulty'],
                "options": json.loads(qr['options']) if qr['options'] else [],
                "correct_answer": json.loads(qr['correct_answer']) if qr['correct_answer'] else "",
                "user_answer": qr['user_answer'],
                "is_correct": qr['is_correct']
            }
            formatted_questions.append(question)
            
        # Return the quiz result with question details
        return jsonify({
            "id": result['id'],
            "quiz_id": quiz_id,
            "score": result['score'],
            "time_spent": result['time_spent'],
            "created_at": result['created_at'],
            "questions": formatted_questions
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching quiz results: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz/direct/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_direct(quiz_id):
    """Get a quiz directly from the database with minimal processing."""
    try:
        current_user = get_jwt_identity()
        
        # Get database connection
        db_conn, cursor = get_db()
        
        # Query quiz from database
        cursor.execute(
            "SELECT id, title, difficulty, created_at, file_id FROM quizzes WHERE id = %s",
            (quiz_id,)
        )
        quiz = cursor.fetchone()
        
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
        
        # Get all questions for this quiz
        cursor.execute(
            """
            SELECT id, question_text, question_type, difficulty, options, correct_answer, explanation 
            FROM questions 
            WHERE quiz_id = %s
            """,
            (quiz_id,)
        )
        questions = cursor.fetchall()
        
        # Format the response
        formatted_questions = []
        for q in questions:
            # Handle options and correct_answer parsing safely
            options = []
            if q['options']:
                try:
                    options = json.loads(q['options'])
                except Exception as e:
                    logger.error(f"Error parsing options: {e}")
                    options = []
            
            correct_answer = None
            if q['correct_answer']:
                try:
                    correct_answer = json.loads(q['correct_answer'])
                except Exception as e:
                    logger.error(f"Error parsing correct_answer: {e}")
                    correct_answer = ""
            
            formatted_questions.append({
                "id": q['id'],
                "text": q['question_text'],
                "type": q['question_type'],
                "difficulty": q['difficulty'],
                "options": options,
                "correctAnswer": correct_answer,
                "explanation": q['explanation'] or ""
            })
        
        response_data = {
            "id": quiz['id'],
            "title": quiz['title'],
            "difficulty": quiz['difficulty'],
            "created_at": str(quiz['created_at']),
            "file_id": quiz['file_id'],  # Include file_id which frontend will map to document_id
            "questions": formatted_questions
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error in direct quiz fetch: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle OPTIONS requests for CORS preflight."""
    return '', 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 