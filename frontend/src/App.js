import React, { useState } from 'react';
import './App.css';

function App() {
  const [subreddit, setSubreddit] = useState('');
  const [topPosts, setTopPosts] = useState([]);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/get-top-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subreddit }),
      });
      const data = await response.json();
      setTopPosts(data);
    } catch (error) {
      console.error('Error fetching top posts:', error);
    }
  };

  const handlePostClick = async (postId) => {
    // This would be the URL where your FastAPI backend is serving the files
    window.open(`http://localhost:8000/get-comments/${postId}`, '_blank');
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          placeholder="Enter subreddit name"
        />
        <button onClick={handleSubmit}>Get Top Posts</button>
        <ul>
          {topPosts.map((post) => (
            <li key={post.id} onClick={() => handlePostClick(post.id)}>
              {post.title} (Score: {post.score})
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
