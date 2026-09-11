import os
import json

from dotenv import load_dotenv
from groq import Groq


# ---------------------------------------------------------
# LOAD ENVIRONMENT
# ---------------------------------------------------------

load_dotenv()


GROQ_API_KEY = os.getenv("GROQ_API_KEY")


if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured in .env"
    )


# ---------------------------------------------------------
# GROQ CLIENT
# ---------------------------------------------------------

client = Groq(
    api_key=GROQ_API_KEY
)


MODEL_NAME = "openai/gpt-oss-120b"


# ---------------------------------------------------------
# EVALUATE ANSWER
# ---------------------------------------------------------

def evaluate_answer(
    question: str,
    category: str,
    answer: str,
    resume_text: str = ""
):

    system_prompt = """
You are the AI evaluator for the METI Management Consulting
Assessment Platform.

Your task is to evaluate the candidate's answer against the
specific competency being assessed.

Evaluate the candidate primarily from the evidence in the answer.
The resume may be used only to understand context and verify whether
the candidate's described experience is plausible.

IMPORTANT:

Do NOT require a perfect consulting-style answer.

Candidates may describe academic projects, internships, technical
projects, business problems, analysis work, or practical experience.

Give credit when the candidate clearly explains:
- what the situation/problem was
- what they personally did
- how they approached it
- tools or methods used
- what happened as a result
- what they learned or would improve

A response can be considered strong even if it does not contain a
precise numerical business metric.

---------------------------------------------------------
SCORING
---------------------------------------------------------

The score MUST be an integer from 0 to 100.

Use this scale:

0-29   = very weak / almost no useful evidence
30-49  = weak / vague evidence
50-69  = moderate / usable evidence
70-84  = good / clear practical evidence
85-100 = strong / specific and well-supported evidence

Do NOT unnecessarily penalize a candidate for missing one element.

---------------------------------------------------------
ADAPTIVE DECISION RULE
---------------------------------------------------------

IMPORTANT:

The purpose of adaptive assessment is to avoid unnecessary
follow-up questions.

If the answer gives reasonably clear and usable evidence,
decision MUST be "next".

Use decision = "next" when:
- the answer is specific enough to understand the candidate's approach
- the candidate explains what they did
- practical/project/academic evidence is present
- the answer demonstrates reasonable understanding
- the answer is good enough to score reliably

Use decision = "follow_up" ONLY when the answer is genuinely
insufficient to evaluate the competency, such as:
- extremely vague response
- mostly generic theory with no example
- no clear action taken by the candidate
- contradictory or unclear response
- insufficient information to determine capability

DO NOT create a follow-up merely because:
- there is no numerical metric
- the answer could contain more detail
- the answer is not perfect
- the answer is shorter than an ideal consulting interview answer
- one minor evidence element is missing

If the answer is good enough to evaluate, ALWAYS choose "next".

For a strong or good answer:
decision = "next"
follow_up_question = null

For a genuinely insufficient answer:
decision = "follow_up"
create ONE focused follow-up question.

The follow-up must target the most important missing evidence.
Do not repeat the original question.

---------------------------------------------------------
STABILITY
---------------------------------------------------------

Use:

"strong" when evidence is clear and specific.

"moderate" when evidence is usable but has some limitations.

"weak" only when evidence is genuinely insufficient.

A moderate answer can still have:
decision = "next"

---------------------------------------------------------
OUTPUT
---------------------------------------------------------

Return ONLY the requested JSON structure.
"""


    user_prompt = f"""
COMPETENCY:
{category}

QUESTION:
{question}

CANDIDATE RESUME / PROFILE EVIDENCE:
{resume_text[:12000]}

CANDIDATE ANSWER:
{answer}

Evaluate this answer fairly.

Remember:
If the answer provides usable practical evidence, prefer
decision = "next".

Only use follow_up when the answer is genuinely insufficient
to evaluate the competency.
"""


    response = client.chat.completions.create(

        model=MODEL_NAME,

        messages=[

            {
                "role": "system",
                "content": system_prompt
            },

            {
                "role": "user",
                "content": user_prompt
            }

        ],

        temperature=0.2,

        response_format={
            "type": "json_schema",
            "json_schema": {

                "name": "assessment_evaluation",

                "strict": True,

                "schema": {

                    "type": "object",

                    "properties": {

                        "score": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 100
                        },

                        "confidence": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 100
                        },

                        "stability": {
                            "type": "string",
                            "enum": [
                                "strong",
                                "moderate",
                                "weak"
                            ]
                        },

                        "decision": {
                            "type": "string",
                            "enum": [
                                "next",
                                "follow_up"
                            ]
                        },

                        "feedback": {
                            "type": "string"
                        },

                        "evidence_summary": {
                            "type": "string"
                        },

                        "follow_up_question": {
                            "type": [
                                "string",
                                "null"
                            ]
                        }

                    },

                    "required": [
                        "score",
                        "confidence",
                        "stability",
                        "decision",
                        "feedback",
                        "evidence_summary",
                        "follow_up_question"
                    ],

                    "additionalProperties": False

                }

            }

        }

    )


    raw_content = response.choices[0].message.content

    result = json.loads(raw_content)

    return result