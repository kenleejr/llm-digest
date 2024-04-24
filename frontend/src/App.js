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

function PostsTable({ tPosts, selectedArticles, setSelectedArticles, handleArticleSelect, handleSelect }){
  return  (
    <div className="container mx-auto overflow-x-auto">        
      <table className="w-full table-auto border-collapse border border-slate-400">
        <thead>
          <tr>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">
              <input type="checkbox" onChange={() => setSelectedArticles(tPosts.map(post => post.id))} />
            </th>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Subreddit Post Title</th>
            <th className="bg-gray-100 text-left py-3 px-4 border border-slate-300">Score</th>
          </tr>
        </thead>
        <tbody>
          {tPosts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-100 cursor-pointer"> 
              <td className="py-3 px-4 border border-slate-300">
                <input type="checkbox" checked={selectedArticles.includes(post.id)} onChange={() => handleArticleSelect(post.id)} />
              </td>
              <td className="py-3 px-4 border border-slate-300"><button type="button" onClick={() => handleSelect(post.id)}>{post.title}</button></td> 
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
    <div className="container max-h-64 whitespace-pre-wrap">
      <div>
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [topPosts, setTopPosts] = useState([]);
  const [subreddit, setSubreddit] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [llmResponse, setllmResponse] = useState('')


  console.log(topPosts)

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

  const handleSelect = async ( postId ) => {
    setIsSummarizing(true);
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

  const handleArticleSelect = (postId) => {
    const isSelected = selectedArticles.includes(postId);
    setSelectedArticles(isSelected ? selectedArticles.filter(id => id !== postId) : [...selectedArticles, postId]);
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
          <PostsTable tPosts={topPosts} setSelectedArticles={setSelectedArticles} selectedArticles={selectedArticles} handleArticleSelect={handleArticleSelect} handleSelect={handleSelect}/>
        </div>
      )}
      </div>
      <div className="container mx-auto overflow-x-auto mt-4">
      {isSummarizing ? (
         <div className="flex justify-center items-center h-64"> 
          <ClipLoader loading={isSummarizing} />
         </div>
      ) : (
        <div className="flex justify-center items-center mt-4">
          <LargeTextDisplay text={llmResponse} />
        </div>
      )}
      </div>
    </div>
  );
}