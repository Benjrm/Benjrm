import schemathesis
import random

sessions: list[tuple[str, int]] = []

@schemathesis.hook("after_call")
def use_session_ids(ctx, case, response):
    if ctx.operation.method == "post" and ctx.operation.path == "/api/v1/quizzes/{quizId}/sessions" and response.status_code == 201:
        if not "quizId" in case.path_parameters:
            return
        sessions.append((case.path_parameters["quizId"], response.json()["code"]))

    if ctx.operation.method == "delete" and ctx.operation.path.endswith("sessions/{session}") and response.status_code == 204:
        if not "session" in case.path_parameters:
            return
        code = case.path_parameters["session"]
        for i in range(0, len(sessions)):
            if sessions[i][1] == code:
                del sessions[i]
                return

@schemathesis.hook("before_call")
def use_session_id(context, case, kwargs):
    if "/sessions/{session}" in case.operation.path:
        if len(sessions) > 0:
            session = random.choice(sessions)
            case.path_parameters["session"] = session[1]
            if "{quizId}" in case.operation.path:
                case.path_parameters["quizId"] = session[0]
