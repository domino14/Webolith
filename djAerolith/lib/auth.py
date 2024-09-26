import jwt
import time

from django.conf import settings

ACCESS_TOKEN_EXPIRATION = 3600 * 6


def create_jwt(user):
    access_token = jwt.encode(
        {
            "iss": "aerolith.org",
            "sub": f"{user.id}",
            "usn": user.username,
            "mbr": user.aerolithprofile.member,
            "exp": int(time.time()) + ACCESS_TOKEN_EXPIRATION,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return access_token
