"""
ProcessFlow Studio — Auth Router

Handles user registration, login, and JWT token management.
Endpoints: POST /register, POST /login, GET /me
"""

from fastapi import APIRouter

router = APIRouter()
