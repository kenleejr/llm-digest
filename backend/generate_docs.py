import praw
import os
from openai import OpenAI

# Initialize the PRAW Reddit instance
reddit = praw.Reddit(client_id='5m80-fvDDHGNcJG82XPcbw',
                     client_secret='4-nYZJ8m6MEU5LEpn3IXreyF66eoIw',
                     user_agent='laptop:llm-digest:v0.1 (by u/JohnyWalkerRed)')

def write_comments_to_file(comment, file, depth=0,  limit=100, count=[0]):
    # Check if we have reached the limit of comments to process.
    if count[0] >= limit:
        return
    
    # Write the user id and comment body to the file with indentation to show depth
    author_id = comment.author.id if comment.author else "deleted"
    file.write("  " * depth + f"User ID: {author_id}\n" + "  " * depth + comment.body + "\n\n")
    count[0] += 1  # Increment the count of comments processed
    if hasattr(comment, 'replies'):
        for reply in comment.replies:
            write_comments_to_file(reply, file, depth + 1, limit, count)

def fetch_comments_and_write_to_file(submission, file, limit=100):
    submission.comments.replace_more(limit=0) # This line ensures you get all comments, not just the more_comments objects
    top_count = 0
    for comment in submission.comments.list():
        if top_count >= limit:
            break
        write_comments_to_file(comment, file, limit=limit, count=[top_count])
        top_count += 1


def main():
    # Fetch the top submissions
    top_submissions = reddit.subreddit('philosophy').hot(limit=5)
    for idx, submission in enumerate(top_submissions):
        if idx > 1:
            # Create a text file for each submission
            filename = f"{submission.id}_comments.txt"
            with open(filename, 'w') as file:
                # Write submission title, selftext, and submission author's user id at the beginning of the file
                submission_author_id = submission.author.id if submission.author else "deleted"
                file.write(f"Title: {submission.title}\nAuthor ID: {submission_author_id}\n\n{submission.selftext}\n\n")
                fetch_comments_and_write_to_file(submission, file)

            print(f"Conversations for submission '{submission.title}' written to {filename}")

        # file = client.files.create(
        #     file=open(f"/Users/kenleejr/repos/llm-digest/{filename}", "rb"),
        #     purpose='assistants'
        # )

if __name__ == "__main__":
    main()

    
