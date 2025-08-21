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
    model="mistral-small-latest",
    temperature=0,
    max_retries=2,
)


# Read activity keywords from file
with open(os.path.join(os.path.dirname(__file__), 'activity_keywords.txt'), 'r', encoding='utf-8') as f:
    activity_keywords = f.read().strip()

messages = [
    (
        "system",
        f"Based on the provided construction activity, return only a valid JSON object with key structure it: array of objects with Main Category, Category, Description, en: array of objects with Main Category, Category, Description translated. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Find the chunks from the following standard: {activity_keywords}. Search the entire document for keywords and categories to confirm exactly where the provided works are listed In most Italian Prezzari Regionali or similar catalogs. Find and return all matching chunks. The work information is following:",
    ),
    ("human", "{input}"),
]
prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def find_categories(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

