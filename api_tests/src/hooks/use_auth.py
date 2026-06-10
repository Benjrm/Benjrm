import schemathesis
from schemathesis import Case
import requests

cookie = {}

@schemathesis.hook("before_call")
def use_auth(ctx, case: Case, **kwargs):
    global cookie
    if not cookie:
        dummy_authentication_endpoint_debug_builds = "http://localhost:8080/auth/login/dummy/2"
        cookie = requests.get(dummy_authentication_endpoint_debug_builds).cookies.get_dict()
    case.headers["Cookie"] = "; ".join([f"{key}={value}" for key, value in cookie.items()])
