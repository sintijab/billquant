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
        f"Based on the provided site visit notes, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site work planning in right order and timeline of construction standard, you should prepare object in JSON format with site Works- you must list all the neccesary construction works for the site in correct Timeline with the reference to the Area, Subarea it applies to, Unit, Quantity, and then add second object key Missing- describe what information is missing from provided details and describe what is needed for the quotation including the key Severity High, Medium or Low, keys Area and Subarea it relates to. The site visit information is following:",
    ),
    ("human", "{input}"),
]
prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def answer_question(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

