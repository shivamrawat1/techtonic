import time


def static_version(request):
    """
    Add a version timestamp to static file URLs to prevent caching.
    This will be available in templates as {{ STATIC_VERSION }}.
    """
    # Use a fixed version for production to avoid cache busting issues
    import os

    if os.environ.get("ENVIRONMENT") == "production":
        return {"STATIC_VERSION": "1"}
    else:
        return {"STATIC_VERSION": int(time.time())}
