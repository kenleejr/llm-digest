from openai import OpenAI

client = OpenAI()


def stuff_context_summarize(filename):
    with open(filename, 'r') as file:
        text_content = file.read()
    response = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {"role": "system", "content": "You are a journalist who is great at synthesizing points across social media interactions into a cohesive narrative."},
            {"role": "user", "content": f"Please summarize and analyze this Reddit post. Remove all user ids and extract main themes into an article-style format: {text_content}"}
        ]
    )
    summary = response.choices[0].message.content
    return summary


if __name__ == "__main__":
    INPUT_DOC_PATH = '/Users/kenleejr/repos/llm-digest/1aeluf4.txt'
    # Read the text back from the file
    with open(INPUT_DOC_PATH, 'r') as file:
        text_content = file.read()

    summary = stuff_context_summarize(text_content)

    input_doc_name = INPUT_DOC_PATH.split("/")[-1].split(".")[0]
    with open(f'/Users/kenleejr/repos/llm-digest/{input_doc_name}-summary.txt', 'w+') as file:
        file.write(summary)