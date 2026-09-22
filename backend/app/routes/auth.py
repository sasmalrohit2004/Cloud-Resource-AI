import hashlib
import os
import secrets
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field
from app.database.mongodb import db_manager

router = APIRouter(prefix="/auth", tags=["Authentication & Authorization"])

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = "cloud_resource_ai_salt"
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60, description="Full Name")
    email: str = Field(..., min_length=3, max_length=120, description="Corporate or University Email")
    password: str = Field(..., min_length=6, description="Account Password")
    role: Optional[str] = Field("Cloud Engineer", description="User Authorization Role")

class LoginRequest(BaseModel):
    email: str = Field(..., description="Registered Email")
    password: str = Field(..., description="Account Password")

class UserResponse(BaseModel):
    name: str
    email: str
    role: str
    token: str
    created_at: str

@router.post("/register", response_model=UserResponse)
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Please provide a valid email address.")
        
    existing = db_manager.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")

    if len(req.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters long.")

    pwd_hash = hash_password(req.password)
    token = secrets.token_hex(24)
    now_iso = datetime.now().isoformat()

    user_doc = {
        "name": req.name.strip(),
        "email": email,
        "password_hash": pwd_hash,
        "role": req.role or "Cloud Engineer",
        "token": token,
        "created_at": now_iso
    }
    db_manager.insert_user(user_doc)

    return UserResponse(
        name=user_doc["name"],
        email=user_doc["email"],
        role=user_doc["role"],
        token=user_doc["token"],
        created_at=user_doc["created_at"]
    )

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = db_manager.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="Account not found. You must register first before signing in."
        )

    req_hash = hash_password(req.password)
    # Check both hashed and legacy fallback plaintext if any
    if user.get("password_hash") != req_hash and user.get("password_hash") != req.password:
        raise HTTPException(
            status_code=401, 
            detail="Incorrect password. Please verify your credentials."
        )

    # Generate active session token
    token = secrets.token_hex(24)
    user["token"] = token
    db_manager.insert_user(user)

    return UserResponse(
        name=user["name"],
        email=user["email"],
        role=user.get("role", "Cloud Engineer"),
        token=token,
        created_at=user.get("created_at", datetime.now().isoformat())
    )

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "").strip()
    user = db_manager.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    return {
        "authenticated": True,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "Cloud Engineer"),
            "token": token
        }
    }
