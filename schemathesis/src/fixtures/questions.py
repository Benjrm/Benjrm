# import pytest
#
# from fixtures.client import Client
#
#
# @pytest.fixture
# def questions(quizzes, auth_client: Client):
#     created_quiz_id = quizzes[0]["id"]
#
#     questions_to_create = [
#         {
#             "question": "Why is the fox often used in programming examples?",
#             "type": "SLIDE",
#             "hidden": False
#         },
#         {
#             "question": "What is the purpose of a unit test?",
#             "type": "SINGLE_CHOICE",
#             "options": [
#                 {"answer": "To test individual functions", "correct": True},
#                 {"answer": "To style the UI", "correct": False}
#             ]
#         },
#         {
#             "question": "Which of the following are programming languages?",
#             "type": "MULTIPLE_CHOICE",
#             "options": [
#                 {"answer": "Rust", "correct": True},
#                 {"answer": "Python", "correct": True},
#                 {"answer": "HTML", "correct": False}
#             ]
#         },
#         {
#             "question": "Put the steps of an HTTP request in order",
#             "type": "ORDER",
#             "options": [
#                 {"answer": "Client sends request"},
#                 {"answer": "Server processes request"},
#                 {"answer": "Server returns response"}
#             ]
#         }
#     ]
#
#     created_questions = []
#
#     for question_to_create in questions_to_create:
#         response = auth_client.post(f"/api/v1/quizzes/{created_quiz_id}/questions", json=question_to_create)
#         created_questions.append(response.json())
#
#     return created_questions
