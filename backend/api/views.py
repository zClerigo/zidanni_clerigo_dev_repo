from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import requests
from django.conf import settings
from django.shortcuts import redirect
import logging
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from .auth import SupabaseAuthentication
import os
import uuid
from supabase import create_client, Client
import tempfile
import json
from rest_framework.request import Request
import httpx
import traceback
from django.http import JsonResponse

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])  # Empty list means no authentication required
def hello_world(request):
    return Response({
        "message": f"Hello, {request.user.username}!",
        "authenticated": True
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def tiktok_callback(request):
    # Get the authorization code and state from the callback
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')
    
    # Check if there's an error
    if error:
        return redirect(f'/login?error={error}')
    
    # Verify state to prevent CSRF attacks
    stored_state = request.session.get('tiktok_csrf_state')
    if not state or state != stored_state:
        return redirect('/login?error=invalid_state')
    
    # Exchange code for access token
    token_url = 'https://open.tiktokapis.com/v2/oauth/token/'
    token_data = {
        'client_key': settings.TIKTOK_CLIENT_KEY,
        'client_secret': settings.TIKTOK_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': settings.TIKTOK_REDIRECT_URI
    }
    
    try:
        response = requests.post(
            token_url,
            data=token_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        token_info = response.json()
        
        if 'error' in token_info:
            return redirect(f'/login?error={token_info["error"]}')
            
        # Store the tokens in the user's session or database
        request.session['tiktok_access_token'] = token_info['access_token']
        request.session['tiktok_refresh_token'] = token_info['refresh_token']
        request.session['tiktok_open_id'] = token_info['open_id']
        
        # Redirect to success page or dashboard
        return redirect('/dashboard?login=success')
        
    except Exception as e:
        return redirect(f'/login?error=server_error')

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def tiktok_token_exchange(request):
    code = request.data.get('code')
    logger.debug(f"Received code: {code}")

    if not code:
        return Response({"error": "No code provided"}, status=400)

    # Check if we've already processed this code
    cache_key = f'tiktok_code_{code}'
    if cache.get(cache_key):
        return Response({"error": "Code already used"}, status=400)

    try:
        # Mark this code as being processed
        cache.set(cache_key, 'processing', timeout=300)  # 5 minutes timeout

        logger.debug(f"Requesting token with: client_key={settings.TIKTOK_CLIENT_KEY}, redirect_uri={settings.TIKTOK_REDIRECT_URI}")

        response = requests.post(
            'https://open.tiktokapis.com/v2/oauth/token/',
            data={
                'client_key': settings.TIKTOK_CLIENT_KEY,
                'client_secret': settings.TIKTOK_CLIENT_SECRET,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': settings.TIKTOK_REDIRECT_URI,
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10  # Add timeout to prevent hanging requests
        )

        token_info = response.json()
        logger.debug("Received token response")  # Don't log the actual token for security

        if 'error' in token_info:
            error_code = token_info['error']
            error_description = token_info.get('error_description', 'No description provided')
            log_id = token_info.get('log_id', 'No log ID provided')

            logger.error(f"Error occurred: {error_code} - {error_description} (Log ID: {log_id})")
            
            # If the code is expired, clear it from cache
            if error_code == 'invalid_grant':
                cache.delete(cache_key)
                
            return Response({
                "error": error_code,
                "description": error_description,
                "log_id": log_id
            }, status=400)

        # Store tokens in the session
        request.session['tiktok_access_token'] = token_info['access_token']
        if 'refresh_token' in token_info:
            request.session['tiktok_refresh_token'] = token_info['refresh_token']
        
        # Mark code as used
        cache.set(cache_key, 'used', timeout=300)

        return Response({
            "message": "Login successful",
            "data": {
                "access_token": "****" + token_info['access_token'][-4:],  # Only log last 4 chars
                "token_type": token_info.get('token_type'),
                "expires_in": token_info.get('expires_in')
            }
        }, status=200)

    except requests.exceptions.RequestException as e:
        logger.exception("Network error during token exchange")
        return Response({
            "error": "network_error",
            "description": "Failed to connect to TikTok servers"
        }, status=503)
    except Exception as e:
        logger.exception("Failed to exchange token")
        return Response({
            "error": "server_error",
            "description": "An unexpected error occurred"
        }, status=500)
    finally:
        if not response.ok:
            cache.delete(cache_key)

@api_view(['GET'])
def tiktok_user_info(request):
    # Log incoming request headers
    print("Incoming request headers:", request.headers)  # Debug log

    # Get the TikTok access token from the Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'No valid authorization token provided'}, status=401)
    
    access_token = auth_header.split(' ')[1]
    
    try:
        response = requests.get(
            'https://open.tiktokapis.com/v2/user/info/',
            params={'fields': 'username,display_name,avatar_url'},
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        response_data = response.json()
        print("TikTok API Response:", response_data)  # Debug log
        
        if response.status_code != 200:
            return Response(
                {'error': 'Failed to fetch user info from TikTok', 'details': response_data},
                status=response.status_code
            )
            
        return Response(response_data)
        
    except Exception as e:
        print("Error in tiktok_user_info:", str(e))  # Debug log
        return Response(
            {'error': str(e)},
            status=500
        )

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def proxy_video_upload(request: Request):
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)
            
        video_file = request.FILES['file']
        json2video_api_key = settings.JSON2VIDEO_API_KEY

        # Get the Supabase access token from the request
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response({'error': 'No authorization token provided'}, status=401)

        access_token = auth_header.split(' ')[1]
        
        # Generate a unique filename
        file_extension = os.path.splitext(video_file.name)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        logger.debug(f"Uploading file: {unique_filename}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in video_file.chunks():
                temp_file.write(chunk)
            temp_file.flush()
            
            # Upload to Supabase Storage
            with open(temp_file.name, 'rb') as f:
                try:
                    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/videos/{unique_filename}"
                    
                    headers = {
                        'Authorization': f'Bearer {access_token}',
                        'apikey': settings.SUPABASE_ANON_KEY,
                    }
                    
                    files = {
                        'file': (unique_filename, f, video_file.content_type)
                    }
                    
                    response = requests.post(
                        upload_url,
                        headers=headers,
                        files=files
                    )
                        
                    if response.status_code != 200:
                        raise Exception(f"Upload failed: {response.text}")
                        
                    logger.debug(f"Upload response: {response.text}")
                    
                except Exception as e:
                    logger.error(f"Supabase upload error: {str(e)}")
                    raise Exception(f"Failed to upload to Supabase: {str(e)}")
                
        # Clean up the temporary file
        os.unlink(temp_file.name)
            
        # Generate the public URL
        video_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/videos/{unique_filename}"
            
        logger.debug(f"Video uploaded to Supabase: {video_url}")

        # Create the movie with the video URL
        movie_payload = {
            "resolution": "full-hd",
            "quality": "high",
            "scenes": [
                {
                    "duration": 5,  # Add a default duration
                    "elements": [
                        {
                            "type": "video",
                            "src": video_url,
                            "fit": "cover",  # Add fit mode
                            "volume": 1  # Add volume control
                        }
                    ]
                }
            ]
        }

        logger.debug(f"Sending movie creation payload: {json.dumps(movie_payload)}")

        movie_response = requests.post(
            'https://api.json2video.com/v2/movies',
            headers={
                'x-api-key': json2video_api_key,
                'Content-Type': 'application/json'
            },
            json=movie_payload,
            timeout=30  # Add timeout
        )

        logger.debug(f"Movie creation response status: {movie_response.status_code}")
        logger.debug(f"Movie creation response: {movie_response.text}")

        if not movie_response.ok:
            return Response({
                'error': 'Failed to create movie project',
                'details': movie_response.text,
                'status_code': movie_response.status_code
            }, status=movie_response.status_code)

        project_data = movie_response.json()
        
        return Response({
            'success': True,
            'project_id': project_data.get('project'),
            'video_url': video_url,
            'movie_response': project_data  # Include full response for debugging
        })

    except Exception as e:
        logger.error(f"Error in video upload process: {str(e)}")
        return Response({
            'error': str(e),
            'details': 'Internal server error',
            'traceback': traceback.format_exc()  # Include traceback for debugging
        }, status=500)

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
def create_movie(request):
    try:
        json2video_api_key = os.environ.get('JSON2VIDEO_API_KEY')
        
        response = requests.post(
            'https://api.json2video.com/v2/movies',
            headers={
                'x-api-key': json2video_api_key,
                'Content-Type': 'application/json'
            },
            json=request.data
        )
        
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
def movie_status(request, project_id):
    try:
        json2video_api_key = os.environ.get('JSON2VIDEO_API_KEY')
        
        response = requests.get(
            f'https://api.json2video.com/v2/movies/{project_id}',
            headers={
                'x-api-key': json2video_api_key
            }
        )
        
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)