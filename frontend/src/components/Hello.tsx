import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TikTokLogin } from './TikTokLogin';
import './Dashboard.css';

interface ApiResponse {
  result: {
    node_outputs: {
      [key: string]: string;
    };
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [postStats] = useState([
    { status: 'Draft', count: 0 },
    { status: 'Scheduled', count: 0 },
    { status: 'Published', count: 0 },
  ]);
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parsedIdeas, setParsedIdeas] = useState<string[]>([]);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch("https://fungitest.fungiproject.xyz/test/graphs/run", {
          method: "POST",
          headers: {
            "Authorization": "ApiKey hm_pGatOIBjHsDIs4tXiheBUNaB71YdZCiYFAIblfUlOp4",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: "67baf892b43dea14876a5fd0",
            deploymentId: "67bb044c732073aa549e7320",
            prompt: "Generate post ideas",
            chatHistory: [],
            projectId: null
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json() as ApiResponse;
        const nodeOutputs = data.result.node_outputs;
        
        // Get the first value from the node_outputs object
        const firstOutput = Object.values(nodeOutputs)[0];
        if (typeof firstOutput === 'string') {
          const ideas = firstOutput.split('\n').filter(Boolean);
          setParsedIdeas(ideas);
          setApiResponse(JSON.stringify(nodeOutputs));
        } else {
          throw new Error('Unexpected response format');
        }
        
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  return (
    <div className="container">
      <div className="grid">
        {/* Calendars Section */}
        <div className="card">
          <div className="section-header">
            <span>📅</span>
            <h2>Calendars</h2>
          </div>
          <button 
            onClick={() => navigate('/location')}
            className="add-calendar-button"
          >
            + Add New Calendar
          </button>
          <div className="calendar-item">
            <div className="calendar-avatar">T</div>
            <span>Test</span>
          </div>
        </div>

        {/* Post Overview Section */}
        <div className="card">
          <div className="section-header">
            <span>📊</span>
            <h2>Post Overview</h2>
          </div>
          <div className="status-list">
            {postStats.map((stat) => (
              <div 
                key={stat.status} 
                className={`status-item status-${stat.status.toLowerCase().replace(' ', '-')}`}
              >
                <span>{stat.status}</span>
                <span className="status-count">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* On the Radar Section */}
        <div className="card">
          <div className="section-header">
            <span>👁️</span>
            <h2>On the Radar</h2>
          </div>
          <div className="date-navigation">
            <a href="#" className="nav-link">&lt; Fri, Feb 21</a>
            <span>Today</span>
            <a href="#" className="nav-link">Sun, Feb 23 &gt;</a>
          </div>
          <div className="empty-state">
            <p>No posts added for this date.</p>
            <button 
              onClick={() => navigate('/post/create')}
              className="create-post-button"
            >
              Create New Post
            </button>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '1.5rem' }}>
        {/* Post Ideas Section */}
        <div className="card">
      <div className="section-header">
        <span>💡</span>
        <h2>Post Ideas</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">Loading ideas...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">
            <p>Error: {error}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {parsedIdeas.map((idea: string, index: number) => (
              <li 
                key={index}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {idea}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </div>

        {/* TikTok Integration Section */}
        <div className="card">
          <div className="section-header">
            <span>🔑</span>
            <h2>TikTok Integration</h2>
          </div>
          <TikTokLogin
            clientKey="sbawdufeueiq69euvk"
            redirectUri="https://tasty-pens-grab.loca.lt/tiktok/callback"
            scopes={['user.info.basic', 'video.list']}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;