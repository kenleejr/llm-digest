from fastapi import FastAPI, HTTPException
import httpx
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import praw
from fastapi.responses import FileResponse
from backend.generate_docs import write_comments_to_file, fetch_comments_and_write_to_file
from backend.summarize_docs import stuff_context_summarize
import logging

load_dotenv()

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
reddit = praw.Reddit(client_id='5m80-fvDDHGNcJG82XPcbw',
                     client_secret='4-nYZJ8m6MEU5LEpn3IXreyF66eoIw',
                     user_agent='laptop:llm-digest:v0.1 (by u/JohnyWalkerRed)')

class SubredditRequest(BaseModel):
    subreddit: str

@app.post("/get-top-posts")
async def get_top_posts(request: SubredditRequest):
    try:
        subreddit = reddit.subreddit(request.subreddit)
        top_posts = []
        
        for post in subreddit.hot(limit=5):
            top_posts.append({
                "title": post.title,
                "id": post.id,
                "url": post.url,
                "score": post.score
            })
        
        return top_posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-comments/{submission_id}")
async def get_comments(submission_id: str):
    submission = reddit.submission(id=submission_id)
    with open(f"{submission_id}_comments.txt", "w") as file:
        fetch_comments_and_write_to_file(submission, file)
    
    logging.info("Writing summary...")
    summary = stuff_context_summarize(f"{submission_id}_comments.txt")
    logging.info("Summary done")
    return {"summary": summary}