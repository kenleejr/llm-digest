import React, { useState } from 'react';
import { useTable } from 'react-table';
import styled from 'styled-components';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import Form from 'react-bootstrap/Form';

function SearchForm({ subreddit, setSubreddit, handleSubmit }){
  return (
    <div class="container mx-auto flex rounded-lg shadow-sm overflow-hidden w-96">
      <input type="text" class="flex-grow rounded-l-lg px-4 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter Subreddit Name" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} />
      <button type="button" class="px-4 py-2 rounded-r-lg bg-indigo-500 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={handleSubmit}>Submit</button>
    </div>
  );
}

function PostsTable({ tPosts }){
  console.log(tPosts)
  return  (
    <div className="container mx-auto overflow-x-auto">        
      <table className="w-full table-auto border-collapse border border-slate-400">
        <thead>
          <tr>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Subreddit Post Title</th>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Score</th>
          </tr>
        </thead>
        <tbody>
          {tPosts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-100 cursor-pointer"> 
              <td className="py-3 px-4 border border-slate-300">{post.title}</td> 
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
    <div className="container max-h-64 overflow-y-scroll">
      <div className="prose">
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [subreddit, setSubreddit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topPosts, setTopPosts] = useState([{"id": 1234, "title": "Hello World", "score": 42}]);
  const [isSummarizing, setIsSummarizing] = useState(false)
  console.log(topPosts)
  // const [commentsSummary, setCommentsSummary] = useState(''); 

  const handleSubmit = async () => {
    setIsLoading(true);
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

  return (
    <div className="container p-6">
      <h1 className="text-center text-4xl font-bold font-['DM Sans'] mb-4">LLM Digest</h1>
      <SearchForm subreddit={subreddit} setSubreddit={setSubreddit} handleSubmit={handleSubmit} className="mt-4"/> 
      <div className="container mx-auto overflow-x-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-64"> 
          <ClipLoader loading={isLoading} />
        </div>
      ) : (
        <div className="flex justify-center items-center mt-4">
          <PostsTable tPosts={topPosts} />
        </div>
      )}
      </div>
      <div className="container mx-auto overflow-x-auto">
      {isSummarizing ? (
         <div className="flex justify-center items-center h-64"> 
          <ClipLoader loading={isSummarizing} />
         </div>
      ) : (
        <h2>summarizing</h2>
      )}
      </div>
    </div>
  );
}