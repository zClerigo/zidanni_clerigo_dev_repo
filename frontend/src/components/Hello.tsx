import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { supabase } from '../lib/supabaseClient';

export default function Hello() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('No active session');
          setLoading(false);
          return;
        }

        const response = await apiClient.get('hello/', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        console.log("Response:", response);
        
        setMessage(response.data.message);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch message');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-700">{message}</h1>
    </div>
  );
}