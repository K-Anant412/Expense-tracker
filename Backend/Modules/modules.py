from App import db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    """System users"""
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    expenses = db.relationship("Expense", backref="user", cascade="all, delete-orphan")
    categories = db.relationship("Category", backref="user", cascade="all, delete-orphan")
    budgets = db.relationship("Budget", backref="user", cascade="all, delete-orphan")
    
    def set_password(self, password):
        """Helper to securely hash passwords before saving."""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Helper to verify passwords during user login."""
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    """Custom or default spending categories (e.g., Food, Rent, Entertainment)."""
    __tablename__ = "categories"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    expenses = db.relationship("Expense", backref="category", cascade="all, delete-orphan")
    budgets = db.relationship("Budget", backref="category", cascade="all, delete-orphan")


class Expense(db.Model):
    """Individual transactional data entries."""
    __tablename__ = "expenses"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False) 
    description = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Budget(db.Model):
    """Monthly financial caps assigned to explicit categories."""
    __tablename__ = "budgets"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    
    amount_limit = db.Column(db.Numeric(10, 2), nullable=False)
    month = db.Column(db.String(7), nullable=False)
    