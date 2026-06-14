"""
ProcessFlow Studio — Auth Router

Defines endpoints for user registration, login, and profile fetching.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Register a new user in the system.
    Checks for email uniqueness and hashes the password.
    """
    # Check if user with email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered.",
        )

    # Create new user
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(new_user)
    await db.flush()  # gets the ID of new_user without committing transaction completely
    
    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Login to obtain access token (supports form-data and JSON)",
)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    OAuth2 compatible token login.
    Validates username (email) and password and returns a JWT access token.
    """
    result = await db.execute(select(User).where(User.email == form_data.username, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get profile of the currently logged-in user",
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Return active user profile payload.
    """
    return current_user
