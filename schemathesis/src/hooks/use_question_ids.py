import schemathesis
from schemathesis import Case, Response, APIOperation


quiz_id_to_question_ids: dict[str, list[str]] = {}
@schemathesis.hook("after_call")
def use_question_ids(ctx, case: Case, response: Response):
    operation: APIOperation = ctx.operation

    if "/quizzes/{quizId}/questions" not in operation.path:
        return

    quiz_id = case.path_parameters["quizId"]

    if operation.method == "post" and response.status_code == 201:
        quiz_id_to_question_ids.setdefault(quiz_id, []).append(
            response.json()["id"]
        )

    if operation.method == "delete" and response.status_code == 204:
        question_id = case.path_parameters["questionId"]

        if quiz_id not in quiz_id_to_question_ids:
            return

        quiz_id_to_question_ids[quiz_id] = [
            qid for qid in quiz_id_to_question_ids[quiz_id]
            if qid != question_id
        ]
