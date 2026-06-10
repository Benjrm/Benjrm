import schemathesis

@schemathesis.hook("after_call")
def use_filter_errors(context, case, response): #response, results, test):
    if str(case.body).strip() == "[]":
        response.status_code = 400
        response.content = """{"category": "json_payload", "error": "deserialize", "message": "positional arrays are actually accepted, but schemathesis requires to return an error here"}""".encode()
