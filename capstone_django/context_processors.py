import time

def static_version(request):
    """
    Add a version timestamp to static file URLs to prevent caching.
    This will be available in templates as {{ STATIC_VERSION }}.
    """
    return {'STATIC_VERSION': int(time.time())} 