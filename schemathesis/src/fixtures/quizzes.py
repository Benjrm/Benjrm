# import pytest
#
# from fixtures.client import Client
#
#
# @pytest.fixture
# def quizzes(auth_client: Client):
#     quizzes_to_create = [
#         {"title": "Questions about the fox",
#          "description": "Learn why the fox is important in operating systems and fonts."},
#         {"title": "Rust programming language",
#          "description": "Learn about the Rust programming language and its features.", "hidden": True},
#     ]
#
#     created_quizzes = []
#
#     for quiz_to_create in quizzes_to_create:
#         response = auth_client.post("/api/v1/quizzes", quiz_to_create)
#         created_quizzes.append(response.json())
#
#     return created_quizzes
