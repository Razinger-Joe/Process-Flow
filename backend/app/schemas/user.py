"""
ProcessFlow Studio — User Pydantic Schemas

Defines schemas for validation of user input, logins, and access tokens.
"""

from datetime import datetime
import uuid
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base schema for User data fields."""
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=256)


class UserCreate(UserBase):
    """Schema for creating a new user account."""
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Schema for user authentication request."""
    email: EmailStr
    password: str


class UserOut(UserBase):
    """Schema for user data output returned by APIs."""
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True  # supports SQLAlchemy ORM mapping
    }


class Token(BaseModel):
    """Access token response schema."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Data stored in the decoded JWT token."""
    user_id: uuid.UUID | None = None
