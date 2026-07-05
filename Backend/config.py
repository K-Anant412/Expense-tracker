from dotenv import load_dotenv
from urllib.parse import quote_plus
import os

load_dotenv()

class Config:
    """Base configuration with shared settings"""
    
    SECRET_KEY=os.getenv("SECRET_KEY", "fallback-local-development-key")
    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS=False
    
class DevelopmentConfig(Config):
    """Local development environment configurations."""
    
    DEBUG=True
    
    db_user = os.getenv("DB_USER")
    db_host = os.getenv("DB_HOST")
    db_password = quote_plus(os.getenv("DB_PASSWORD")) 
    db_port = os.getenv("DB_PORT")
    db_database = os.getenv("DB_NAME")
    
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_database}"
   
class ProductionConfig(Config):
    """Production devlopment environment configurations."""
    DEBUG=False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    
config_options={
    "development": DevelopmentConfig,
    "production": ProductionConfig
}