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
        f"Based on the provided Bill of Quantities, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site work planning from provided Bill of Quantities in right order of construction timeline, you should prepare object in JSON format finding all site works from list and return in the list with the key Works- you must list all the neccesary construction works for the site in the correct order according to the construction standard, add key Timeline which explains the reason of the work order, add keys for the reference of Unit, Quantity that is calculated dimensions or quantity, make sure Unit corresponds it. Add GeneralTimeline object with type of Activities, with main Activity in the right order of construction Works and two keys Starting and Finishing for each that represents number of days how much each activity will take and plan it in the same days when possible. The bill of quantities information is following:",
    ),
    ("human", "{input}"),
]
prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def answer_question_boq(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
        # Model loading logic can be added here if needed
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

