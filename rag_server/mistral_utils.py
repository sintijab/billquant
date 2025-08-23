import os
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
        f"Based on the provided site visit notes, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site work planning in right order of construction timeline, you should prepare object in JSON format finding all site works from list of construction standard and return in the list with the key Works- you must list all the neccesary construction works for the site in the correct order according to the construction standard, add key Timeline which explains the reason of the work order, add keys for the reference to the Area, Subarea and Item it applies to, Unit, Quantity, and then add second object key Missing- describe what information is missing from provided details and describe what is needed for the quotation that has only high impact on costs only with key Missing, add key Severity High, Medium or Low, keys Area and Subarea it relates to, and Risks with explaining why plannning is affected and by how many days, costs or other risks associated, and key Suggestions what information to add to resove it. Add GeneralTimeline object with type of Activities in the right order of construction and two keys Starting and Finishing for each that represents number of days how much each activity will take and plan it in the same days when possible. The site visit information is following:",
    ),
    ("human", "{input}"),
]
prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def answer_question(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
        # Model loading logic can be added here if needed
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

