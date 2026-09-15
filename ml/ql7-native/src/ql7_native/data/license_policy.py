ALLOWED={'ql7_internal_approved','licensed','public_domain','consented_redacted'}
def assert_license(value:str):
 if value not in ALLOWED:raise ValueError(f'license_not_approved:{value}')
 return value
