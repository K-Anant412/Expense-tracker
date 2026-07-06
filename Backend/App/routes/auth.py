from flask import Blueprint, request, jsonify
from App import db
from App.models import User
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    pass