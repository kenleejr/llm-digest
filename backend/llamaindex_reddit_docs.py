import praw
from llama_index import Document
from llama_index.schema import TextNode, NodeRelationship, RelatedNodeInfo
from llama_index.indices.tree import GPTTreeIndex
from llama_index.indices.document_summary import DocumentSummaryIndex
from llama_index import PromptTemplate, ServiceContext
from llama_index.llms import OpenAI
from llama_index.callbacks import CallbackManager, WandbCallbackHandler

import logging
import sys

sys.setrecursionlimit(2000)

# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
# logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))
wandb_args = {"project":"llm-digest"}
wandb_callback = WandbCallbackHandler(run_args=wandb_args)
callback_manager = CallbackManager([wandb_callback])


# Initialize the PRAW Reddit instance
reddit = praw.Reddit(client_id='5m80-fvDDHGNcJG82XPcbw',
                     client_secret='4-nYZJ8m6MEU5LEpn3IXreyF66eoIw',
                     user_agent='laptop:llm-digest:v0.1 (by u/JohnyWalkerRed)')

def fetch_comments(comment, parent_node: TextNode = None):
    node = TextNode(text=comment.body, id_=str(comment.id))
    nodes = [node]

    # Set relationship if there's a parent_node
    if parent_node:
        node.relationships[NodeRelationship.PARENT] = RelatedNodeInfo(node_id=parent_node.node_id)
        parent_node.relationships[NodeRelationship.CHILD] = RelatedNodeInfo(node_id=node.node_id)

    if hasattr(comment, 'replies'):
        for reply in comment.replies:
            nodes.extend(fetch_comments(reply, node))

    return nodes

def top_comments_and_subcomments(submission, submission_node):
    comments = submission.comments
    all_nodes = []
    for comment in comments:
        if len(all_nodes) < 5:  # Only get 5 top-level comments
            all_nodes.extend(fetch_comments(comment, submission_node))
    # designate the source of all documents as the submission_node
    for node in all_nodes:
        node.relationships[NodeRelationship.SOURCE] = RelatedNodeInfo(node_id=submission_node.node_id)
    return all_nodes

def main():
    # Fetch the top 5 submissions
    top_submissions = reddit.subreddit('machinelearning').hot(limit=2)

    all_text_nodes = []

    for submission in top_submissions:
        submission_node = TextNode(text=f"{submission.title}\n{submission.selftext}")
        submission_node.relationships[NodeRelationship.SOURCE] = RelatedNodeInfo(node_id=submission_node.node_id)
        all_text_nodes.append(submission_node)

        nodes = top_comments_and_subcomments(submission, submission_node)
        all_text_nodes.extend(nodes)

        # Now, all_text_nodes contains TextNodes with parent-child relationships for top 10 posts
        for node in all_text_nodes:
            print(node, node.relationships, node.ref_doc_id)

        summary_template = PromptTemplate("Summarize this exchange and come up with some key insights:")
        tree_index = DocumentSummaryIndex(nodes=all_text_nodes, summary_template=summary_template)

        service_context = ServiceContext.from_defaults(llm=OpenAI(), callback_manager=callback_manager)
        query_engine = tree_index.as_query_engine(llm=service_context, response_mode="tree_summarize")
        response = query_engine.query("What is the summary of this conversational exchange?")
        print(response)

if __name__ == "__main__":
    main()
