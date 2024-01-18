from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt



app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# JWT configuration
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # Change this to a secure secret key
jwt = JWTManager(app)

# SQLite database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# User entity model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)
    is_librarian = db.Column(db.Boolean, default=False)
    books = db.relationship('Book', backref='user', lazy=True)


# Book entity model
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Create tables
with app.app_context():
    db.create_all()

# Routes

# User Routes


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Example: Set is_librarian based on a condition (e.g., username contains 'librarian')
    is_librarian = 'librarian' in data['username'].lower()
    
    new_user = User(username=data['username'], password=hashed_password, is_librarian=is_librarian)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({"message": "Login successful", "access_token": access_token}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# Book Routes

# Book Routes

@app.route('/books', methods=['GET'])
@jwt_required()
def get_all_books():
    current_user = get_jwt_identity()
    books = Book.query.filter_by(user_id=current_user).all()
    result = [
        {"id": book.id, "title": book.title, "author": book.author, "user_id": book.user_id}
        for book in books
    ]
    return jsonify(result)

@app.route('/books', methods=['POST'])
@jwt_required()
def add_book():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    # Check if the current user is a librarian
    if not user.is_librarian:
        return jsonify({"message": "Unauthorized to add books"}), 401

    data = request.get_json()
    new_book = Book(title=data['title'], author=data['author'], user_id=current_user)
    db.session.add(new_book)
    db.session.commit()
    return jsonify({"message": "Book added successfully"}), 201

@app.route('/books/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    book = Book.query.get(book_id)

    # Check if the current user is a librarian and the book exists
    if user.is_librarian and book:
        data = request.get_json()
        book.title = data['title']
        book.author = data['author']
        db.session.commit()
        return jsonify({"message": "Book updated successfully"})
    else:
        return jsonify({"message": "Book not found or unauthorized"}), 404

@app.route('/books/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    book = Book.query.get(book_id)

    # Check if the current user is a librarian and the book exists
    if user.is_librarian and book:
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": "Book deleted successfully"})
    else:
        return jsonify({"message": "Book not found or unauthorized"}), 404

if __name__ == '__main__':
    app.run(debug=True)


if __name__ == '__main__':
    app.run(debug=True)