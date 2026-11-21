import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicTrack Karnataka"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # External Government API Keys (Loaded securely from environment variables)
    DATA_GOV_IN_API_KEY: Optional[str] = os.getenv("DATA_GOV_IN_API_KEY", None)
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civictrack.db")
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civictrack_karnataka_super_secret_jwt_key_2026_gov_transparency")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Default Admin
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "CivicTrackAdmin2026!")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@civictrack.karnataka.gov.in")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
