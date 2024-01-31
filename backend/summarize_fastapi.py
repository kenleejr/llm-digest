from fastapi import FastAPI, HTTPException
import httpx
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import praw
from fastapi.responses import FileResponse
from backend.generate_docs import write_comments_to_file, fetch_comments_and_write_to_file

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
        
        for post in subreddit.top(limit=5):
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
    
    return FileResponse(path=f"{submission_id}_comments.txt", filename=f"{submission_id}_comments.txt")


@app.post("/summarize")
async def summarize(subreddit: str):
    # Fetch the top post from the subreddit
    async with httpx.AsyncClient() as client:
        reddit_response = await client.get(f"https://www.reddit.com/r/{subreddit}/top.json?limit=1", headers={"User-Agent": "FastAPI reddit summarizer"})
        
        if reddit_response.status_code != 200:
            raise HTTPException(status_code=reddit_response.status_code, detail="Error fetching data from Reddit")

        # Extract the post's title and text
        top_post_data = reddit_response.json()
        try:
            post_title = top_post_data["data"]["children"][0]["data"]["title"]
            post_selftext = top_post_data["data"]["children"][0]["data"]["selftext"]
        except (IndexError, KeyError):
            raise HTTPException(status_code=500, detail="Error processing Reddit data")

        # Summarize the post using OpenAI
        openai_response = await client.post(
            "https://api.openai.com/v1/engines/davinci-codex/completions",
            json={
                "prompt": f"Summarize this Reddit post: \n\n{post_title}\n\n{post_selftext}",
                "max_tokens": 100
            },
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
        )

        if openai_response.status_code != 200:
            raise HTTPException(status_code=openai_response.status_code, detail="Error interacting with OpenAI")

        summary = openai_response.json()["choices"][0]["text"].strip()

        return {"summary": summary}