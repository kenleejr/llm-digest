from fastapi import FastAPI, HTTPException
import httpx
import os
import json
import asyncio
import sys
from dotenv import load_dotenv
from pydantic import BaseModel
import praw
from fastapi.responses import FileResponse
from backend.summarize_docs import stuff_context_summarize
from contextlib import asynccontextmanager
import requests
import logging
import asyncpraw
from asyncpraw.models.comment_forest import CommentForest
from langchain_text_splitters import CharacterTextSplitter
from langchain.llms import Ollama
from langchain import PromptTemplate
from langchain.chains.summarize import load_summarize_chain

load_dotenv()

# reddit = praw.Reddit(client_id='5m80-fvDDHGNcJG82XPcbw',
#                      client_secret='4-nYZJ8m6MEU5LEpn3IXreyF66eoIw',
#                      user_agent='laptop:llm-digest:v0.1 (by u/JohnyWalkerRed)')

reddit = asyncpraw.Reddit(
    client_id="5m80-fvDDHGNcJG82XPcbw",
    client_secret="4-nYZJ8m6MEU5LEpn3IXreyF66eoIw",
    user_agent="laptop:llm-digest:v0.1 (by u/JohnyWalkerRed)"
)

class SubredditRequest(BaseModel):
    subreddit: str

# def fake_answer_to_everything_ml_model(x: float):
#     return x * 42

# ml_models = {}

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Load the ML model
#     ml_models["answer_to_everything"] = fake_answer_to_everything_ml_model
#     yield
#     # Clean up the ML models and release the resources
#     ml_models.clear()

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "standard": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"},
    },
    "handlers": {
        "default": {
            "level": "INFO",
            "formatter": "standard",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",  # Default is stderr
        },
    },
    "loggers": {
        "": {  # root logger
            "level": "INFO",
            "handlers": ["default"],
            "propagate": False,
        },
        "uvicorn.error": {
            "level": "DEBUG",
            "handlers": ["default"],
        },
        "uvicorn.access": {
            "level": "DEBUG",
            "handlers": ["default"],
        },
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)
app = FastAPI(debug=True)

@app.post("/say-hello")
async def say_hello():
    try:
        r = requests.post("http://localhost:11434/api/generate", 
                          json={"model": "gemma:7b",
                                "prompt": "Say Hello",
                                "stream": False,
                                "options": {
                                    "num_keep": 5,
                                    "seed": 42,
                                    "num_predict": 100,
                                    "top_k": 20,
                                    "top_p": 0.9
                                }
                                })
        return json.loads(r.content.decode("utf-8"))["response"]
    except Exception as e:
        logging.log(msg="error calling gemma", level=0)



@app.post("/get-top-posts")
async def get_top_posts(request: SubredditRequest):
    logging.info("getting top posts")
    try:
        subreddit = await reddit.subreddit(request.subreddit)
        logging.info(subreddit)
        top_posts_queue = []
        async for submission in subreddit.hot(limit=10):
            top_posts_queue.append({
                "title": submission.title,
                "id": submission.id,
                "url": submission.url,
                "score": submission.score
            })
        return top_posts_queue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/get-comments-and-summarize/{submission_id}")
async def get_comments_and_summarize(submission_id: str):
    submission = await reddit.submission(id=submission_id)
    comments = await submission.comments()
    await comments.replace_more(limit=0)
    comment_bodies = []
    comment_queue = comments[:]  # Seed with top-level
    for c in comment_queue:
        c.body = "\nroot: " + c.body
    
    while comment_queue:
        comment = comment_queue.pop(0)
        reply_comments = comment.replies
        for r in reply_comments:
            r.body = "\t" + r.body    
        comment_queue[0:0] = reply_comments
        comment_bodies.append(comment.body)
    
    comment_article = "\n".join(comment_bodies)
    text_splitter = CharacterTextSplitter(
        separator="root:",
        chunk_size=1000,
        chunk_overlap=0,
        length_function=len,
        is_separator_regex=False,
    )

    root_comment_splits = text_splitter.create_documents([comment_article])
    ollama = Ollama(base_url='http://localhost:11434', model="gemma:7b")
    map_prompt_template = """
                        Write a summary of this chunk of text that includes the main points and any important details.
                        {text}
                        """

    map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])

    combine_prompt_template = """
                        Write a concise summary of the following text delimited by triple backquotes.
                        Return your response in bullet points which covers the key points of the text.
                        ```{text}```
                        BULLET POINT SUMMARY:
                        """

    combine_prompt = PromptTemplate(
        template=combine_prompt_template, input_variables=["text"]
    )

    map_reduce_chain = load_summarize_chain(
        ollama,
        chain_type="map_reduce",
        map_prompt=map_prompt,
        combine_prompt=combine_prompt,
        return_intermediate_steps=True,
    )
    logging.info("Writing summary...")
    map_reduce_outputs = map_reduce_chain({"input_documents": root_comment_splits})
    
    # summary = stuff_context_summarize(f"{submission_id}_comments.txt")
    logging.info("Summary done")
    return {"summary": map_reduce_outputs["intermediate_steps"]}