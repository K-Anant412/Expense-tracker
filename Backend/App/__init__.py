from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
from config import config_options

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda model: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }
    
swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "WealthWatch API Documentation",
            "description": "Production-ready REST API for personal expense tracking",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            }
        }
    }

swagger = Swagger(config=swagger_config, template=swagger_template)

# def create_app(config_name="development"):
#     """The Application Factory function"""
#     app = Flask(__name__)

#     import os
#     allowed_origins = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
#     cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})
    
#     app.config.from_object(config_options[config_name])

#     db.init_app(app)
#     migrate.init_app(app, db)
#     jwt.init_app(app)
#     cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
#     swagger.init_app(app)

#     from App.routes.auth import auth_bp

#     app.register_blueprint(auth_bp, url_prefix="/api/auth")

#     from App.routes.expenses import expense_bp

#     app.register_blueprint(expense_bp, url_prefix="/api")

#     from App import models

#     return app


def create_app(config_name=None):
    """The Application Factory function"""
    app = Flask(__name__)

    # ⚡ Fix 1: Automatically detect the execution environment layer
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development")

    app.config.from_object(config_options[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # ⚡ Fix 2: Secure CORS boundaries for production domains
    allowed_origins = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})
    
    swagger.init_app(app)

    # Register blueprints cleanly
    from App.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from App.routes.expenses import expense_bp
    app.register_blueprint(expense_bp, url_prefix="/api")

    # Import models contextually to connect with database metadata engines
    from App import models

    # ⚡ Fix 3: Production safety net - auto-create tables if missing
    with app.app_context():
        db.create_all()

    return app