import os
import re
import json
from langchain.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()
# Mistral setup
if "MISTRAL_API_KEY" not in os.environ:
    raise RuntimeError("MISTRAL_API_KEY not found in environment. Please set it in your .env file.")

llm = ChatMistralAI(
    model="mistral-medium-latest",
    temperature=0,
    max_retries=4,
)



# Read activity keywords from file and split in half
with open(os.path.join(os.path.dirname(__file__), 'activity_keywords.txt'), 'r', encoding='utf-8') as f:
    activity_keywords = f.read().strip()
split_idx = len(activity_keywords) // 2
activity_keywords_1 = activity_keywords[:split_idx]
activity_keywords_2 = activity_keywords[split_idx:]


# New prompt: instruct model to wait for second message before answering
messages = [
    (
        "system",
        f"You will receive the standard in two parts. Do not answer until you have received both. Here is PART 1 of the standard: {activity_keywords_1}"
    ),
    ("system", f"Here is PART 2 of the standard: {{activity_keywords_2}}. Now, based on the provided construction activity, find the chunks from the above standard. Search the entire document to confirm exactly where the provided works are listed in most Italian Prezzari Regionali or similar catalogs. Find and return all matching chunks. Return only a valid JSON object with key structure it: array of objects with Main Category, Category, Description, en: array of objects with Main Category, Category, Description translated. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. The work information is following: {{input}}")
]

def find_categories(query: str) -> str:
    # Compose the two-step message sequence
    # 1. Send PART 1 as system message
    # 2. Send PART 2 as system message, then user input
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You will receive the standard in two parts. Do not answer until you have received both. Here is PART 1 of the standard: {activity_keywords_1}"),
        ("system", f"Here is PART 2 of the standard: {activity_keywords_2}. Now, based on the provided construction activity, find the chunks from the above standard. Search the entire document to confirm exactly where the provided works are listed in most Italian Prezzari Regionali or similar catalogs. Find and return all matching chunks. Return only a valid JSON object with key structure it: array of objects with Main Category, Category, Description, en: array of objects with Main Category, Category, Description translated. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. The work information is following: {{input}}"),
        ("human", query)
    ])
    chain = prompt | llm
    response = chain.invoke({"input": query})
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

    # (Old duplicate removed; new definition above is correct)

