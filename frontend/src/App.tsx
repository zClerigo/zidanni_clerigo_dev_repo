import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import Hello from './components/Hello'
import GeoLocation from './components/Geolocation'
import PostCreation from './components/PostCreation'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './components/Hello'
import { TikTokCallback } from './components/TikTokCallback'
import './App.css'
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { AuthProvider } from './contexts/AuthContext';

// Make sure these environment variables are correctly set in your .env file
const supabaseUrl = 'https://dxykrajectccijemduxd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWtyYWplY3RjY2lqZW1kdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NDk3NTEsImV4cCI6MjA1NTQyNTc1MX0.iNqyQg2NC1KC2JeW8aTvI908jTKd7WGs9fmS2G6jMII';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

function App() {
  const { user, loading, signOut } = useAuth()

  return (
    <AuthProvider>
      <SessionContextProvider supabaseClient={supabase}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-gray-900">Welcome, User!</h1>
                {user && (
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center p-8">Loading...</div>
              ) : (
                <Routes>
                  <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
                  <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Hello />} />
                    <Route path="/location" element={<GeoLocation />} />
                    <Route path="/post/create" element={<PostCreation />} />
                  </Route>
                  <Route path="/tiktok/callback" element={<TikTokCallback />} />
                </Routes>
              )}
            </main>
          </div>
        </BrowserRouter>
      </SessionContextProvider>
    </AuthProvider>
  );
}

export default App;