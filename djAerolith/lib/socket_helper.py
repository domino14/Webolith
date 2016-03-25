import hmac
import hashlib
import time

from django.conf import settings


TOKEN_EXPIRE_TIME = 30  # SECONDS.


def get_connection_token(user, realm):
    """
    Return a token and its associated expiry time, given a user and a room.

    """
    # Create a string to "sign"
    expire = int(time.time()) + TOKEN_EXPIRE_TIME
    to_sign = 'expire={0}&realm={1}&user={2}'.format(expire, realm, user)
    digest_maker = hmac.new(settings.SECRET_KEY, to_sign, hashlib.sha1)
    digest = digest_maker.hexdigest()
    socket_conn_url = settings.SOCKET_SERVER + '?' + to_sign
    return socket_conn_url, digest
