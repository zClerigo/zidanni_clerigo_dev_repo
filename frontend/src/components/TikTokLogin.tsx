import { useCallback } from 'react';

interface TikTokLoginProps {
  clientKey: string;
  redirectUri: string;
  scopes: string[];
}

export const TikTokLogin: React.FC<TikTokLoginProps> = ({ clientKey, redirectUri, scopes }) => {
  const handleLogin = useCallback(() => {
    // Generate CSRF state token
    const array = new Uint8Array(30);
    const csrfState = window.crypto.getRandomValues(array).join('');
    
    // Store state in localStorage for verification after redirect
    localStorage.setItem('tiktok_csrf_state', csrfState);

    // Construct authorization URL with the exact same redirect URI as registered
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    const params = new URLSearchParams({
      client_key: clientKey,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: csrfState
    });
    
    window.location.href = `${authUrl}?${params.toString()}`;
  }, [clientKey, redirectUri, scopes]);

  return (
    <button onClick={handleLogin} className="auth-button">
      <img src="/tiktok-logo.png" alt="" className="w-5 h-5 mr-2" />
      Login with TikTok
    </button>
  );
}; 