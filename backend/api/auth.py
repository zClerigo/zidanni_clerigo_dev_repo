import jwt
import logging
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions

logger = logging.getLogger(__name__)

class SupabaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        logger.debug(f"Auth header: {auth_header}")
        
        if not auth_header:
            logger.debug("No Authorization header found")
            return None
            
        try:
            auth_parts = auth_header.split()
            if len(auth_parts) != 2 or auth_parts[0].lower() != 'bearer':
                logger.debug("Invalid token header format")
                raise exceptions.AuthenticationFailed('Invalid token header')
                
            token = auth_parts[1]
            logger.debug("Token extracted successfully")
            
            try:
                # First verify the token signature
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=['HS256'],
                    audience='authenticated'
                )
                
                logger.debug(f"Token payload: {payload}")
                
                user_id = payload.get('sub')
                if not user_id:
                    logger.debug("No user_id in token payload")
                    raise exceptions.AuthenticationFailed('Invalid token payload')
                    
                user, created = User.objects.get_or_create(
                    username=user_id,
                    defaults={'email': payload.get('email', '')}
                )
                
                if created:
                    logger.debug(f"Created new user: {user_id}")
                else:
                    logger.debug(f"Found existing user: {user_id}")
                
                return (user, token)
                
            except jwt.InvalidTokenError as e:
                logger.error(f"JWT decode error: {str(e)}")
                raise exceptions.AuthenticationFailed('Invalid token format')
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed(str(e))
            
    def authenticate_header(self, request):
        return 'Bearer'