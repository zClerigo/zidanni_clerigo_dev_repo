import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import Hello from './components/Hello'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  const { user, loading, signOut } = useAuth()
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">My App</h1>
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
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Hello />} />
              </Route>
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;