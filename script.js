// =========================================================
// METI - SUPABASE CONFIGURATION
// =========================================================

// Supabase project URL
const SUPABASE_URL = "https://pjfwlddbfkaqwxghwvjw.supabase.co";

// IMPORTANT:
// Here paste your Supabase PUBLISHABLE/ANON key.
// NEVER use the service_role key in frontend code.
const SUPABASE_ANON_KEY = "sb_publishable_cMBcYcIajOfPSQYKHL61rg_i1cdHTUr";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// =========================================================
// REGISTER
// =========================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        const errorBox =
            document.getElementById("registerError");

        const successBox =
            document.getElementById("registerSuccess");

        const submitButton =
            registerForm.querySelector(".auth-submit");


        // Clear old messages

        errorBox.style.display = "none";

        successBox.style.display = "none";


        // Password validation

        if (password !== confirmPassword) {

            errorBox.textContent =
                "Passwords do not match.";

            errorBox.style.display = "block";

            return;
        }


        if (password.length < 6) {

            errorBox.textContent =
                "Password must contain at least 6 characters.";

            errorBox.style.display = "block";

            return;
        }


        // Disable button

        submitButton.disabled = true;

        submitButton.textContent =
            "Creating Account...";


        try {

            // Create Supabase Auth user

            const redirectUrl =
                window.location.origin + "/frontend/consent.html";

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        },
                        emailRedirectTo: redirectUrl
                    }
                });

            if (error) {

                throw error;
            }


            console.log("Registration successful:", data);


            // Show success

            successBox.textContent =
                "Account created successfully. Redirecting...";

            successBox.style.display = "block";


            /*
                If email confirmation is disabled,
                session will be available immediately.

                If email confirmation is enabled,
                user may need to confirm email first.
            */

            if (data.session) {

                window.location.href =
                    "consent.html";

            } else {

                successBox.textContent =
                    "Account created. Please check your email to confirm your account, then login.";

                submitButton.disabled = false;

                submitButton.textContent =
                    "Create Account";
            }


        } catch (error) {

            console.error(error);

            errorBox.textContent =
                error.message || "Registration failed.";

            errorBox.style.display =
                "block";

            submitButton.disabled = false;

            submitButton.textContent =
                "Create Account";
        }

    });

}

// =========================================================
// CONSENT
// =========================================================

const consentForm = document.getElementById("consentForm");

if (consentForm) {

    consentForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const privacyConsent =
            document.getElementById("privacyConsent").checked;

        const aiConsent =
            document.getElementById("aiConsent").checked;

        const communicationConsent =
            document.getElementById("communicationConsent").checked;

        const errorBox =
            document.getElementById("consentError");

        errorBox.style.display = "none";

        if (!privacyConsent || !aiConsent) {
            errorBox.textContent =
                "Please provide the required consent to continue.";
            errorBox.style.display = "block";
            return;
        }

        // Check logged-in user
        const { data: { user }, error } =
            await supabaseClient.auth.getUser();

        if (error || !user) {
            errorBox.textContent =
                "Your session has expired. Please login again.";
            errorBox.style.display = "block";
            return;
        }

        // Continue to candidate profile
        window.location.href = "profile.html";
    });

}

// =========================================================
// CANDIDATE PROFILE
// =========================================================

const profileForm = document.getElementById("profileForm");

if (profileForm) {

    // -----------------------------------------------------
    // LOAD LOGGED-IN USER
    // -----------------------------------------------------

    async function loadProfile() {

        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {

            window.location.href = "login.html";
            return;
        }

        // Email automatically filled
        document.getElementById("profileEmail").value =
            user.email || "";

        // Name from Supabase Auth metadata
        const fullName =
            user.user_metadata?.full_name || "";

        document.getElementById("profileFullName").value =
            fullName;


        // -------------------------------------------------
        // CHECK IF PROFILE ALREADY EXISTS
        // -------------------------------------------------

        const {
            data: existingProfile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError) {

            console.error(
                "Profile loading error:",
                profileError
            );

            return;
        }


        // If profile already exists, fill the form
        if (existingProfile) {

            document.getElementById("profileFullName").value =
                existingProfile.full_name || fullName;

            document.getElementById("profileEmail").value =
                existingProfile.email || user.email || "";

            document.getElementById("education").value =
                existingProfile.education || "";

            document.getElementById("experience").value =
                existingProfile.experience || "";

            document.getElementById("linkedin").value =
                existingProfile.linkedin_url || "";

            document.getElementById("github").value =
                existingProfile.github_url || "";
        }
    }


    // Load profile when page opens
    loadProfile();



    // -----------------------------------------------------
    // RESUME FILE NAME
    // -----------------------------------------------------

    const resumeInput =
        document.getElementById("resume");

    const resumeName =
        document.getElementById("resumeName");

    if (resumeInput) {

        resumeInput.addEventListener(
            "change",
            function () {

                if (resumeInput.files.length > 0) {

                    resumeName.textContent =
                        "Selected: " +
                        resumeInput.files[0].name;

                } else {

                    resumeName.textContent = "";
                }
            }
        );
    }



    // -----------------------------------------------------
    // SAVE PROFILE
    // -----------------------------------------------------

    profileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const errorBox =
                document.getElementById("profileError");

            const successBox =
                document.getElementById("profileSuccess");

            const submitButton =
                profileForm.querySelector(".profile-submit");


            errorBox.style.display = "none";
            successBox.style.display = "none";


            submitButton.disabled = true;
            submitButton.textContent =
                "Saving Profile...";


            try {

                // Get logged-in user
                const {
                    data: { user },
                    error: userError
                } = await supabaseClient.auth.getUser();


                if (userError || !user) {

                    throw new Error(
                        "Please login again to continue."
                    );
                }


                // Get form values
                const fullName =
                    document
                        .getElementById("profileFullName")
                        .value
                        .trim();

                const email =
                    document
                        .getElementById("profileEmail")
                        .value
                        .trim();

                const education =
                    document
                        .getElementById("education")
                        .value
                        .trim();

                const experience =
                    document
                        .getElementById("experience")
                        .value
                        .trim();

                const linkedin =
                    document
                        .getElementById("linkedin")
                        .value
                        .trim();

                const github =
                    document
                        .getElementById("github")
                        .value
                        .trim();


                // Basic validation
                if (!fullName || !email || !education) {

                    throw new Error(
                        "Please fill all required fields."
                    );
                }


                // -------------------------------------------------
                // UPLOAD RESUME TO FASTAPI
                // -------------------------------------------------

                const resumeInput =
                    document.getElementById("resume");

                const resumeFile =
                    resumeInput.files[0];

                let resumeText = null;
                let resumeFilename = null;

                if (resumeFile) {

                    // Check PDF
                    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
                        throw new Error(
                            "Please upload your resume in PDF format."
                        );
                    }

                    // Check file size - 5 MB
                    if (resumeFile.size > 5 * 1024 * 1024) {
                        throw new Error(
                            "Resume file size must be less than 5 MB."
                        );
                    }

                    submitButton.textContent =
                        "Analyzing Resume...";

                    // Create FormData
                    const formData = new FormData();

                    formData.append(
                        "file",
                        resumeFile
                    );

                    // Send PDF to FastAPI
                    const resumeResponse =
                        await fetch(
                            "http://127.0.0.1:8000/upload-resume",
                            {
                                method: "POST",
                                body: formData
                            }
                        );

                    const resumeResult =
                        await resumeResponse.json();

                    if (!resumeResponse.ok) {

                        throw new Error(
                            resumeResult.detail ||
                            "Resume upload failed."
                        );
                    }

                    // Get extracted resume text
                    resumeText =
                        resumeResult.resume_text;

                    resumeFilename =
                        resumeResult.stored_filename;

                    console.log(
                        "Resume analyzed successfully."
                    );

                    console.log(
                        "Extracted text:",
                        resumeText
                    );
                }


                // -------------------------------------------------
                // SAVE PROFILE + RESUME INTO SUPABASE
                // -------------------------------------------------

                submitButton.textContent =
                    "Saving Profile...";

                const { data, error } =
                    await supabaseClient
                        .from("profiles")
                        .upsert(
                            {
                                user_id: user.id,

                                full_name: fullName,

                                email: email,

                                education: education,

                                experience: experience,

                                linkedin_url:
                                    linkedin || null,

                                github_url:
                                    github || null,

                                resume_url:
                                    resumeFilename || null,

                                resume_text:
                                    resumeText || null,

                                updated_at:
                                    new Date().toISOString()
                            },
                            {
                                onConflict: "user_id"
                            }
                        )
                        .select();


                if (error) {
                    throw error;
                }


                console.log(
                    "Profile saved:",
                    data
                );


                // Success message
                successBox.textContent =
                    "Profile saved successfully!";

                successBox.style.display =
                    "block";


                submitButton.textContent =
                    "Profile Saved ✓";


                // Wait briefly then continue
                setTimeout(
                    function () {

                        window.location.href =
                            "assessment.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Profile save error:",
                    error
                );


                errorBox.textContent =
                    error.message ||
                    "Unable to save profile.";

                errorBox.style.display =
                    "block";


                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Save Profile & Continue →";
            }

        }
    );

}
// =========================================================
// LOGIN
// =========================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // -------------------------------------------------
        // GET LOGIN FIELDS
        // -------------------------------------------------

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const errorBox =
            document.getElementById("errorMessage");

        const successBox =
            document.getElementById("successMessage");

        const submitButton =
            document.getElementById("signinBtn");


        // -------------------------------------------------
        // CLEAR PREVIOUS MESSAGES
        // -------------------------------------------------

        if (errorBox) {
            errorBox.style.display = "none";
            errorBox.textContent = "";
        }

        if (successBox) {
            successBox.style.display = "none";
            successBox.textContent = "";
        }


        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!email || !password) {

            if (errorBox) {

                errorBox.textContent =
                    "Please enter your email and password.";

                errorBox.style.display =
                    "block";
            }

            return;
        }


        // -------------------------------------------------
        // DISABLE BUTTON
        // -------------------------------------------------

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Signing In...";
        }


        try {

            // -------------------------------------------------
            // SUPABASE LOGIN
            // -------------------------------------------------

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            // -------------------------------------------------
            // CHECK LOGIN ERROR
            // -------------------------------------------------

            if (error) {

                throw error;

            }


            console.log(
                "Login successful:",
                data
            );


            // -------------------------------------------------
            // SUCCESS MESSAGE
            // -------------------------------------------------

            if (successBox) {

                successBox.textContent =
                    "Login successful! Redirecting...";

                successBox.style.display =
                    "block";
            }


            if (submitButton) {

                submitButton.textContent =
                    "Signed In ✓";
            }


            // -------------------------------------------------
            // REDIRECT TO PROFILE
            // -------------------------------------------------

            setTimeout(function () {

                window.location.href =
                    "profile.html";

            }, 800);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            // -------------------------------------------------
            // SHOW ERROR
            // -------------------------------------------------

            if (errorBox) {

                errorBox.textContent =
                    error.message ||
                    "Invalid email or password.";

                errorBox.style.display =
                    "block";
            }


            // -------------------------------------------------
            // RESTORE BUTTON
            // -------------------------------------------------

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Sign In →";
            }

        }

    });

}
// =========================================================
// METI - ADAPTIVE ASSESSMENT
// =========================================================

const assessmentPage =
    document.getElementById("submitAnswer");

if (assessmentPage) {

    let candidateProfile = null;

    let currentQuestionIndex = 0;

    let currentQuestions = [];

    let answers = [];
    let followUpUsed = false;


    // -----------------------------------------------------
    // QUESTION BANK
    // -----------------------------------------------------

    const questionBank = {

    strategy: {
        category: "Strategy & Enterprise Thinking",

        question:
            "Imagine a company is facing declining business performance. How would you identify the most important business problem before recommending a solution?"
    },

    research: {
        category: "Research & Insight",

        question:
            "Tell us about a project where you had to collect, analyse or validate information before making a conclusion. How did you decide which information was reliable?"
    },

    value_chain: {
        category: "Value Chain & Enterprise Analysis",

        question:
            "Choose a company or project you are familiar with. How would you analyse its key activities to identify where value is created and where improvements may be possible?"
    },

    problem_structuring: {
        category: "Problem Structuring & Commercial Thinking",

        question:
            "Describe a complex problem you faced during a project, internship or academic work. How did you break the problem into smaller parts and decide what to solve first?"
    },

    process: {
        category: "Process & Capability",

        question:
            "Think of a process you have worked with. How would you identify inefficiencies or bottlenecks and decide what should be improved?"
    },

    transformation: {
        category: "Transformation & Change",

        question:
            "Tell us about a situation where you introduced or learned a new technology, tool or process. What challenge did you face and how did you adapt?"
    },

    governance: {
        category: "Organisation & Governance",

        question:
            "When multiple people are working on the same project, how would you define responsibilities and ensure that everyone is working towards the same objective?"
    },

    communication: {
        category: "Executive Communication",

        question:
            "Explain one technical project you have worked on as if you were presenting it to a non-technical business manager. How would you communicate the problem, approach and outcome?"
    },

    stakeholder: {
        category: "Stakeholder & Facilitation",

        question:
            "Imagine two stakeholders have different expectations about a project. How would you understand their concerns and move them towards a common decision?"
    },

    judgement: {
        category: "Professional Judgement",

        question:
            "Describe a situation where you had incomplete information but still had to make a decision. What factors did you consider before deciding?"
    }

    };

        // -----------------------------------------------------
    // EVIDENCE-BASED SUGGESTED ANSWERS
    // -----------------------------------------------------

    const suggestedAnswers = {

        "Strategy & Enterprise Thinking":
            "In my AI Response Validation System project, I identified the main problem as unreliable AI-generated responses and the need for a structured evaluation process. I broke this broad problem into measurable areas such as accuracy, relevance, hallucination and completeness. I then designed the evaluation workflow around these areas and connected it through a FastAPI backend. This helped me convert a complex AI reliability problem into a structured assessment process.",


        "Research & Insight":
            "For my AI Response Validation System, I worked with TruthfulQA and SQuAD datasets to create an evidence-based knowledge base. I explored the available data and used Hugging Face embeddings with ChromaDB to retrieve relevant information during evaluation. I also tested retrieval results to check whether the retrieved evidence was useful for evaluating AI responses. This gave me practical experience in research, data preparation and evidence retrieval.",


        "Value Chain & Enterprise Analysis":
            "In my AI Future Process Designer project, I focused on understanding how an existing business process could be improved through technology. I analysed the current process, identified areas where manual or inefficient activities could be improved, and mapped them toward a future-state process. I used semantic research and retrieval to support the analysis and implemented the application using FastAPI and SQLite. This helped me understand how technology can be connected to business process improvement.",


        "Problem Structuring & Commercial Thinking":
            "In my AI Response Validation System project, I structured the problem by separating AI response quality into accuracy, relevance, hallucination and completeness instead of treating the response as one overall issue. I created separate evaluation components for these areas and then combined their results into an overall assessment. This approach made it easier to identify specific weaknesses in an AI response and provide targeted improvement recommendations.",


        "Process & Capability":
            "While developing my AI Response Validation System, I designed the workflow from candidate input through AI evaluation, evidence retrieval, scoring and final reporting. I separated the application into different components so that each stage had a clear responsibility. I implemented the backend using FastAPI and connected the evaluation flow with the frontend dashboard. This experience helped me understand how a complete process can be broken into manageable technical components.",


        "Transformation & Change":
            "In my AI Future Process Designer project, I worked on the idea of transforming an existing business process into a more efficient future-state process using AI-assisted analysis. I compared the current process with the proposed future process and considered where technology could reduce manual effort and improve the workflow. This project helped me understand that transformation is not only about adding technology but also about redesigning how work is performed.",


        "Organisation & Governance":
            "In my AI Response Validation System, I separated responsibilities across different evaluation components such as Accuracy, Relevance, Hallucination and Completeness. I also used a structured verdict process to combine the individual evaluation results into a final assessment. This separation helped keep the evaluation process organised and made the reasoning behind the final result easier to understand. It gave me practical exposure to structured responsibilities and controlled evaluation workflows.",


        "Executive Communication":
            "For my AI projects, I focused on presenting technical work in a way that can be understood from both a technical and problem-solving perspective. For example, in my AI Response Validation System, I can explain the problem, the evaluation approach, the evidence retrieval process, the scoring mechanism and the final outcome in a structured sequence. I also created a dashboard and report output so that the evaluation results could be communicated clearly rather than only showing raw technical information.",


        "Stakeholder & Facilitation":
            "During my project development and internship work, I had to understand requirements, break them into smaller tasks and communicate progress and implementation decisions clearly. In my AI Response Validation System, I converted the requirement for reliable AI evaluation into separate modules for evidence retrieval, evaluation, scoring and reporting. This helped me communicate the implementation in a structured way and made it easier to discuss individual components and improvements.",


        "Professional Judgement":
            "While developing my AI Response Validation System, I recognised that an AI model should not be treated as automatically correct. I therefore designed the system to evaluate responses against evidence and multiple criteria such as accuracy, relevance, hallucination and completeness. I also included evidence confidence as part of the evaluation process. This reflects my approach of validating AI outputs before using them for a final decision rather than relying only on the model's generated response."

    };
    // -----------------------------------------------------
    // LOAD PROFILE
    // -----------------------------------------------------

    async function loadAssessmentProfile() {

        try {

            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            if (userError || !user) {

                window.location.href =
                    "login.html";

                return;
            }


            const {
                data: profile,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();


            if (profileError) {

                throw profileError;
            }


            if (!profile) {

                window.location.href =
                    "profile.html";

                return;
            }


            candidateProfile = profile;


            // Candidate name
            document.getElementById(
                "candidateName"
            ).textContent =
                profile.full_name ||
                "Candidate";


            // Build personalised assessment
            buildPersonalisedAssessment(profile);


        } catch (error) {

            console.error(
                "Assessment profile error:",
                error
            );

            showAssessmentError(
                "Unable to load your profile. Please refresh the page."
            );
        }
    }
        loadAssessmentProfile();


    // -----------------------------------------------------
    // BUILD PERSONALIZED QUESTIONS
    // -----------------------------------------------------

    function buildPersonalisedAssessment(profile) {

        const resume =
            (profile.resume_text || "").toLowerCase();

        const experience =
            (profile.experience || "").toLowerCase();

        const education =
            (profile.education || "").toLowerCase();

        const evidence =
            resume + " " +
            experience + " " +
            education;


        // -------------------------------------------------
        // ALL 10 COMPETENCIES
        // -------------------------------------------------

        const allQuestions = [

            questionBank.strategy,

            questionBank.research,

            questionBank.value_chain,

            questionBank.problem_structuring,

            questionBank.process,

            questionBank.transformation,

            questionBank.governance,

            questionBank.communication,

            questionBank.stakeholder,

            questionBank.judgement

        ];


        // -------------------------------------------------
        // RESUME-BASED PRIORITY
        // -------------------------------------------------

        let priorityQuestions = [];


        // Data / Analytics / ML evidence
        if (
            evidence.includes("data") ||
            evidence.includes("python") ||
            evidence.includes("sql") ||
            evidence.includes("machine learning") ||
            evidence.includes("analytics") ||
            evidence.includes("analysis")
        ) {

            priorityQuestions.push(
                questionBank.research
            );

            priorityQuestions.push(
                questionBank.problem_structuring
            );
        }


        // AI / Technology evidence
        if (
            evidence.includes("artificial intelligence") ||
            evidence.includes("ai") ||
            evidence.includes("machine learning") ||
            evidence.includes("fastapi") ||
            evidence.includes("streamlit") ||
            evidence.includes("docker") ||
            evidence.includes("software")
        ) {

            priorityQuestions.push(
                questionBank.transformation
            );
        }


        // Internship / Project evidence
        if (
            evidence.includes("internship") ||
            evidence.includes("intern") ||
            evidence.includes("project")
        ) {

            priorityQuestions.push(
                questionBank.problem_structuring
            );

            priorityQuestions.push(
                questionBank.communication
            );
        }


        // -------------------------------------------------
        // ADD REMAINING COMPETENCIES
        // -------------------------------------------------

        for (const question of allQuestions) {

            if (!priorityQuestions.includes(question)) {

                priorityQuestions.push(question);

            }

        }


        // -------------------------------------------------
        // EXACTLY 10 QUESTIONS
        // -------------------------------------------------

        currentQuestions =
            priorityQuestions.slice(0, 5);


        // -------------------------------------------------
        // PERSONALIZED RESUME MESSAGE
        // -------------------------------------------------

        let insightTitle =
            "Your assessment is personalised from your profile.";

        let insightText =
            "METI has identified evidence from your profile and CV and will use it to guide the assessment.";


        if (
            evidence.includes("data") ||
            evidence.includes("python") ||
            evidence.includes("machine learning") ||
            evidence.includes("sql")
        ) {

            insightTitle =
                "Your data and technology experience will be explored.";

            insightText =
                "Your CV contains evidence related to data, technology or analytical work. METI will explore how you analyse problems, make decisions and communicate your work.";

        }


        document.getElementById(
            "resumeInsightTitle"
        ).textContent =
            insightTitle;


        document.getElementById(
            "resumeInsightText"
        ).textContent =
            insightText;


        // Start assessment
        showQuestion();
    }

    // -----------------------------------------------------
    // SHOW QUESTION
    // -----------------------------------------------------

    function showQuestion() {

        const question =
            currentQuestions[currentQuestionIndex];


        if (!question) {

            finishAssessment();

            return;
        }


        const total =
            currentQuestions.length;

        const number =
            currentQuestionIndex + 1;

        const percentage =
            Math.round(
                (number / total) * 100
            );


        document.getElementById(
            "questionCounter"
        ).textContent =
            `Question ${number} of ${total}`;


        document.getElementById(
            "questionNumber"
        ).textContent =
            String(number).padStart(2, "0");


        document.getElementById(
            "progressText"
        ).textContent =
            `${percentage}%`;


        document.getElementById(
            "assessmentProgress"
        ).style.width =
            `${percentage}%`;


        document.getElementById(
            "questionCategory"
        ).textContent =
            question.category;


        document.getElementById(
            "questionText"
        ).textContent =
            question.question;


        document.getElementById(
            "answerText"
        ).value = "";


        document.getElementById(
            "characterCount"
        ).textContent =
            "0 characters";


        document.getElementById(
            "assessmentError"
        ).style.display =
            "none";

        document.getElementById(
            "assessmentSuccess"
        ).style.display =
            "none";
    }


    // -----------------------------------------------------
    // CHARACTER COUNT
    // -----------------------------------------------------

    const answerText =
        document.getElementById("answerText");

    const characterCount =
        document.getElementById("characterCount");


    answerText.addEventListener(
        "input",
        function () {

            const count =
                answerText.value.length;

            characterCount.textContent =
                `${count} characters`;
        }
    );
     // -----------------------------------------------------
    // SUGGESTED ANSWER BUTTON
    // -----------------------------------------------------

    const sampleAnswerBtn =
        document.getElementById("sampleAnswerBtn");

    if (sampleAnswerBtn) {

        sampleAnswerBtn.addEventListener(
            "click",
            function () {

                const currentQuestion =
                    currentQuestions[currentQuestionIndex];

                if (!currentQuestion) {
                    return;
                }

                const suggestedAnswer =
                    suggestedAnswers[currentQuestion.category];

                if (!suggestedAnswer) {
                    return;
                }

                answerText.value =
                    suggestedAnswer;

                characterCount.textContent =
                    `${answerText.value.length} characters`;

                answerText.focus();

                sampleAnswerBtn.textContent =
                    "✓ Suggested Answer Added";

                setTimeout(function () {

                    sampleAnswerBtn.textContent =
                        "💡 Use Suggested Answer";

                }, 1500);

            }
        );

    }

    // -----------------------------------------------------
    // SUBMIT ANSWER
    // -----------------------------------------------------

    assessmentPage.addEventListener(
        "click",
        async function () {

            const answer =
                answerText.value.trim();

            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (!answer) {

                showAssessmentError(
                    "Please enter your answer before continuing."
                );

                return;
            }

            if (answer.length < 15) {

                showAssessmentError(
                    "Please provide a little more detail so we can evaluate your evidence."
                );

                return;
            }

            const submitButton =
                document.getElementById("submitAnswer");

            submitButton.disabled = true;

            submitButton.querySelector(
                "span:first-child"
            ).textContent = "Evaluating...";

            try {

                // -----------------------------------------
                // CURRENT QUESTION
                // -----------------------------------------

                const question =
                    currentQuestions[
                        currentQuestionIndex
                    ];

                // -----------------------------------------
                // SEND ANSWER TO FASTAPI
                // -----------------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/evaluate-answer",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                question:
                                    question.question,

                                category:
                                    question.category,

                                answer:
                                    answer,

                                resume_text:
                                    candidateProfile?.resume_text || ""

                            })
                        }
                    );

                // -----------------------------------------
                // READ API RESPONSE
                // -----------------------------------------

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "AI evaluation failed."
                    );
                }

                const evaluation =
                    data.evaluation;

                console.log(
                    "AI Evaluation:",
                    evaluation
                );

                // -----------------------------------------
                // SAVE ANSWER + AI EVALUATION
                // -----------------------------------------

                answers.push({

                    question:
                        question.question,

                    category:
                        question.category,

                    answer:
                        answer,

                    score:
                        evaluation.score,

                    confidence:
                        evaluation.confidence,

                    stability:
                        evaluation.stability,

                    decision:
                        evaluation.decision,

                    feedback:
                        evaluation.feedback,

                    evidence_summary:
                        evaluation.evidence_summary,

                    follow_up_question:
                        evaluation.follow_up_question

                });

                // -----------------------------------------
                // ADAPTIVE DECISION
                // MAXIMUM ONE FOLLOW-UP PER MAIN QUESTION
                // -----------------------------------------

                if (
                    evaluation.decision === "follow_up" &&
                    evaluation.follow_up_question &&
                    !followUpUsed
                ) {

                    // Mark follow-up as used
                    followUpUsed = true;

                    // Show ONE AI-generated follow-up
                    currentQuestions[
                        currentQuestionIndex
                    ] = {

                        category:
                            question.category,

                        question:
                            evaluation.follow_up_question,

                        isFollowUp:
                            true

                    };

                    showQuestion();

                    return;
                }


                // -----------------------------------------
                // MOVE TO NEXT MAIN QUESTION
                // -----------------------------------------

                currentQuestionIndex++;


                // Reset follow-up permission
                // for NEXT main question
                followUpUsed = false;


                // -----------------------------------------
                // CHECK ASSESSMENT COMPLETION
                // -----------------------------------------

                if (
                    currentQuestionIndex >=
                    currentQuestions.length
                ) {

                    finishAssessment();

                    return;
                }


                // -----------------------------------------
                // SHOW NEXT MAIN QUESTION
                // -----------------------------------------

                showQuestion()

            } catch (error) {

                console.error(
                    "Assessment evaluation error:",
                    error
                );

                showAssessmentError(
                    error.message ||
                    "Unable to evaluate your answer. Please try again."
                );

            } finally {

                submitButton.disabled = false;

                submitButton.querySelector(
                    "span:first-child"
                ).textContent =
                    "Submit Answer";

            }

        }
    );
// -----------------------------------------------------
// FINISH
// -----------------------------------------------------

// -----------------------------------------------------
// FINISH
// -----------------------------------------------------

function finishAssessment() {

    document.getElementById(
        "questionCategory"
    ).textContent =
        "Assessment Complete";


    document.getElementById(
        "questionText"
    ).textContent =
        "Thank you. Your responses have been captured.";


    document.getElementById(
        "answerText"
    ).style.display =
        "none";


    document.getElementById(
        "submitAnswer"
    ).style.display =
        "none";


    document.getElementById(
        "characterCount"
    ).textContent =
        `${answers.length} responses captured`;


    document.getElementById(
        "progressText"
    ).textContent =
        "100%";


    document.getElementById(
        "assessmentProgress"
    ).style.width =
        "100%";


    document.getElementById(
        "questionCounter"
    ).textContent =
        "Assessment Complete";


    document.getElementById(
        "resumeInsightTitle"
    ).textContent =
        "Your assessment responses are ready for evaluation.";


    document.getElementById(
        "resumeInsightText"
    ).textContent =
        "Click below to evaluate your responses and generate your capability scores and development findings.";


    // -------------------------------------------------
    // VIEW RESULTS BUTTON
    // -------------------------------------------------

    const existingButton =
        document.getElementById(
            "viewResultsButton"
        );


    if (!existingButton) {

        const resultsButton =
            document.createElement("button");


        resultsButton.id =
            "viewResultsButton";


        resultsButton.textContent =
            "View Results";


        resultsButton.style.marginTop =
            "20px";


        resultsButton.style.padding =
            "12px 28px";


        resultsButton.style.border =
            "none";


        resultsButton.style.borderRadius =
            "8px";


        resultsButton.style.background =
            "#4f46e5";


        resultsButton.style.color =
            "white";


        resultsButton.style.fontSize =
            "14px";


        resultsButton.style.fontWeight =
            "600";


        resultsButton.style.cursor =
            "pointer";


        resultsButton.onclick =
            calculateAndShowResults;


        document.getElementById(
            "resumeInsightText"
        ).parentElement.appendChild(
            resultsButton
        );

    }

}

// -----------------------------------------------------
// CALCULATE AND SHOW RESULTS
// -----------------------------------------------------

async function calculateAndShowResults() {

    const button =
        document.getElementById(
            "viewResultsButton"
        );


    button.textContent =
        "Generating Results...";


    button.disabled =
        true;


    try {

        // ---------------------------------------------
        // GET LOGGED-IN SUPABASE USER
        // ---------------------------------------------

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !user) {

            throw new Error(
                "Please login again to continue."
            );

        }


        // ---------------------------------------------
        // SEND RESPONSES + USER ID TO FASTAPI
        // ---------------------------------------------

        const response =
            await fetch(
                "http://127.0.0.1:8000/calculate-score",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        responses: answers,

                        user_id: user.id

                    })

                }
            );


        // ---------------------------------------------
        // CHECK RESPONSE
        // ---------------------------------------------

        if (!response.ok) {

            const errorData =
                await response.json();


            throw new Error(
                errorData.detail ||
                "Unable to calculate assessment score."
            );

        }


        // ---------------------------------------------
        // READ RESULT
        // ---------------------------------------------

        const data =
            await response.json();


        // ---------------------------------------------
        // SAVE RESULT
        // ---------------------------------------------

        localStorage.setItem(
            "metiAssessmentResult",
            JSON.stringify(data)
        );


        // ---------------------------------------------
        // GO TO RESULT PAGE
        // ---------------------------------------------

        window.location.href =
            "result.html";


    } catch (error) {

        console.error(
            "Assessment result error:",
            error
        );


        alert(
            error.message ||
            "Unable to generate assessment results."
        );


        button.textContent =
            "View Results";


        button.disabled =
            false;

    }

}
}

// =========================================================
// DOWNLOAD REPORT BUTTON
// =========================================================

const downloadReportBtn =
    document.getElementById("downloadReportBtn");

console.log(
    "Download Report button found:",
    downloadReportBtn
);

if (downloadReportBtn) {

    downloadReportBtn.addEventListener(
        "click",
        async function () {

            try {

                console.log(
                    "DOWNLOAD REPORT BUTTON CLICKED"
                );


                // -------------------------------------------------
                // GET LOGGED-IN USER
                // -------------------------------------------------

                const {
                    data: { user },
                    error: userError
                } =
                    await supabaseClient.auth.getUser();


                if (userError || !user) {

                    throw new Error(
                        "Please login again to download your report."
                    );

                }


                // -------------------------------------------------
                // GET ATTEMPT ID FROM URL
                // -------------------------------------------------

                const urlParams =
                    new URLSearchParams(
                        window.location.search
                    );


                const attemptId =
                    urlParams.get("attempt_id");


                if (!attemptId) {

                    throw new Error(
                        "Assessment attempt not found."
                    );

                }


                console.log(
                    "Attempt ID:",
                    attemptId
                );

                console.log(
                    "User ID:",
                    user.id
                );


                // -------------------------------------------------
                // CHANGE BUTTON STATE
                // -------------------------------------------------

                const originalText =
                    downloadReportBtn.innerHTML;


                downloadReportBtn.disabled =
                    true;


                downloadReportBtn.innerHTML =
                    "⏳ Generating Report...";


                // -------------------------------------------------
                // CALL FASTAPI
                // -------------------------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/download-report" +
                        `?attempt_id=${encodeURIComponent(attemptId)}` +
                        `&user_id=${encodeURIComponent(user.id)}`
                    );


                // -------------------------------------------------
                // CHECK RESPONSE
                // -------------------------------------------------

                if (!response.ok) {

                    let errorMessage =
                        "Unable to generate report.";

                    try {

                        const errorData =
                            await response.json();

                        errorMessage =
                            errorData.detail ||
                            errorMessage;

                    } catch (e) {
                        // Ignore JSON parsing error
                    }


                    throw new Error(
                        errorMessage
                    );

                }


                // -------------------------------------------------
                // GET PDF FILE
                // -------------------------------------------------

                const blob =
                    await response.blob();


                // -------------------------------------------------
                // CREATE DOWNLOAD URL
                // -------------------------------------------------

                const pdfUrl =
                    window.URL.createObjectURL(
                        blob
                    );


                // -------------------------------------------------
                // CREATE DOWNLOAD LINK
                // -------------------------------------------------

                const link =
                    document.createElement("a");


                link.href =
                    pdfUrl;


                link.download =
                    "METI_Assessment_Report.pdf";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                // -------------------------------------------------
                // CLEANUP
                // -------------------------------------------------

                window.URL.revokeObjectURL(
                    pdfUrl
                );


                // -------------------------------------------------
                // RESTORE BUTTON
                // -------------------------------------------------

                downloadReportBtn.innerHTML =
                    "📄 Download Report";


                console.log(
                    "PDF report downloaded successfully."
                );


            } catch (error) {

                console.error(
                    "Download report error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to download report."
                );


                downloadReportBtn.innerHTML =
                    "📄 Download Report";


            } finally {

                downloadReportBtn.disabled =
                    false;

            }

        }
    );

}