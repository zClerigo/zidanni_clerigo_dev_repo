from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('tiktok/callback/', views.tiktok_callback, name='tiktok_callback'),
    path('tiktok/token/', views.tiktok_token_exchange, name='tiktok_token_exchange'),
    path('tiktok/user-info/', views.tiktok_user_info, name='tiktok-user-info'),
    path('proxy/video-upload/', views.proxy_video_upload, name='proxy-video-upload'),
    path('proxy/create-movie/', views.create_movie, name='create_movie'),
    path('proxy/movie-status/<str:project_id>/', views.movie_status, name='movie_status'),
]