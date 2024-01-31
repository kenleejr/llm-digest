import React, { useState } from 'react';
import './App.css';

function App() {
  const [subreddit, setSubreddit] = useState('');
  const [topPosts, setTopPosts] = useState([]);
  const [commentsSummary, setCommentsSummary] = useState(''); 

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
    try {
      const response = await fetch(`/get-comments/${postId}`);
      const data = await response.json();
      setCommentsSummary(data.summary); // Update the comments summary state
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          placeholder="Enter subreddit name" />
        <button onClick={handleSubmit}>Get Top Posts</button>
        <ul>
          {topPosts.map((post) => (
            <li key={post.id} onClick={() => handlePostClick(post.id)}>
              {post.title} (Score: {post.score})
            </li>
          ))}
        </ul>
        {commentsSummary && (
          <div>
            <h3>Comments Summary</h3>
            <textarea value={commentsSummary} readOnly />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
