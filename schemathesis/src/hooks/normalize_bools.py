import schemathesis
from schemathesis import Case


@schemathesis.hook("before_call")
def normalize_bools(ctx, case: Case, kwargs):
    generated_query_parameters = case.query
    for key, value in generated_query_parameters.items():
        if isinstance(value, bool):
            generated_query_parameters[key] = "true" if value else "false"
    case.query = generated_query_parameters

