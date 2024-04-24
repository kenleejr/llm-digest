import React, { useState } from 'react';
import { useTable } from 'react-table';
import styled from 'styled-components';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import Form from 'react-bootstrap/Form';

function SearchForm({ subreddit, setSubreddit, handleSubmit }){
  return (
    <div class="container mx-auto flex rounded-lg shadow-sm overflow-hidden w-96">
      <input type="text" class="flex-grow rounded-l-lg px-4 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="Enter Subreddit Name" 
              value={subreddit} 
              onChange={(e) => setSubreddit(e.target.value)} />
      <button type="button" class="px-4 py-2 rounded-r-lg bg-indigo-500 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={handleSubmit}>Submit</button>
    </div>
  );
}

function PostsTable({ tPosts, handleSubmissionSelect, selectedSubmission}){
  console.log(selectedSubmission)
  return  (
    <div className="container">        
      <table className="table-auto border-collapse border border-slate-400">
        <thead>
          <tr>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Subreddit Post Title</th>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Score</th>
          </tr>
        </thead>
        <tbody>
          {tPosts.map((post) => (
            <tr key={post.id} className={`hover:bg-indigo-700 cursor-pointer ${post.id === selectedSubmission ? 'bg-indigo-700' : ''}`} > 
              <td className="py-3 px-4 border border-slate-300">
                <button type="button" className="w-full h-full"
                  onClick={() => handleSubmissionSelect(post.id)}>{post.title}
                </button>
              </td> 
              <td className="py-3 px-4 border border-slate-300">{post.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LargeTextDisplay({ text }) {
  return (
    <div className="container whitespace-pre-wrap">
        {text}
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [topPosts, setTopPosts] = useState([]);
  const [subreddit, setSubreddit] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [llmResponse, setllmResponse] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  console.log(topPosts)

  const handleSubmit = async () => {
    setIsLoading(true);
    setSelectedSubmission(null)
    try {
      const response = await fetch('/get-top-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subreddit }),
      });
      const data = await response.json();
      console.log(data)
      setTopPosts(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching top posts:', error);
    }
  };

  const handleSubmissionSelect = async ( postId ) => {
    setIsSummarizing(true);
    setSelectedSubmission(postId)
    console.log(postId)
    try {
      const response = await fetch("/get-comments-and-summarize/" + postId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subreddit }),
      });
      const data = await response.json();
      console.log(data.summary)
      setllmResponse(data.summary)
      setIsSummarizing(false);
    } catch (error) {
      console.error('Error summarizing post', error);
    }
  };

  return (
    <div className="container">
      <h1 className="text-center text-4xl font-bold font-['DM Sans'] mb-4">LLM Digest</h1>
      <SearchForm subreddit={subreddit} 
                  setSubreddit={setSubreddit} 
                  handleSubmit={handleSubmit} 
      /> 
      <div className="grid grid-cols-2 mt-4 mx-auto overflow-x-auto w-full gap-4">
        {isLoading ? (
          <div>
            <ClipLoader loading={isLoading} />
          </div>
        ) : (
          <div>
            <PostsTable tPosts={topPosts} 
                        handleSubmissionSelect={handleSubmissionSelect}
                        selectedSubmission={selectedSubmission}
            />
          </div>
        )}
        {isSummarizing ? (
          <div> 
            <ClipLoader loading={isSummarizing} />
          </div>
        ) : ( selectedSubmission !== null && 
          <div>
            <LargeTextDisplay text={llmResponse} />
          </div>
        )}
      </div>
    </div>
  );
}