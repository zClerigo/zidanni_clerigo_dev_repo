import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const TikTokCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestMade = useRef(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const code = searchParams.get('code');

    const exchangeToken = async () => {
      if (!code || requestMade.current) return;
      
      requestMade.current = true;
      
      try {
        const response = await fetch('/api/tiktok/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange token');
        }

        const data = await response.json();
        console.log('Token exchange response:', data);
        
        if (data.error) {
          console.error('Error exchanging code:', data.error, data.description);
          navigate(`/login?error=${encodeURIComponent(data.description || data.error)}`);
        } else {
          const accessToken = data.data.access_token;
          localStorage.setItem('tiktok_access_token', accessToken);  // Store as tiktok_access_token
          console.log('Access token stored:', accessToken);

          await fetchUserInfo(accessToken);
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        navigate('/login?error=fetch_error');
      }
    };

    const fetchUserInfo = async (accessToken: string) => {
      try {
        console.log('Fetching user info with token:', accessToken);  // Debug log
        
        const response = await fetch('/api/tiktok/user-info/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);  // Debug log
          throw new Error(`Error ${response.status}: ${errorData.error || 'Failed to fetch user info'}`);
        }

        const userInfo = await response.json();
        console.log('User info response:', userInfo);
        
        if (userInfo.data && userInfo.data.user) {
          const userData = userInfo.data.user;
          setUsername(userData.display_name || userData.username);
          // Store user data in localStorage
          localStorage.setItem('tiktok_user_info', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    if (error) {
      console.error('Error from TikTok:', error);
      navigate(`/login?error=${error}`);
    } else {
      exchangeToken();
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2>Processing TikTok Login...</h2>
        {username && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold">Welcome, {username}!</h3>
          </div>
        )}
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};