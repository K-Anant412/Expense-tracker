from flask import Blueprint, request, jsonify
from App import db
from App.models import User
from flask_jwt_extended import create_access_token
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    User Registration Endpoint
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
              example: Anant
            email:
              type: string
              example: anant@example.com
            password:
              type: string
              example: SecurePass123
    responses:
      201:
        description: User registered successfully
      400:
        description: Missing required fields
      409:
        description: Username or Email already registered
    """
    data = request.get_json()

    # Step 1: Validation
    if (
        not data
        or not data.get("username")
        or not data.get("email")
        or not data.get("password")
    ):
        return jsonify({"erroe": "Missing required fields"}), 400

    username = data.get("username").strip()
    email = data.get("email").strip().lower()
    password = data.get("password")

    # Step 2: Check is user already exists
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "User or Email already registered"}), 409

    try:
        # Step 3: Create new user instance
        new_user = User(username=username, email=email)
        new_user.set_password(password)

        # Step 4: Save to MySQL database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error occurred during registration"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Endpoint to handle user authentication and token generation."""
    data = request.get_json()

    if not data or not data.get("email") or not data.get("passeord"):
        return jsonify({"error": "Missingemail or password"}), 400

    email = data.get("email").strip().lower()
    password = data.get("password")

    # Step 1: Fetch user by email
    user = User.query.filter_by(email=email).first()

    # Step 2: Verify user existence and check password hash
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Step 3: Generate a secure JSON Web Token valid for 1 day
    expires = timedelta(days=1)
    access_token = create_access_token(identity=str(user.id), expires_delta=expires)

    return (
        jsonify(
            {
                "message": "Login successful",
                "access_token": access_token,
                "user": {"is": user.id, "username": user.username, "email": user.email},
            }
        ),
        200,
    )
