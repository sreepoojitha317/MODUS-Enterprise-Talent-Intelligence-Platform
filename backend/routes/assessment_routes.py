from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.ai_service import evaluate_answer
from backend.database import supabase


router = APIRouter()


# =========================================================
# REQUEST MODEL - ANSWER EVALUATION
# =========================================================

class AnswerEvaluationRequest(BaseModel):

    question: str

    category: str

    answer: str

    resume_text: str = ""


# =========================================================
# EVALUATE ANSWER
# =========================================================

@router.post("/evaluate-answer")
async def evaluate_candidate_answer(
    request: AnswerEvaluationRequest
):

    if not request.question.strip():

        raise HTTPException(
            status_code=400,
            detail="Question is required."
        )

    if not request.category.strip():

        raise HTTPException(
            status_code=400,
            detail="Competency category is required."
        )

    if not request.answer.strip():

        raise HTTPException(
            status_code=400,
            detail="Candidate answer is required."
        )

    try:

        result = evaluate_answer(

            question=request.question,

            category=request.category,

            answer=request.answer,

            resume_text=request.resume_text

        )

        return {

            "success": True,

            "evaluation": result

        }

    except Exception as error:

        print(
            "AI evaluation error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to evaluate the answer. "
                "Please try again."
            )

        )


# =========================================================
# FINAL ASSESSMENT REQUEST
# =========================================================

class FinalAssessmentRequest(BaseModel):

    responses: list

    # IMPORTANT:
    # Supabase attempts.user_id is NOT NULL.
    # Frontend will send the logged-in user's ID.
    user_id: str


# =========================================================
# CALCULATE FINAL SCORE + SAVE ASSESSMENT
# =========================================================

@router.post("/calculate-score")
async def calculate_assessment_score(
    request: FinalAssessmentRequest
):

    if not request.responses:

        raise HTTPException(
            status_code=400,
            detail="No assessment responses found."
        )

    if not request.user_id.strip():

        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    try:

        # =================================================
        # COLLECT RESPONSE SCORES
        # =================================================

        scores = []

        for response in request.responses:

            score = response.get(
                "score",
                0
            )

            try:

                score = float(score)

            except (TypeError, ValueError):

                score = 0

            scores.append(score)


        # =================================================
        # AVERAGE SCORE
        # =================================================

        average_score = (

            sum(scores) / len(scores)

            if scores

            else 0

        )


        # =================================================
        # CCI
        # =================================================

        cci = round(
            average_score,
            2
        )


        # =================================================
        # CONFIDENCE
        # =================================================

        confidence_scores = []

        for response in request.responses:

            confidence = response.get(
                "confidence",
                0
            )

            try:

                confidence = float(
                    confidence
                )

            except (TypeError, ValueError):

                confidence = 0

            confidence_scores.append(
                confidence
            )


        average_confidence = (

            sum(confidence_scores)
            / len(confidence_scores)

            if confidence_scores

            else 0

        )


        # =================================================
        # CPI
        # =================================================

        cpi = round(

            min(
                100,
                (
                    average_score * 0.70
                    +
                    average_confidence * 0.30
                )
            ),

            2

        )


        # =================================================
        # EVIDENCE CONFIDENCE
        # =================================================

        evidence_confidence = round(

            average_confidence,

            2

        )


        # =================================================
        # CRI
        # =================================================

        cri = round(

            (
                cci * 0.45
                +
                cpi * 0.20
                +
                evidence_confidence * 0.35
            ),

            2

        )


        # =================================================
        # FINDINGS
        # =================================================

        strengths = []

        development_gaps = []


        for response in request.responses:

            score = response.get(
                "score",
                0
            )

            category = response.get(
                "category",
                "General"
            )

            try:

                score = float(score)

            except (TypeError, ValueError):

                score = 0


            if score >= 75:

                strengths.append(

                    f"Demonstrates good capability "
                    f"in {category}."

                )

            elif score < 60:

                development_gaps.append(

                    f"Strengthen capability in "
                    f"{category} through more structured "
                    f"and evidence-based responses."

                )


        # =================================================
        # REMOVE DUPLICATES
        # =================================================

        strengths = list(

            dict.fromkeys(
                strengths
            )

        )

        development_gaps = list(

            dict.fromkeys(
                development_gaps
            )

        )


        # =================================================
        # DEFAULT FINDINGS
        # =================================================

        if not strengths:

            strengths = [

                "Demonstrates willingness to apply "
                "knowledge to practical problems.",

                "Shows developing problem-solving capability."

            ]


        if not development_gaps:

            development_gaps = [

                "Continue strengthening structured "
                "consulting and evidence-based reasoning.",

                "Improve communication of measurable "
                "outcomes and business impact."

            ]


        strengths = strengths[:5]

        development_gaps = development_gaps[:5]


        # =================================================
        # RECOMMENDATION
        # =================================================

        if cci >= 85:

            recommendation = (

                "Candidate demonstrates strong current "
                "capability and is well positioned for "
                "consulting-oriented work. Continued "
                "development should focus on business "
                "impact, executive communication and "
                "advanced problem solving."

            )

        elif cci >= 70:

            recommendation = (

                "Candidate demonstrates promising "
                "consulting capability with several areas "
                "that can be strengthened through targeted "
                "practice, structured problem solving and "
                "stronger evidence communication."

            )

        elif cci >= 50:

            recommendation = (

                "Candidate demonstrates developing "
                "capability. Focused development in "
                "structured problem solving, consulting "
                "reasoning and evidence-based communication "
                "is recommended."

            )

        else:

            recommendation = (

                "Candidate should focus on building "
                "foundational consulting capabilities, "
                "structured reasoning and stronger "
                "evidence-based responses before progressing "
                "to advanced client-facing responsibilities."

            )


        # =================================================
        # SUPABASE CONFIGURATION
        # =================================================

        assessment_id = (

            "87f946cf-64bf-42ee-95fd-9c216cddfd82"

        )


        # =================================================
        # CREATE ASSESSMENT ATTEMPT
        # =================================================

        current_time = datetime.now(
            timezone.utc
        ).isoformat()


        attempt_result = (

            supabase
            .table("attempts")
            .insert({

                # IMPORTANT:
                # This was missing earlier.
                # attempts.user_id is NOT NULL.
                "user_id":
                    request.user_id,

                "assessment_id":
                    assessment_id,

                "status":
                    "completed",

                "started_at":
                    current_time,

                "completed_at":
                    current_time

            })
            .execute()

        )


        if not attempt_result.data:

            raise Exception(
                "Unable to create assessment attempt."
            )


        attempt = attempt_result.data[0]

        attempt_id = attempt.get("id")


        if not attempt_id:

            raise Exception(
                "Assessment attempt ID was not returned."
            )


        print(
            "Assessment attempt created:",
            attempt_id
        )


        # =================================================
        # SAVE RESPONSES
        # =================================================

        saved_responses = 0

        for response in request.responses:

            question_text = response.get(
                "question",
                ""
            )

            answer = response.get(
                "answer",
                ""
            )

            score = response.get(
                "score",
                0
            )

            try:

                score = float(score)

            except (TypeError, ValueError):

                score = 0


            # -------------------------------------------------
            # FIND QUESTION ID
            # -------------------------------------------------

            question_result = (

                supabase
                .table("questions")
                .select("id")
                .eq(
                    "assessment_id",
                    assessment_id
                )
                .eq(
                    "question_text",
                    question_text
                )
                .limit(1)
                .execute()

            )


            question_id = None


            if question_result.data:

                question_id = (
                    question_result.data[0]["id"]
                )


            # -------------------------------------------------
            # QUESTION NOT FOUND
            # -------------------------------------------------

            if not question_id:

                print(
                    "Question not found in Supabase:",
                    question_text
                )

                continue


            # -------------------------------------------------
            # CHECK IF RESPONSE ALREADY EXISTS
            # -------------------------------------------------

            existing_response = (

                supabase
                .table("responses")
                .select("id")
                .eq(
                    "attempt_id",
                    attempt_id
                )
                .eq(
                    "question_id",
                    question_id
                )
                .limit(1)
                .execute()

            )


            # -------------------------------------------------
            # SKIP DUPLICATE RESPONSE
            # -------------------------------------------------

            if existing_response.data:

                print(
                    "Duplicate response skipped:",
                    question_text
                )

                continue


            # -------------------------------------------------
            # SAVE RESPONSE
            # -------------------------------------------------

            response_result = (

                supabase
                .table("responses")
                .insert({

                    "attempt_id":
                        attempt_id,

                    "question_id":
                        question_id,

                    "answer":
                        answer,

                    "score":
                        score

                })
                .execute()

            )


            if response_result.data:

                saved_responses += 1


        print(
            f"Saved {saved_responses} response(s)."
        )

        # =================================================
        # SAVE COMPETENCY SCORES
        # =================================================

        competency_scores = {}


        for response in request.responses:

            category = response.get(
                "category",
                "General"
            )

            score = response.get(
                "score",
                0
            )

            confidence = response.get(
                "confidence",
                0
            )


            try:

                score = float(score)

            except (TypeError, ValueError):

                score = 0


            try:

                confidence = float(
                    confidence
                )

            except (TypeError, ValueError):

                confidence = 0


            if category not in competency_scores:

                competency_scores[category] = {

                    "scores": [],

                    "confidence": []

                }


            competency_scores[
                category
            ]["scores"].append(
                score
            )


            competency_scores[
                category
            ]["confidence"].append(
                confidence
            )


        # =================================================
        # INSERT COMPETENCY SCORES
        # =================================================

        for competency, values in competency_scores.items():

            competency_score = (

                sum(values["scores"])
                /
                len(values["scores"])

            )


            competency_confidence = (

                sum(values["confidence"])
                /
                len(values["confidence"])

            )


            score_result = (

                supabase
                .table("scores")
                .insert({

                    "attempt_id":
                        attempt_id,

                    "competency":
                        competency,

                    "score":
                        round(
                            competency_score,
                            2
                        ),

                    "evidence_confidence":
                        round(
                            competency_confidence,
                            2
                        )

                })
                .execute()

            )


            print(

                "Competency score saved:",

                competency,

                score_result.data

            )


        # =================================================
        # SAVE FINAL REPORT
        # =================================================

        report_result = (

            supabase
            .table("reports")
            .insert({

                "attempt_id":
                    attempt_id,

                "cci":
                    cci,

                "cpi":
                    cpi,

                "cri":
                    cri,

                "evidence_confidence":
                    evidence_confidence,

                "strengths":
                    strengths,

                "development_gaps":
                    development_gaps,

                "recommendation":
                    recommendation

            })
            .execute()

        )


        if not report_result.data:

            raise Exception(
                "Final report could not be saved."
            )


        print(
            "Final assessment report saved:",
            report_result.data
        )


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "success": True,

            "scores": {

                "cci":
                    cci,

                "cpi":
                    cpi,

                "cri":
                    cri,

                "evidence_confidence":
                    evidence_confidence

            },

            "findings": {

                "strengths":
                    strengths,

                "development_gaps":
                    development_gaps,

                "recommendation":
                    recommendation

            },

            "responses":
                request.responses,

            "attempt_id":
                attempt_id

        }


    except Exception as error:

        print(
            "Scoring / database error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to calculate and save "
                "assessment results."
            )

        )

# =========================================================
# ASSESSMENT HISTORY
# =========================================================

@router.get("/assessment-history/{user_id}")
async def get_assessment_history(user_id: str):

    if not user_id.strip():

        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    try:

        # =================================================
        # GET COMPLETED ATTEMPTS
        # =================================================

        attempts_result = (
            supabase
            .table("attempts")
            .select(
                "id, assessment_id, status, "
                "started_at, completed_at"
            )
            .eq(
                "user_id",
                user_id
            )
            .eq(
                "status",
                "completed"
            )
            .order(
                "completed_at",
                desc=True
            )
            .execute()
        )

        attempts = attempts_result.data or []

        history = []

        # =================================================
        # GET REPORT FOR EACH ATTEMPT
        # =================================================

        for attempt in attempts:

            attempt_id = attempt.get("id")

            if not attempt_id:
                continue

            report_result = (
                supabase
                .table("reports")
                .select(
                    "cci, cpi, cri, evidence_confidence"
                )
                .eq(
                    "attempt_id",
                    attempt_id
                )
                .limit(1)
                .execute()
            )

            report = (
                report_result.data[0]
                if report_result.data
                else None
            )

            history.append({

                "attempt_id":
                    attempt_id,

                "assessment_id":
                    attempt.get("assessment_id"),

                "status":
                    attempt.get("status"),

                "started_at":
                    attempt.get("started_at"),

                "completed_at":
                    attempt.get("completed_at"),

                "cci":
                    report.get("cci")
                    if report
                    else None,

                "cpi":
                    report.get("cpi")
                    if report
                    else None,

                "cri":
                    report.get("cri")
                    if report
                    else None,

                "evidence_confidence":
                    report.get(
                        "evidence_confidence"
                    )
                    if report
                    else None

            })

        # =================================================
        # RETURN HISTORY
        # =================================================

        return {

            "success": True,

            "count":
                len(history),

            "history":
                history

        }

    except Exception as error:

        print(
            "Assessment history error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to load assessment history."
            )

        )

# =========================================================
# GET RESULT FOR A SPECIFIC ASSESSMENT ATTEMPT
# =========================================================

@router.get("/assessment-result/{attempt_id}")
async def get_assessment_result(
    attempt_id: str,
    user_id: str
):

    if not attempt_id.strip():

        raise HTTPException(
            status_code=400,
            detail="Attempt ID is required."
        )

    if not user_id.strip():

        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    try:

        # =================================================
        # VERIFY ATTEMPT BELONGS TO USER
        # =================================================

        attempt_result = (
            supabase
            .table("attempts")
            .select(
                "id, user_id, assessment_id, "
                "status, started_at, completed_at"
            )
            .eq(
                "id",
                attempt_id
            )
            .eq(
                "user_id",
                user_id
            )
            .limit(1)
            .execute()
        )

        if not attempt_result.data:

            raise HTTPException(
                status_code=404,
                detail="Assessment attempt not found."
            )

        attempt = attempt_result.data[0]

        # =================================================
        # GET REPORT
        # =================================================

        report_result = (
            supabase
            .table("reports")
            .select(
                "cci, cpi, cri, evidence_confidence, "
                "strengths, development_gaps, "
                "recommendation"
            )
            .eq(
                "attempt_id",
                attempt_id
            )
            .limit(1)
            .execute()
        )

        if not report_result.data:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No final result is available "
                    "for this assessment attempt."
                )
            )

        report = report_result.data[0]

        # =================================================
        # GET COMPETENCY SCORES
        # =================================================

        scores_result = (
            supabase
            .table("scores")
            .select(
                "competency, score, evidence_confidence"
            )
            .eq(
                "attempt_id",
                attempt_id
            )
            .execute()
        )

        competency_scores = (
            scores_result.data or []
        )

        # =================================================
        # RETURN RESULT
        # =================================================

        return {

            "success": True,

            "attempt": {

                "attempt_id":
                    attempt.get("id"),

                "assessment_id":
                    attempt.get("assessment_id"),

                "status":
                    attempt.get("status"),

                "started_at":
                    attempt.get("started_at"),

                "completed_at":
                    attempt.get("completed_at")

            },

            "scores": {

                "cci":
                    report.get("cci"),

                "cpi":
                    report.get("cpi"),

                "cri":
                    report.get("cri"),

                "evidence_confidence":
                    report.get(
                        "evidence_confidence"
                    )

            },

            "findings": {

                "strengths":
                    report.get(
                        "strengths"
                    ) or [],

                "development_gaps":
                    report.get(
                        "development_gaps"
                    ) or [],

                "recommendation":
                    report.get(
                        "recommendation"
                    ) or ""

            },

            "competency_scores":
                competency_scores

        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Specific assessment result error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to load assessment result."
            )

        )    