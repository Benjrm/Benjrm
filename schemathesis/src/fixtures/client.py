# import pytest
# import requests
#
# class Client:
#     base_url: str
#     session: requests.Session
#
#     def __init__(self, base_url: str):
#         self.base_url = base_url
#         self.session = requests.Session()
#
#     def get(self, path):
#         return self.session.get(f"{self.base_url}{path}")
#
#     def post(self, path: str, json):
#         return self.session.post(f"{self.base_url}{path}", json=json)
#
#
# @pytest.fixture
# def client() -> Client:
#     return Client("http://localhost:8080")
