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
swagger =Swagger()

def create_app(config_name="development"):
    """The Application Factory function"""
    app = Flask(__name__)
    
    app.config.from_object(config_options[config_name])
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*":{"origins": "*"}})
    swagger.init_app(app)
    
    from App.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    
    from App import models
    
    return app