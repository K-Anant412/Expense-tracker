from flask import Blueprint, request, jsonify
from App import db
from App.models import Category, Expense
from flask_jwt_extended import jwt_required, get_jwt_identity

# Initialize the Expenses and Categories Blueprint
expense_bp = Blueprint("expenses", __name__)

@expense_bp.route("/categories", methods=["POST"])
@jwt_required()
def create_category():
    """
    Create a New Spending Category
    ---
    tags:
      - Categories
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: Food & Dining
    responses:
      201:
        description: Category created successfully
      400:
        description: Missing category name
    """
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"erroe": "Category name is required"}), 400
    
    category_name = data.get("name").strip()
    
    current_user_id = int(get_jwt_identity())
    
    existing = Category.query.filter_by(user_id=current_user_id, name=category_name).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 409
    
    new_category = Category(name=category_name, user_id=current_user_id)
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify({
        "message": "Category created successfully",
        "category": {"id": new_category.id, "name": new_category.name}
    }), 201
    
@expense_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    """
    Get All Categories for Logged-in User
    ---
    tags:
      - Categories
    security:
      - Bearer: []
    responses:
      200:
        description: A list of user categories
    """
    current_user_id = int(get_jwt_identity())
    
    # Query only categories belonging to the authenticated user
    categories = Category.query.filter_by(user_id=current_user_id).all()
    
    output = [{"id": c.id, "name": c.name} for c in categories]
    return jsonify(output), 200