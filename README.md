
  # METI — Management Consulting Assessment Platform

METI is an AI-assisted management consulting assessment platform designed to evaluate a candidate's problem-solving, analytical thinking, communication, decision-making, and consulting-related capabilities.

Instead of giving only a single score, METI collects the candidate's profile and resume, asks competency-based questions, evaluates each answer using AI, measures the strength of the supporting evidence, and generates a structured assessment report.

The main goal is to make candidate assessment more structured, evidence-based, and easier to understand.

---

## What METI Does

METI provides an end-to-end assessment flow:

1. Candidate registration and login
2. Consent for data usage and AI-assisted evaluation
3. Candidate profile creation
4. Resume/CV upload and text extraction
5. Profile-based assessment personalization
6. Competency-based assessment questions
7. AI evaluation of candidate answers
8. Adaptive follow-up questions when an answer is insufficient
9. Multi-dimensional scoring
10. Competency-level performance analysis
11. Assessment history
12. Interactive result dashboard
13. Automated PDF assessment report generation

---

## How the Assessment Works

The candidate first creates an account and provides basic professional information such as:

* Full name
* Email
* Education
* Experience
* LinkedIn profile
* GitHub / portfolio
* Resume/CV

The uploaded PDF resume is processed by the backend and its text is extracted using `pypdf`.

The profile and resume information are then used to personalize the assessment and prioritize relevant competencies.

For example, relevant experience in areas such as:

* Data
* Python
* SQL
* Machine Learning
* Analytics
* AI
* Software
* Projects
* Internships

can be used as supporting evidence during the assessment.

---

## Competencies Evaluated

METI currently evaluates 10 competency areas:

* Strategy & Enterprise Thinking
* Research & Insight
* Value Chain & Enterprise Analysis
* Problem Structuring & Commercial Thinking
* Process & Capability
* Transformation & Change
* Organisation & Governance
* Executive Communication
* Stakeholder & Facilitation
* Professional Judgement

These competencies are designed to understand how a candidate approaches real-world problems, rather than focusing only on technical knowledge.

---

## AI-Powered Answer Evaluation

Each candidate answer is sent to the FastAPI backend and evaluated using an AI model through Groq.

The AI mainly evaluates the evidence provided in the candidate's response.

It considers factors such as:

* Understanding of the problem
* What the candidate personally did
* Problem-solving approach
* Tools or methods used
* Practical or project evidence
* Outcome or result
* Learning and improvement
* Clarity and relevance

Academic projects, internships, technical projects, analysis work, and practical experiences can also be used as evidence.

---

## Adaptive Assessment

METI includes an adaptive follow-up mechanism.

After evaluating an answer, the AI determines whether:

* The answer contains enough evidence to continue, or
* A follow-up question is required

A follow-up question is generated only when the available answer is not sufficient to evaluate the competency properly.

The system allows a maximum of one follow-up question for each main question.

This helps collect additional evidence without making the assessment unnecessarily long.

---

## AI Evaluation Output

For each answer, the AI produces structured information including:

* Score
* Confidence
* Evidence stability
* Decision
* Feedback
* Evidence summary
* Follow-up question, when required

The individual answer score is evaluated on a 0–100 scale.

---

# Assessment Scoring Formulas

METI generates multiple assessment indicators instead of relying on only one score.

## CCI — Current Capability Index

CCI represents the candidate's demonstrated capability based on the assessment responses.

### Formula

```text
CCI = Average of All Answer Scores
```

Or,

```text
CCI = (S₁ + S₂ + S₃ + ... + Sₙ) / n
```

Where:

* `S₁, S₂, S₃ ... Sₙ` = Individual answer scores
* `n` = Total number of evaluated answers

---

## CPI — Candidate Potential Index

CPI combines the candidate's assessment performance and confidence in the evidence.

The current implementation uses:

* 70% Average Assessment Score
* 30% Average Confidence

### Formula

```text
CPI = (0.70 × Average Assessment Score) + (0.30 × Average Confidence)
```

Since CCI represents the average assessment score:

```text
CPI = (0.70 × CCI) + (0.30 × Average Confidence)
```

---

## CRI — Client Readiness Index

CRI combines:

* Current Capability Index (CCI)
* Candidate Potential Index (CPI)
* Evidence Confidence

### Conceptual Formula

```text
CRI = f(CCI, CPI, Evidence Confidence)
```

Where:

* `CCI` = Current Capability Index
* `CPI` = Candidate Potential Index
* `Evidence Confidence` = Confidence in the supporting evidence

The exact weighting/formula for these three components is not specified in the current project documentation.

---

## Evidence Confidence

Evidence Confidence represents how confidently the submitted responses support the assessment result.

The AI evaluation produces a confidence value for each answer.

The overall Evidence Confidence is based on the confidence values obtained from the evaluated responses.

### Formula

```text
Evidence Confidence = Average of Answer-Level Confidence Values
```

Or,

```text
Evidence Confidence = (C₁ + C₂ + C₃ + ... + Cₙ) / n
```

Where:

* `C₁, C₂, C₃ ... Cₙ` = Confidence value for each evaluated answer
* `n` = Total number of evaluated answers

---

## Score Range

All individual answer scores are evaluated on a 0–100 scale.

| Score    | Interpretation          |
| -------- | ----------------------- |
| 85–100   | Strong                  |
| 70–84    | Good / Consulting-ready |
| 50–69    | Developing              |
| Below 50 | Development required    |

---

## Competency-Level Analysis

METI also calculates performance for individual competency areas.

For each competency, the system stores:

* Competency name
* Score
* Evidence confidence

This helps identify the candidate's stronger areas and areas that may need further development.

---

## Results Dashboard

After completing the assessment, the candidate receives an interactive results dashboard.

The dashboard displays:

* CCI
* CPI
* CRI
* Evidence Confidence
* Overall assessment position
* Score interpretation
* Competency performance
* Strengths
* Development gaps
* Professional development recommendation
* Assessment history

Charts are used to make the results easier to understand instead of showing only raw numbers.

---

## Assessment History

Completed assessments are stored and linked to the candidate's account.

Candidates can view previous assessment attempts and access their results again.

The history includes:

* Assessment date
* Assessment status
* CCI
* CPI
* CRI
* Evidence confidence

This makes it possible to track assessment performance over time.

---

## Automated PDF Reports

METI can generate a professional assessment report in PDF format.

The report includes:

* Candidate information
* Assessment overview
* CCI
* CPI
* CRI
* Evidence confidence
* Overall assessment position
* Performance profile
* Competency performance
* Strengths
* Development gaps
* Assessment recommendation

The PDF is generated from the report webpage using Playwright and Chromium, allowing the report to preserve the dashboard-style layout and visual structure.

---

## System Architecture

```text
                    METI PLATFORM
                         |
        +----------------+----------------+
        |                                 |
     Frontend                           Backend
        |                                 |
 HTML / CSS / JavaScript             FastAPI
        |                                 |
        |                    +------------+------------+
        |                    |            |            |
        |                 Resume       AI Eval      Scoring
        |                 Processing   Service       Engine
        |                    |            |            |
        |                    +------------+------------+
        |                                 |
        +------------ Supabase ------------+
                         |
                Authentication
                Profiles
                Attempts
                Responses
                Scores
                Reports
```

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js
* Supabase JavaScript Client

### Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* Python Multipart
* pypdf

### AI

* Groq API
* AI-based structured answer evaluation
* JSON schema-based evaluation output

### Database & Authentication

* Supabase
* Supabase Authentication
* Supabase Database

### Report Generation

* Playwright
* Chromium
* HTML/CSS-based report generation
* PDF export

---

## Project Structure

```text
METI/
│
├── backend/
│   ├── ai_service.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── assessment_routes.py
│   │   ├── report_routes.py
│   │   ├── resume_routes.py
│   │   └── __init__.py
│   │
│   └── uploads/
│
├── frontend/
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   ├── consent.html
│   ├── profile.html
│   ├── assessment.html
│   ├── result.html
│   ├── dashboard.html
│   ├── assessment-history.html
│   ├── report.html
│   │
│   ├── style.css
│   ├── theme.css
│   ├── dashboard.css
│   ├── report.css
│   └── report-theme.css
│
├── generated_reports/
├── main.py
├── script.js
├── README.md
└── LICENSE
```

---

## Backend API Flow

### Resume Upload

```text
Candidate uploads PDF
        ↓
FastAPI receives file
        ↓
PDF is saved
        ↓
pypdf extracts text
        ↓
Extracted resume text is returned
        ↓
Resume evidence is used during assessment
```

### Answer Evaluation

```text
Candidate Answer
      +
Question
      +
Competency
      +
Resume Evidence
      ↓
FastAPI
      ↓
Groq AI Model
      ↓
Structured JSON Evaluation
      ↓
Score + Confidence + Feedback
      ↓
Next Question / Follow-up
```

### Final Assessment

```text
All Responses
      ↓
Average Scores
      ↓
CCI / CPI / CRI
      ↓
Competency Scores
      ↓
Strengths
      ↓
Development Gaps
      ↓
Recommendation
      ↓
Supabase
      ↓
Result Dashboard
      ↓
PDF Report
```

---

## Main Backend Routes

### Resume

`POST /upload-resume`

Uploads a PDF resume and extracts readable text from it.

### AI Evaluation

`POST /evaluate-answer`

Evaluates an individual candidate answer using the AI evaluation service.

### Final Score

`POST /calculate-score`

Calculates the final assessment scores, competency scores, findings, and saves the completed assessment.

### Assessment History

`GET /assessment-history/{user_id}`

Returns completed assessment attempts for a candidate.

### Assessment Result

`GET /assessment-result/{attempt_id}`

Returns the complete result of a specific assessment attempt.

### PDF Report

`GET /download-report`

Generates and returns the candidate's assessment report as a PDF.

---

## Candidate Journey

```text
Landing Page
    ↓
Register
    ↓
Login / Email Confirmation
    ↓
Consent
    ↓
Candidate Profile
    ↓
Resume Upload
    ↓
Personalised Assessment
    ↓
AI Evaluation
    ↓
Adaptive Follow-up (if required)
    ↓
Assessment Completion
    ↓
Final Scoring
    ↓
Results
    ↓
Dashboard
    ↓
Assessment History
    ↓
PDF Report
```

---

## What I Worked On

This project involved building a complete AI-assisted assessment workflow rather than creating only a frontend interface.

The major parts implemented include:

* Designed the overall assessment workflow
* Built candidate registration and login
* Added consent before assessment
* Created candidate profile management
* Added resume PDF upload and text extraction
* Built a competency-based question bank
* Added profile and resume-based question prioritization
* Integrated AI-based answer evaluation
* Designed structured AI evaluation output
* Implemented adaptive follow-up questioning
* Built the scoring and assessment logic
* Added competency-level scoring
* Connected the application with Supabase
* Stored candidate attempts, responses, scores, and reports
* Built the assessment results dashboard
* Added assessment history
* Created visual performance charts
* Built automated PDF report generation
* Designed the frontend pages and visual theme
* Connected the frontend and backend into one complete application

---

## Why This Project Is Different

The main idea behind METI is to move beyond a simple question-and-answer assessment.

A candidate's response is treated as evidence.

The platform tries to understand:

**What did the candidate know?**

**How did they approach the problem?**

**What did they actually do?**

**How strong is the evidence?**

**What are their strengths?**

**Where can they improve?**

This makes the assessment more structured and gives the candidate more useful feedback than just a final percentage.

---

## Future Improvements

Some possible future improvements include:

* More competency-specific question banks
* Larger assessment question pools
* More advanced resume understanding
* Better longitudinal performance tracking
* Stronger evidence retrieval and validation
* Role-specific assessments
* Industry-specific assessment templates
* Recruiter/admin dashboards
* Candidate comparison and benchmarking
* More advanced recommendation logic
* Cloud deployment
* Improved security and production configuration

---

## Note

METI is currently an AI-assisted assessment platform prototype focused on demonstrating an end-to-end assessment, evaluation, scoring, dashboard, and reporting workflow.

The platform is designed to support assessment decisions with structured evidence and AI-assisted analysis rather than treating AI output as the only source of truth.

---

## License

This project is licensed under the terms provided in the `LICENSE` file.
