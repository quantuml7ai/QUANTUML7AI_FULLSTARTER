import ipaddress
def assert_private_bind(host):
 ip=ipaddress.ip_address(host)
 if not ip.is_loopback:raise RuntimeError('non_loopback_bind_forbidden')
 return True
