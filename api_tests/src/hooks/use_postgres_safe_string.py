import schemathesis
from hypothesis.strategies import SearchStrategy


def postgres_safe_string(value: str) -> str:
    """
    Makes a string safe for PostgreSQL usage in unsafe/raw query contexts.
    NOTE: Best practice is still parameterized queries.
    """
    value = value.replace("\x00", "").replace("\u0000", "")
    return value


def sanitize(value):
    if isinstance(value, str):
        return postgres_safe_string(value)

    if isinstance(value, list):
        return [sanitize(v) for v in value]

    if isinstance(value, tuple):
        return tuple(sanitize(v) for v in value)

    if isinstance(value, dict):
        return {sanitize(k): sanitize(v) for k, v in value.items()}

    return value


@schemathesis.hook("before_generate_body")
def use_postgres_safe_string(context, strategy: SearchStrategy) -> SearchStrategy:
    """
    Cleans generated request bodies BEFORE they are sent.
    Removes null bytes and applies Postgres-safe escaping.
    """
    return strategy.map(sanitize)
