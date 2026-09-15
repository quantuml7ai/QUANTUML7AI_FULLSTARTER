ALLOWED_METHODS={'normalize','encode','understand','safety','rerank','generate','critique','health','manifest'}
def validate_request(data,method=None):
    if not isinstance(data,dict):raise ValueError('request_object_required')
    if method and method not in ALLOWED_METHODS:raise ValueError('method_not_allowed')
    text=data.get('text','');
    if isinstance(text,str) and len(text)>200000:raise ValueError('input_too_large')
    return data
