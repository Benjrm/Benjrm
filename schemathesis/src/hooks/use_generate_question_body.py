import schemathesis
from hypothesis import strategies as st
from schemathesis import APIOperation

from .use_question_ids import quiz_id_to_question_ids

@schemathesis.hook("before_generate_body")
def use_generate_question_body(context, strategy):
    operation: APIOperation = context.operation

    if "questions" not in operation.path or operation.method not in {"post", "patch", "put"}:
        return strategy

    quiz_id = str(operation.path_parameters.get("quizId"))
    question_pool = quiz_id_to_question_ids.get(quiz_id, [])

    @st.composite
    def valid_question_body(draw):
        question_text = draw(st.text(min_size=1, max_size=200))
        hidden = draw(st.booleans())

        question_type = draw(
            st.sampled_from(
                ["SLIDE", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "ORDER"]
            )
        )

        body = {
            "question": question_text,
            "hidden": hidden,
            "type": question_type,
        }

        # ------------------------------------
        # OPTIONS
        # ------------------------------------
        if question_type != "SLIDE":
            num_options = draw(st.integers(min_value=2, max_value=4))

            if question_type == "ORDER":
                body["options"] = [
                    {"answer": draw(st.text(min_size=1, max_size=100))}
                    for _ in range(num_options)
                ]
            else:
                options = [
                    {
                        "answer": draw(st.text(min_size=1, max_size=100)),
                        "correct": draw(st.booleans()),
                    }
                    for _ in range(num_options)
                ]

                if not any(opt["correct"] for opt in options):
                    idx = draw(
                        st.integers(min_value=0, max_value=num_options - 1)
                    )
                    options[idx]["correct"] = True

                body["options"] = options

        # ------------------------------------
        # prev / next
        # ------------------------------------
        if question_pool:
            if draw(st.booleans()):
                body["prev"] = draw(st.sampled_from(question_pool))
            if draw(st.booleans()):
                body["next"] = draw(st.sampled_from(question_pool))

        return body

    return valid_question_body()
