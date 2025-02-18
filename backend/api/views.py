from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hello_world(request):
    return Response({
        "message": f"Hello, {request.user.username}!",
        "authenticated": True
    })