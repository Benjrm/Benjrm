# from pathlib import Path
#
# import hooks
# import schemathesis
# from schemathesis import Case
# from hypothesis import settings, HealthCheck
#
# from fixtures.questions import questions
#
# BASE_DIR = Path(__file__).resolve().parents[2]
# print(f"BASE_DIR: {BASE_DIR}")
# schema_path = BASE_DIR / "docs/openapispec/RestInterface.yaml"
# schema = schemathesis.openapi.from_path(schema_path)
#
# @schema.parametrize()
# @settings(suppress_health_check=[
#     HealthCheck.function_scoped_fixture,
#     HealthCheck.filter_too_much
# ])
# def test_api(case: Case, quizzes, questions):
#     if "quizId" in case.path_parameters:
#         case.path_parameters["quizId"] = quizzes[0]["id"]
#     if "questionId" in case.path_parameters:
#         case.path_parameters["questionId"] = questions[0]["id"]
#     case.call_and_validate("http://localhost:8080")
