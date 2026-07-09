from flask import Blueprint, request, jsonify
from App import db
from App.models import Category, Expense, Budget
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

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
    data = request.get_json(force=True)
    if not data or not data.get("name"):
        return jsonify({"erroe": "Category name is required"}), 400

    category_name = data.get("name").strip()

    current_user_id = int(get_jwt_identity())

    existing = Category.query.filter_by(
        user_id=current_user_id, name=category_name
    ).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 409

    new_category = Category(name=category_name, user_id=current_user_id)
    db.session.add(new_category)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Category created successfully",
                "category": {"id": new_category.id, "name": new_category.name},
            }
        ),
        201,
    )


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


@expense_bp.route("/expenses", methods=["POST"])
@jwt_required()
def create_expenses():
    """
    Log a New Expense
    ---
    tags:
      - Expenses
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - category_id
            - amount
          properties:
            category_id:
              type: integer
              example: 1
            amount:
              type: number
              example: 45.50
            description:
              type: string
              example: Weekly groceries at Walmart
            date:
              type: string
              example: "2026-07-08"
    responses:
      201:
        description: Expense logged successfully
      400:
        description: Missing required fields or category mismatch
    """
    data = request.get_json(force=True)
    current_user_id = int(get_jwt_identity())

    if not data or not data.get("category_id") or not data.get("amount"):
        return jsonify({"error": "Missing category_id or amount"}), 400

    category_id = int(data.get("category_id"))
    amount = float(data.get("amount"))
    description = data.get("description", "").strip()
    date_str = data.get("date")

    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    if not category:
        return jsonify({"error": "Invalid category assignment"}), 400

    # expense object
    new_expense = Expense(
        user_id=current_user_id,
        category_id=category_id,
        amount=amount,
        description=description,
    )

    if date_str:
        from datetime import datetime

        try:
            new_expense.date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    db.session.add(new_expense)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Expense logged successfully",
                "expense": {
                    "id": new_expense.id,
                    "category": category.name,
                    "amount": float(new_expense.amount),
                    "description": new_expense.description,
                    "date": str(new_expense.date),
                },
            }
        ),
        201,
    )


@expense_bp.route("/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    """
    Get All Expenses for Logged-in User
    ---
    tags:
      - Expenses
    security:
      - Bearer: []
    responses:
      200:
         description: A list of transactional historical items
    """
    current_user_id = int(get_jwt_identity())
    expenses = Expense.query.filter_by(user_id=current_user_id).all()

    output = []
    for e in expenses:
        output.append(
            {
                "id": e.id,
                "category_id": e.category_id,
                "category_name": e.category.name,
                "amount": float(e.amount),
                "description": e.description,
                "date": str(e.date),
            }
        )

    return jsonify(output), 200

@expense_bp.route("/dashboard/summary", methods=["GET"])
@jwt_required()
def get_dashboard_summary():
  """ 
  Get Monthly Budget Utilization Analytics
  ---
  tags:
    - Dashboard Analytics
  security:
    - Bearer: []
  parameters:
    - in: query
      name: month
      type: string
      required: true
      description: Target month filter in YYY-MM format
      example: "2026-07"
  responses:
    200:
      description: Calculated budget utilization data breakdown
    400:
      description: Missing or malformed month query 
  """
  current_user = int(get_jwt_identity())
  target_month = request.args.get("month")
  
  if not target_month or len(target_month) != 7 or "-" not in target_month:
      return jsonify({"error": "Valid month parameter required in YYYY-MM format"}), 400
    
  budgets = Budget.query.filter_by(user_id=current_user, month=target_month).all()
  
  expense_aggregates=db.session.query(
    Expense.category_id,
    func.sum(Expense.amount).label("total_spent")
  ).filter(
    Expense.user_id == current_user,
    Expense.date.like(f"{target_month}-%")
  ).group_by(Expense.category_id).all()
  
  spending_map = {item.category_id: float(item.total_spent) for item in expense_aggregates}
  
  breakdown = []
  total_monthly_budget = 0.0
  total_monthly_spent = 0.0
  
  for b in budgets:
    cat_id = b.category_id
    limit = float(b.amount_limit)
    spent = spending_map(cat_id, 0.0)
    
    total_monthly_budget += limit
    total_monthly_spent += spent
    
    breakdown.append({
            "category_id": cat_id,
            "category_name": b.category.name,
            "budget_limit": limit,
            "total_spent": spent,
            "remaining": limit - spent,
            "is_over_budget": spent > limit
        })
    
  return jsonify({
        "summary": {
            "month": target_month,
            "total_budget": total_monthly_budget,
            "total_spent": total_monthly_spent,
            "net_remaining": total_monthly_budget - total_monthly_spent
        },
        "category_breakdown": breakdown
    }), 200