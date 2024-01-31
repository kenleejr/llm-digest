from openai import OpenAI

client = OpenAI()

assistant = client.beta.assistants.create(
  name="Reddit Summarizer",
  description="You are a social media tech journalist and are excellent at spotting trends and identifying themes across Reddit, Twitter, etc.",
  model="gpt-4-1106-preview",
  tools=[{"type": "retrieval"}],
  file_ids=["file-QkUR7Z51zY8mopKXFaEneA1F"]
)