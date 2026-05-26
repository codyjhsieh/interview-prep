/* ─── Interview question bank (2026 compile) ──────────────────────────
 * Real 2024-2025 interview questions for Tier-A targets, compiled by
 * parallel research agents and cross-referenced against public sources
 * (interviewing.io, candidate writeups, Glassdoor where readable,
 * Reddit threads, Exponent/techinterview.org guides).
 *
 * Each company record:
 *   loop_shape  — short prose description of the standard interview loop
 *   rounds      — [{ type, sample_questions[], notes }]
 *                  type ∈ { coding, system_design, ml_design, applied_ai,
 *                           behavioral, take_home, debugging, api_design,
 *                           fde_case, frontend, ml_research, ml_internals }
 *   role_notes  — divergence by role (FDE vs AI Eng vs SWE)
 *   sources     — [{url, title, year}], all real URLs the agents fetched
 *   confidence  — 'high' (3+ recent independent sources)
 *                 | 'med'  (1-2 sources)
 *                 | 'low'  (sparse / inferred loop-shape only)
 *
 * Tier-B/C companies (sub-30 AI startups + smaller) intentionally not
 * included — public 2024-2025 interview data for them is effectively
 * non-existent. They get role-pattern guidance via the Companies page
 * template instead. */

const INTERVIEW_QUESTIONS_2026 = {
  "openai": {
    "loop_shape": "Recruiter call (30 min) -> Technical phone screen (1 hr) -> Second technical screen or assessment (1 hr, format varies by role) -> Virtual onsite (4-6 hrs, typically 4-6 rounds: coding, system design, project deep-dive/presentation, behavioral). Mid-to-senior loops add a 45-min project presentation. Process averages ~25 days; success rate is very low.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement an asynchronous training-job manager that supports job prioritization, resource quotas, and automatically rolls back jobs that hit OOM errors (2025 onsite report).",
          "Build a model-training pipeline focused on handling streaming data, with checkpointing, resume, concurrent processing, exception logging, and data consistency (2025 phone screen report).",
          "LRU cache implementation (repeatedly cited as the most common OpenAI onsite coding problem)."
        ],
        "notes": "Coding is described as 'more practical than LeetCode' - data structures and algorithms that resemble real production work (time-based stores, versioned data stores, coroutines, OOP). Expect emphasis on test coverage, edge cases, and production-quality code. AI assistance is generally prohibited during live rounds."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design an embedding-service API with hot updates and A/B testing support (2025 onsite report).",
          "Design a distributed training platform for foundation models: sharded training, logging, fault tolerance, versioning (2025 technical screen report).",
          "Design GitHub Actions from scratch (2025 SWE onsite, US).",
          "Design Yelp / Foursquare / Twitter / a notifications system (classic prompts still used in 2024-2025 per IGotAnOffer)."
        ],
        "notes": "Practical scenarios with deep follow-ups. If you name a specific technology, be ready to defend it in depth. Senior/infra loops skew toward ML-infra: distributed training, GPU utilization, inference serving."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Project deep-dive: walk through an ML-infra project you led - scalability, monitoring, failover, maintainability (2025 onsite)."
        ],
        "notes": "Mid/senior loops typically include a 45-min presentation or deep-dive round on a project of the candidate's choosing. Interviewers probe tradeoffs and decisions."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Why OpenAI / mission fit - discuss ethics and safety in AI.",
          "Team collaboration scenarios (30-min closing round)."
        ],
        "notes": "Two behavioral touchpoints common: a senior-manager values round (~45 min) and a shorter team-fit round. Reading the OpenAI blog and being able to discuss safety thoughtfully is repeatedly mentioned."
      }
    ],
    "role_notes": "AI Engineer / Forward Deployed loops emphasize applied-AI and project deep-dive over distributed-training internals. Standard SWE loops still hit coding + system design heavily. Infra/ML-systems loops add explicit ML-infra system design (sharded training, embedding services). No formal ML-research round for SWE/AIE - that lives in the Research scientist track.",
    "sources": [
      {
        "url": "https://interviewing.io/openai-interview-questions",
        "title": "OpenAI's Interview Process & Questions - interviewing.io",
        "year": 2024
      },
      {
        "url": "https://medium.com/@anqi.silvia/my-journey-through-the-2025-openai-interview-actual-questions-7101d7949a75",
        "title": "My Journey Through the 2025 OpenAI Interview: Actual Questions",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/openai/experiences/software-engineer-united-states-july-31-2025-declined-offer-positive-4dade738/",
        "title": "OpenAI Software Engineer Interview Experience - Taro (July 2025)",
        "year": 2025
      },
      {
        "url": "https://igotanoffer.com/en/advice/openai-software-engineer-interview",
        "title": "OpenAI Software Engineer Interview (process, questions, prep) - IGotAnOffer",
        "year": 2024
      }
    ],
    "confidence": "high"
  },
  "anthropic": {
    "loop_shape": "Recruiter call (30 min) -> 90-min CodeSignal coding challenge (often async, multi-level) -> Hiring manager technical deep-dive (45-60 min) -> Onsite/virtual 4-5 sessions (~4 hrs): 1-2 coding rounds, system design, hiring-manager/deep-dive, and a values/culture round. Total ~3-4 weeks.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Build an in-memory database across four progressive levels: SET/GET/DELETE -> filtered scans -> TTL with timestamps -> file compression/decompression (2025 90-min CodeSignal challenge).",
          "Implement a banking system with multiple transaction types, progressive complexity across four levels (recurring CodeSignal prompt 2024-2025).",
          "Python-heavy first-principles problems on data mutation, concurrency, multithreading, hash maps, parsing, sorting (onsite coding rounds)."
        ],
        "notes": "Iterative grader-based format; reward small-step iteration over big-bang solutions. Start with minimal passing version, write tests early, lean on Python stdlib. Live AI usage prohibited. Concurrency/multithreading themes recur across multiple rounds."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a distributed search system for 1B documents and 1M QPS handling sharding, caching, and LLM inference scaling - avoid hotspots, optimize GPU memory (2025 onsite).",
          "Design an API for efficient LLM serving (batching, queuing, GPU utilization).",
          "Design a system enabling an LLM to handle multiple questions in a single thread (concurrency/session mgmt).",
          "Claude chat-service architecture."
        ],
        "notes": "Conducted in a shared Google Doc. LLM-serving and inference-infra prompts are the modal Anthropic system design. Edge cases and real-world failure modes probed aggressively."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about a time you made a safety-first decision in a project (aligned with Anthropic's AI safety mission).",
          "Tell me about a technical misjudgment that delayed a project.",
          "Hypothetical ethical scenarios with no clean answers; moments where your values were tested; instances of pushback."
        ],
        "notes": "Values/culture round has the HIGHEST failure rate per Anthropic recruiters - weight prep heavily. Have 2-3 90-second STAR stories ready on risk, oversight, and tradeoffs. Non-technical panel format, ~1 hr."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Hiring manager round may include analyzing an existing codebase, identifying bottlenecks, or discussing how to scale a system."
        ],
        "notes": "1-hr hiring-manager technical conversation focused on engineering judgment, not live coding. Project deep-dives may span multiple languages."
      }
    ],
    "role_notes": "SWE and AI Engineer loops share the structure above. Research loops add an ML-research/paper-discussion round; product/Forward Deployed roles weight the values + applied-AI rounds more heavily and may swap one coding round for a take-home. Bar is consistently described as 'extremely high.'",
    "sources": [
      {
        "url": "https://interviewing.io/anthropic-interview-questions",
        "title": "Anthropic's Interview Process & Questions - interviewing.io",
        "year": 2024
      },
      {
        "url": "https://medium.com/@anqi.silvia/my-2025-anthropic-software-engineer-interview-experience-9fc15cd81a99",
        "title": "My 2025 Anthropic Software Engineer Interview Experience",
        "year": 2025
      },
      {
        "url": "https://www.interviewcoder.co/blog/anthropic-software-engineer-interview",
        "title": "Anthropic Software Engineer Interview: 30 Questions - Interview Coder",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/guides/anthropic-software-engineer-interview",
        "title": "Anthropic Software Engineer Interview | Sample Questions - Exponent",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "cohere": {
    "loop_shape": "HR/recruiter screen (~30 min) -> 1-hr coding online assessment (often 3 problems) -> 48-hr take-home / case study -> Virtual onsite with 4 rounds: coding, ML design, paper-reading/deep-dive, hiring-manager/behavioral. Total ~4 weeks.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement top_k LLM token decoding (onsite coding).",
          "Implement a function that takes a stream of strings and removes duplicates in real time, without storing the entire stream in memory.",
          "Implement the intrinsic evaluation framework for the Hellaswag dataset (2025 ML intern technical task, 45-min timebox)."
        ],
        "notes": "Coding skews toward LLM internals and streaming/memory-bounded problems rather than pure LeetCode. Python and PyTorch fluency expected; tensor manipulation on senior loops."
      },
      {
        "type": "ml_design",
        "sample_questions": [
          "Architect a retrieval-augmented generation system, including chunking and retrieval strategy.",
          "Design a batch-inference optimization pipeline.",
          "Design a system for handling post-training knowledge updates to a deployed LLM.",
          "Design a real-time fraud detection system; URL shortener (more classical prompts also used)."
        ],
        "notes": "ML design is the heaviest round - emphasizes practical LLM productization: RAG, batch inference, knowledge updates, eval. Cost/latency tradeoffs explicitly probed."
      },
      {
        "type": "ml_research",
        "sample_questions": [
          "Paper-reading deep dive: critically analyze a recent research paper (chosen by candidate or interviewer)."
        ],
        "notes": "Distinguishing round vs. peers - applied/SWE loops at Cohere include a paper deep-dive because the company straddles research and product. Be ready to discuss methodology, ablations, and limitations."
      },
      {
        "type": "take_home",
        "sample_questions": [
          "48-hr case study demonstrating analytical thinking and applied ML judgment (specific prompt varies by team; recruiter reports a ~30% pass rate)."
        ],
        "notes": "First-round filter for many ML roles. Treat as production-quality submission with writeup."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Walk through an applied LLM project you owned end-to-end.",
          "Cross-team collaboration and shipping under ambiguity."
        ],
        "notes": "Hiring-manager round; standard behavioral but expects concrete applied-LLM stories."
      }
    ],
    "role_notes": "ML Engineer / Applied ML loops always include the paper-reading round. Pure SWE loops can drop the paper deep-dive and replace ML design with classical system design. Forward Deployed / solutions engineering loops weight take-home and behavioral more heavily. WARNING: 'Cohere Health' is a separate US healthcare-utilization company - many top search results conflate the two. Data above is for Cohere (cohere.com, the LLM company).",
    "sources": [
      {
        "url": "https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/",
        "title": "My 2026 Cohere Interview Process and Questions I Faced - LinkJob",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/cohere/experiences/machine-learning-engineer-intern-canton-oh-september-8-2025-no-offer-neutral-82e7dbb0/",
        "title": "Cohere ML Engineer Intern Interview Experience - Taro (Sept 2025)",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Cohere-Machine-Learning-Engineer-Interview-Questions-EI_IE6413613.0,6_KO7,32.htm",
        "title": "Cohere Machine Learning Engineer Interview Questions - Glassdoor",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "mistral": {
    "loop_shape": "Talent-partner / recruiter screen (20-30 min, recruiter shares LLM eval prep materials) -> LLM knowledge quiz (45-60 min, rigid Q&A on transformer architecture / RAG / KV caching / fine-tuning) -> Python code-review round (review a deliberately messy PR) -> LeetCode-style coding round (Python; sometimes PyTorch or Mistral-API live) -> ML system design (RAG / agentic / LangGraph) -> Bar-raiser / final with hiring manager. ~5-6 rounds over ~15 days.",
    "rounds": [
      {
        "type": "applied_ai",
        "sample_questions": [
          "Explain LoRA fine-tuning (asked verbatim in 2025 Applied AI Engineer loop, Luxembourg).",
          "If you have a 2000-page PDF that doesn't fit in the context window and serves as a knowledge base, would you fine-tune a model or set up RAG? Defend the tradeoff.",
          "Explain KV caching - mechanics, memory implications, and serving impact.",
          "Explain embedding retrieval depth: chunking, indexing, vector-DB tradeoffs."
        ],
        "notes": "LLM quiz is the signature Mistral round and notoriously rigid - interviewers look for specific answers, not open discussion. Candidates report it 'rewards guessing interviewer preferences over technical accuracy.' Depth on KV caching and retrieval is required even for non-research applied roles."
      },
      {
        "type": "coding",
        "sample_questions": [
          "Implement multi-headed self-attention from scratch, with causal masking and batch handling (asked in 2025 coding round).",
          "Medium-difficulty Python LeetCode problem.",
          "Code review: fix a deliberately broken Python PR - typos, async syntax, naming conventions, Mistral-API usage."
        ],
        "notes": "Two coding-flavored rounds: classical LeetCode + a code-review round. Some candidates asked to call the Mistral API live during coding. PyTorch fluency expected for senior/AI roles."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a scalable RAG system using LangGraph - chunking strategy, vector retrieval optimization, agentic workflow.",
          "Design an agentic workflow with cost/latency tradeoffs.",
          "Fine-tuning vs. prompt engineering vs. RAG decision framework."
        ],
        "notes": "System design is exclusively ML/LLM-focused (no classic 'design Twitter'). LangGraph specifically mentioned; agentic-workflow design recurring."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Autonomy / leadership experience.",
          "Working across time zones (Mistral is Paris-headquartered, distributed)."
        ],
        "notes": "Bar-raiser / final round. Lighter than coding/LLM rounds but used for fit calibration."
      }
    ],
    "role_notes": "Applied AI Engineer and SWE loops both run the LLM quiz; SWE loops weight LeetCode + code-review more. Research roles add a paper deep-dive. Candidates repeatedly note the recruiter sends prep links before the LLM quiz - take them seriously even if the actual questions diverge.",
    "sources": [
      {
        "url": "https://www.interviewquery.com/prep-guides/mistral-ai-software-engineer",
        "title": "Mistral AI Software Engineer Interview Questions - InterviewQuery",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/mistral-ai/experiences/applied-ai-engineer-luxemburg-july-1-2025-no-offer-negative-9129fa13/",
        "title": "Mistral AI Applied AI Engineer Interview - Taro (July 2025, Luxembourg)",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/mistral-ai/experiences/applied-ai-london-england-october-1-2025-no-offer-neutral-f3af955e/",
        "title": "Mistral AI Applied AI Interview - Taro (Oct 2025, London)",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Mistral-AI-Applied-AI-Engineer-Interview-Questions-EI_IE9945031.0,10_KO11,30.htm",
        "title": "Mistral AI Applied AI Engineer Interview Questions - Glassdoor",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "huggingface": {
    "loop_shape": "Recruiter screen (~30 min, behavioral + role fit) -> Technical screening (~1 hr video, covers HF APIs, model internals, software practices) -> Take-home assignment / collaborative exercise (real HF problem; presented in a follow-up) -> Final panel: 5 rounds for SWE - DS/algorithms, system design, role-specialization, behavioral, presentation. Average ~21 days, ~14 days for ML Engineer roles.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [
          "Take-home coding exercise: train a model in JavaScript (reported by candidate in 2024).",
          "Implement a feature or fix tied to a real problem HF is currently working on; present and defend the solution in a follow-up round."
        ],
        "notes": "Take-home is the signature filter. Often tied to genuine HF roadmap items - candidates report being asked to present the solution and explain thought process at the panel."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Record videos describing your vision for improving transformers (Paris ML role, Jan 2024).",
          "What innovative approaches do you envision for enhancing transformer efficiency and performance?",
          "Walk through your contributions to open-source ML libraries; discuss tradeoffs in transformer implementations."
        ],
        "notes": "Open-source contribution history heavily weighted. NLP / transformers depth expected. Candidates report situational questions involving HF products specifically - study the Transformers / Datasets / Accelerate / Hub APIs."
      },
      {
        "type": "coding",
        "sample_questions": [
          "Python coding rounds covering NLP libraries (Transformers, NLTK, spaCy), data preprocessing, text cleaning.",
          "DS/algorithms round (one of 5 SWE panel rounds in San Jose loop)."
        ],
        "notes": "Less LeetCode-heavy than peer companies; emphasis on practical Python + library fluency. Multiple programming languages valued."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Architect an NLP pipeline: data flow, storage, processing speed, resource management.",
          "Design a model-serving or inference pipeline (situational on HF products)."
        ],
        "notes": "System design exists but is less standardized than at OpenAI/Anthropic. Senior loops will see it; junior loops may not."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Past projects, collaboration approach, adaptability.",
          "Why Hugging Face / open-source motivation."
        ],
        "notes": "Final panel emphasizes culture fit, remote-first collaboration, and open-source ethos. Glassdoor candidates flag inconsistent communication post-take-home as the most common pain point."
      }
    ],
    "role_notes": "ML Engineer loops are shorter (~14 days) and lean into take-home + transformers depth. SWE loops in US offices report a more standard 5-round panel including DS/algorithms and system design. Limited public 2024-2025 question specifics; loop-shape inferred from 2-3 candidate reports + InterviewQuery guide.",
    "sources": [
      {
        "url": "https://www.interviewquery.com/interview-guides/huggingface-machine-learning-engineer",
        "title": "Hugging Face Machine Learning Engineer Interview Guide - InterviewQuery",
        "year": 2024
      },
      {
        "url": "https://www.glassdoor.com/Interview/Hugging-Face-Interview-Questions-E6487302.htm",
        "title": "Hugging Face Interview Experience & Questions - Glassdoor",
        "year": 2024
      },
      {
        "url": "https://www.index.dev/interview-questions/hugging-face-coding-challenges",
        "title": "Top 40 Hugging Face Coding Challenges for Senior Developers - index.dev",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "scaleai": {
    "loop_shape": "Recruiter screen (30 min) \u2192 HackerRank/take-home technical screen (medium-hard, often scenario-based) \u2192 virtual onsite loop (3-4 rounds in one day): coding, ML/system design, applied ML take-home (CV/NLP, ~1 week for ML roles), behavioral. Total ~1 month. For FDE roles: 6-7 interviews across 3-4 rounds, including data-product case studies (PySpark, messy data unification).",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement a card game per specifications (recurring favorite per multiple writeups)",
          "Build a task scheduler / task prioritization system based on priority and constraints (60-min live coding)",
          "Program character frequency ordering",
          "Parse JSON + apply multi-part logical constraints / interval manipulation",
          "Object-oriented design problem with parsing logic"
        ],
        "notes": "Python preferred. Practical/scenario-based rather than pure LeetCode. Topics: BFS, OOP, debugging, interval manipulation. Interviewers expect you to walk through code, justify decisions, fix mistakes live."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a language detection system",
          "Design a product recommendation system",
          "Design a next-word prediction system",
          "Design real-time annotation pipeline supporting high request throughput",
          "Design routing pipelines with message reliability, rate limiting, consistency across concurrent operations"
        ],
        "notes": "Heavy ML/data-infra flavor. Expects distributed-system depth + data integrity reasoning."
      },
      {
        "type": "take_home",
        "sample_questions": [
          "Computer vision pipeline take-home (~1 week)",
          "NLP take-home (~1 week)",
          "Q-learning / PyTorch exercise",
          "Spreadsheet of data columns \u2192 design a data product (FDE case)"
        ],
        "notes": "ML take-home is standard for ML-adjacent roles. Expect PySpark + data cleaning depth for FDE."
      },
      {
        "type": "fde_case",
        "sample_questions": [
          "Design a data product given a spreadsheet of real customer data columns",
          "Security-clearance-adjacent scenarios (gov vertical)",
          "Case studies grounded in messy real-world data unification"
        ],
        "notes": "Scale's FDE org has a strong gov-data flavor (Scale Federal). Adaptability and consistency matter more than algorithmic flash."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about a time you owned an ambiguous problem end-to-end",
          "Walk through a tradeoff between speed and correctness"
        ],
        "notes": "Values-based: problem-solving, collaboration, ownership, results-driven."
      }
    ],
    "role_notes": "FDE = customer/data-facing, more case-study weight, less LeetCode. SWE/ML Eng = more system design + algorithmic depth + ML take-home. New-grad FDE has its own pipeline (Scale Federal heavy).",
    "sources": [
      {
        "url": "https://www.interviewquery.com/interview-guides/scale-software-engineer",
        "title": "Scale AI Software Engineer Interview Guide",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/blog/scale-ai-interview-process",
        "title": "Get a Job at Scale AI: Interview Process and Top Questions - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Scale-Forward-Deployed-Engineer-Interview-Questions-EI_IE1656849.0,5_KO6,31.htm",
        "title": "Scale Forward Deployed Engineer Interview Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde",
        "title": "Forward Deployed Engineer Interview Definitive Guide - Exponent",
        "year": 2026
      }
    ],
    "confidence": "high"
  },
  "perplexity": {
    "loop_shape": "Recruiter outreach within ~3 business days \u2192 HR call (~45 min) \u2192 technical/coding screen (Python-heavy, practical) \u2192 onsite of 4-5 interviews including hiring-manager deep dive \u2192 final round with a founder/leader. Process is fast; question bank is small.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Array manipulation problem (e.g., transformations / windowed ops)",
          "String parsing problem",
          "Mini-project simulating a real coding task (production-quality expectation)",
          "Reduce latency in a retrieval pipeline (coding + reasoning)",
          "Add a new ranking signal safely to an existing pipeline"
        ],
        "notes": "Python required (codebase is Python-heavy). Not LeetCode-hard; evaluators look for edge-case handling, scale-readiness, maintainability \u2014 i.e., 'production quality'. Communication during coding is explicitly graded."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a RAG architecture: retrieve relevant docs from web \u2192 feed LLM as context \u2192 generate cited answer",
          "Design search infrastructure at scale (real-time web crawl + indexing)",
          "Design LLM serving with strict latency constraints",
          "Handle traffic spikes without degrading answer quality",
          "Cost-vs-latency tradeoff exercise for inference"
        ],
        "notes": "This is the most differentiated round. Perplexity rebuilt web search on LLMs, so system design lives in that domain. Caching, retrieval relevance, citation correctness all show up."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Beam search internals + when you'd tune it",
          "Embeddings: choice of model, dimensionality, indexing approach",
          "Inference optimization tradeoffs (batching, KV cache, speculative decoding)"
        ],
        "notes": "Asked of AI Engineer candidates specifically. SWE-Infra candidates get more reliability/debugging/data-structure depth instead."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Why Perplexity specifically (the founder round really probes this)",
          "Walk through how you'd ship a feature end-to-end at a fast startup",
          "Communication-under-pressure scenario"
        ],
        "notes": "Final founder/leader round is decisive \u2014 mission/conviction filter."
      }
    ],
    "role_notes": "AI Engineer \u2192 emphasis on beam search, embeddings, inference optimization, RAG. SWE Infra/Backend \u2192 reliability, debugging, data-structure design, traffic-spike handling. FDE not a major track here.",
    "sources": [
      {
        "url": "https://medium.com/@anqi.silvia/how-i-actually-passed-my-2025-perplexity-ai-interview-actual-questions-4007209bce5b",
        "title": "How I Actually Passed My 2025 Perplexity AI Interview - Anqi Silvia (Medium)",
        "year": 2025
      },
      {
        "url": "https://interview.norahq.com/interview-guides/perplexity-ai-software-engineer-interview-guide-2025",
        "title": "Perplexity AI Software Engineer Interview Guide 2025 - NoraHQ",
        "year": 2025
      },
      {
        "url": "https://www.perplexity.ai/hub/careers/interview-guide",
        "title": "Perplexity Interview Guide (official)",
        "year": 2025
      },
      {
        "url": "https://www.getbridged.co/company-reviews/perplexity",
        "title": "Perplexity AI Company Review 2025: Jobs, Culture & Interview Guide",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "cursor": {
    "loop_shape": "Recruiter/manager screen (30-45 min) \u2192 1-3 technical phone screens (60 min each, medium-hard coding, AI tools ALLOWED) \u2192 take-home (4-8 hrs for senior/staff) \u2192 1-2 day onsite (~8 hrs) project-based: design + build a feature on Cursor's stack \u2192 product/craft round \u2192 culture-fit chat. Total 3-5 onsite rounds. AI tooling (ChatGPT, Cursor itself) explicitly permitted throughout.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Print the top view of nodes in a binary tree",
          "Find duplicate files in a file system",
          "Build a hash tree to organize repository data",
          "Implement a syntax-aware edit operation (text-buffer primitive)",
          "Handle streaming LLM output (token-by-token application to a buffer)",
          "Model a multi-file diff with coordination/rollback"
        ],
        "notes": "Stack: TypeScript (product/editor), Rust (perf-critical), Python (ML). Problems lean toward editor primitives or applied-AI systems, not pure DSA. AI assistants and web search are allowed \u2014 they want to see how you use them well."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design the tab-prediction system with sub-100ms end-to-end latency for millions of users",
          "Design Cursor's agent mode executing multi-file edits with verification and rollback",
          "Design the privacy-preserving inference architecture",
          "Design an agentic AI system that handles hallucinations gracefully"
        ],
        "notes": "Latency obsession is the through-line. Expect to reason about KV cache, edge inference, draft models, eval harnesses."
      },
      {
        "type": "take_home",
        "sample_questions": [
          "Onsite project (8 hrs): 'Design a feature, product, or service you think could be useful' on Cursor's stack, with docs access",
          "Senior/staff: 4-8 hr take-home before onsite"
        ],
        "notes": "Project quality + product taste are decisive. They watch how you use Cursor on Cursor."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Fine-tune a model for code completion \u2014 what data, what eval?",
          "Context-retrieval strategy: how do you pick which snippets to put in the prompt?",
          "Build an eval harness for tab-completion quality"
        ],
        "notes": "ML-track candidates get a deeper round on this."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "What would you most like to build in Cursor?",
          "Compare Cursor to Copilot / Windsurf / Claude Code \u2014 what's broken about Cursor today?",
          "Why Cursor specifically?"
        ],
        "notes": "Product/craft round is described as 'decisive'. Heavy users of Cursor + thoughtful critics of competitors do best."
      }
    ],
    "role_notes": "Editor/Product SWE \u2192 TS-heavy, perf, UX latency. Infra/ML \u2192 Rust + Python, inference + training pipelines. Applied product eng \u2192 agent mode, tab prediction. Enterprise \u2192 team mgmt, security. Every track converges on the product/craft round.",
    "sources": [
      {
        "url": "https://www.techinterview.org/companies/cursor/",
        "title": "Cursor Interview Guide 2026 - Tech Interview Dot Org",
        "year": 2026
      },
      {
        "url": "https://www.tryexponent.com/guides/cursor-software-engineer-interview",
        "title": "Cursor Software Engineer Interview Guide - Exponent",
        "year": 2026
      },
      {
        "url": "https://www.glassdoor.com/Interview/What-would-you-most-like-to-build-in-Cursor-QTN_8617599.htm",
        "title": "Anysphere Glassdoor question: 'What would you most like to build in Cursor'",
        "year": 2025
      },
      {
        "url": "https://www.linkedin.com/posts/a16z_cursor-hires-every-engineer-and-designer-activity-7393733147504345090-vZTv",
        "title": "a16z LinkedIn: How Cursor's onsite interview process works",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "sierra": {
    "loop_shape": "Recruiter call (30 min, non-technical) \u2192 technical phone screen (multi-part, real-world scenario on CoderPad, Easy-Medium LeetCode) \u2192 debugging round (4-5 file codebase with ~3 bugs in an agent + diagram) \u2192 Agent Building (take-home with API key + 60-min onsite presentation) \u2192 Hiring Manager behavioral (60 min). They explicitly removed traditional algorithm interviews in favor of an 'AI-native onsite' (Plan / Build / Review).",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Multi-part problem: connect to an external API, transform the response objects, then extend with progressive requirements",
          "Real-world scenario problem on CoderPad with progressive constraints"
        ],
        "notes": "Python or TypeScript. Easy-Medium difficulty \u2014 they explicitly devalue algorithmic puzzle-solving."
      },
      {
        "type": "applied_ai",
        "sample_questions": [
          "Take-home: given an API key, build an agent with several tool-calling functions",
          "AI-native onsite \u2014 Plan phase: define a product with the interviewer",
          "AI-native onsite \u2014 Build phase: 2 hours, candidate's choice of AI tools/frameworks, ship a working agent",
          "AI-native onsite \u2014 Review phase: defend product/code decisions, production-readiness Q&A",
          "Debug a 4-5 file agent codebase with ~3 bugs given a target-behavior diagram"
        ],
        "notes": "This IS the loop. Sierra is the most committed of these 6 to replacing leetcode with end-to-end agent build/debug. They evaluate initiative, scoping judgment, agency when stuck, product thinking."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about a time you led a project end-to-end",
          "How do you make scoping tradeoffs under time pressure?",
          "Why Sierra / why customer-facing AI agents?"
        ],
        "notes": "Hiring-manager round. Ownership, collaboration, career alignment. Sierra explicitly hires 'for strengths, not absence of weakness.'"
      }
    ],
    "role_notes": "Agent Engineer (their flagship role) = the AI-native onsite track described above. APX (Applied/Agent product) similar. Forward-deployed-style customer work is part of the job but not labeled 'FDE' separately.",
    "sources": [
      {
        "url": "https://sierra.ai/blog/the-ai-native-interview",
        "title": "The AI-native interview - Sierra (official blog)",
        "year": 2024
      },
      {
        "url": "https://gaijineer.co/sierra-software-engineer-agent-interview-experience",
        "title": "Sierra Software Engineer, Agent Interview Experience - Gaijineer",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/courses/ai-company-interview-experiences/sierra-ai-agent-engineer-may-2025",
        "title": "Sierra AI Agent Engineer Interview, May 2025 - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/guides/sierra-agent-engineer-interview",
        "title": "Sierra Agent Engineer Interview Guide - Exponent",
        "year": 2026
      }
    ],
    "confidence": "high"
  },
  "cognition": {
    "loop_shape": "Recruiter screen \u2192 technical screen(s) (coding + systems knowledge) \u2192 onsite loop with pair-programming, mock customer enablement workshops, and architecture deep-dives. Total 2-4 weeks. Process is heavily weighted toward real-world scenarios from Devin/Windsurf customer reality, not abstract algorithms. NOTE: very few first-hand candidate writeups exist publicly \u2014 most published 'guides' are inferred from the Forward Deployed AI Engineer JD.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Stream-processing problem: detect error spikes in a log stream",
          "Aggregate data from multiple APIs and automate a workflow",
          "Implement a rate limiter",
          "Write a deployment orchestration script"
        ],
        "notes": "Python, TypeScript/JS, or Go accepted. Practical/automation flavor \u2014 matches the FDE-style job. Drawn from a synthesized guide, not from a verified candidate report."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Debug a Kubernetes CrashLoopBackOff scenario",
          "Latency investigation methodology for a Devin-style agent stack",
          "Securely connect Devin to an on-prem enterprise database",
          "Design around enterprise network/firewall constraints",
          "Distinguish a software bug from an LLM hallucination during triage"
        ],
        "notes": "Architecture troubleshooting more than greenfield design. Familiarity with Docker, Kubernetes, MCP (Model Context Protocol), distributed systems expected."
      },
      {
        "type": "fde_case",
        "sample_questions": [
          "ROLEPLAY: 'I am a customer who is very frustrated because Devin deleted a critical file in my repository. Walk me through your response.'",
          "How would you structure a 60-min onboarding workshop for senior engineers new to AI coding tools?",
          "Customer asks for a feature you cannot deliver \u2014 how do you handle it?",
          "Customer asks about roadmap items you don't know \u2014 how do you respond?"
        ],
        "notes": "Customer-enablement roleplays are a distinctive Cognition signature. They want 'aha moments,' active listening, structured guidance."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about a time you had to learn a new tech stack in days to solve a critical problem",
          "Time you built a tool to fix a team inefficiency",
          "Time you disagreed with engineering leadership and how it resolved",
          "Why applied AI / software agents?"
        ],
        "notes": "Startup-fit lens. Fast learning, autonomous execution, proactive process-building."
      }
    ],
    "role_notes": "Most published interview content describes the Forward Deployed AI Engineer / customer-facing track (heavy roleplay weight). Core product/research SWE loop is less documented publicly \u2014 assume more standard coding + systems depth there.",
    "sources": [
      {
        "url": "https://dataford.io/interview-guides/cognition/ai-engineer",
        "title": "Cognition AI Engineer Interview Guide 2026 - Dataford",
        "year": 2026
      },
      {
        "url": "https://cognition.ai/blog/devin-annual-performance-review-2025",
        "title": "Devin's 2025 Performance Review - Cognition (official, context only)",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "harvey": {
    "loop_shape": "Coding tech screen \u2192 onsite (coding + system design + behavioral). Notoriously selective; candidates report 'difficult, multi-part' screens at least LeetCode medium. Documentation use sometimes permitted on screens. For Legal Engineer track (non-SWE): JD + 3+ yrs at a Vault-50 law firm required \u2014 totally separate pipeline.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Design an in-memory hierarchical file system",
          "Design a constrained in-memory file system",
          "Handle multi-source string matching and tagging",
          "Count source appearances in LLM outputs",
          "Rebalance a red-black tree with running code expected",
          "Implement a geospatial partitioning scheme using R-trees",
          "Variations on minimum-cost-flow problems"
        ],
        "notes": "Data-structure-heavy and demanding. Beyond standard LC \u2014 they go into red-black trees, R-trees, min-cost flow. Multi-part screens are the norm."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a production file storage service",
          "Determine if two files are identical at scale",
          "Determine if two files are identical ignoring metadata",
          "Design a car dealership management system (per a reported onsite)"
        ],
        "notes": "Heavy emphasis on file-system / large-data design \u2014 fits their document-heavy legal-AI product."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about yourself",
          "What do you do outside of work? (Harvey reportedly indexes on outside-of-work excellence \u2014 competitive hobbies, sports, gaming, dance)"
        ],
        "notes": "Distinctive Harvey filter: they actively select for people who excel at something demanding outside their job. Culture is reported as intense/stressful."
      }
    ],
    "role_notes": "SWE = the loop above. Legal Engineer = a customer-success/forward-deployed role staffed by ex-Vault-50 lawyers; totally different pipeline (no coding). About 20% of Harvey staff are lawyers by design.",
    "sources": [
      {
        "url": "https://prachub.com/companies/harvey-ai/positions/software-engineer",
        "title": "Harvey AI Software Engineer Interview Questions - PracHub",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/harvey-ai/experiences/senior-software-engineer-united-states-august-21-2025-no-offer-neutral-f63b4d2c/",
        "title": "Harvey AI Senior Software Engineer Interview Experience, Aug 2025 - Taro",
        "year": 2025
      },
      {
        "url": "https://www.harvey.ai/blog/landing-a-job-at-harvey",
        "title": "The Ultimate Guide to Landing a Job at Harvey (official)",
        "year": 2025
      },
      {
        "url": "https://www.harvey.ai/company/careers/3fc0953f-8a03-46f2-8f4b-d12cf95f2800",
        "title": "Legal Engineer JD - Harvey (official)",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "stripe": {
    "loop_shape": "Recruiter screen -> HackerRank/technical phone screen (1hr live coding) -> 5-round virtual onsite (~5 hours): general coding, debugging/bug bash, integration, system design (API/architecture), behavioral. AI use is prohibited during the loop. Staff+ swap integration for a presentation round.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Build a simple version of Identity Access Management (IAM)",
          "Blur credit card numbers from logs (parsing/string processing)",
          "Design a rate limiter in any language",
          "LRU cache-style problems, interval overlap, greedy scheduling",
          "Generate Parentheses, Minimum Window Substring, Buy/Sell Stock"
        ],
        "notes": "Not LeetCode-style; emphasis on production-quality, readable code with descriptive names and helper functions. Hash maps, parsing, arrays/strings dominate."
      },
      {
        "type": "debugging",
        "sample_questions": [
          "Fix a GitHub issue in an unfamiliar codebase within 45-60 min",
          "Bug Bash: given real-ish code with a generic version of a real Stripe bug, locate and fix"
        ],
        "notes": "Tests ability to parse a GitHub issue with limited context, navigate a new codebase, form/test hypotheses, communicate the debugging process aloud."
      },
      {
        "type": "api_design",
        "sample_questions": [
          "Design a developer-facing API (payments, webhooks, idempotency)",
          "Design a payment processing API with clear resource modeling"
        ],
        "notes": "Stripe's signature round: clarity, naming, versioning, idempotency, error shapes. Treated separately from generic system design."
      },
      {
        "type": "fde_case",
        "sample_questions": [
          "Integration round: clone a private GitHub repo, ship a small feature using a real (often Stripe-like) API in 45-60 min",
          "File ops + data extraction tasks while learning a library from docs on the fly",
          "Handle external API interaction, response parsing, and continuous debugging"
        ],
        "notes": "Closest analog to FDE work. Graded on resourcefulness, doc-reading speed, judgment under pressure. Process signal can outweigh output."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a distributed payment processing system",
          "Design distributed data storage backing a developer API",
          "Design a developer-facing API end-to-end with scalability/reliability"
        ],
        "notes": "Heavy emphasis on API surface, reliability, and developer experience over raw scale tricks."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Ownership, user focus, craftsmanship, resilience stories",
          "Teamwork, deadline management, handling uncertainty",
          "Staff+ replaces integration round with a 1hr presentation"
        ],
        "notes": "Aligned to Stripe's operating principles. For Staff+, the presentation replaces integration."
      }
    ],
    "role_notes": "Stripe SWE loop is well-documented. There is no separately documented 2024-2025 FDE-specific loop, but Stripe's standard 'Integration' round is the closest public analog to FDE work (real repo + real API + ship-a-feature under time). FDE candidates should over-index on the integration and API design rounds and be ready to discuss merchant-facing edge cases. AI Engineer candidates can expect the same loop with the system-design round skewed toward API/data plumbing rather than ML systems.",
    "sources": [
      {
        "url": "https://interviewing.io/stripe-interview-questions",
        "title": "Stripe Interview Process & Questions - interviewing.io",
        "year": 2024
      },
      {
        "url": "https://medium.com/@diyaag2020/my-stripe-interview-experience-2025-2026-a-journey-to-the-final-round-19990fa6876a",
        "title": "My Stripe Interview Experience (2025-2026) - Diyaag",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/guides/stripe-swe-interview",
        "title": "Stripe Software Engineer Interview Guide - Exponent",
        "year": 2025
      },
      {
        "url": "https://leonstaff.com/blogs/stripe-interview-response-time-2025/",
        "title": "Stripe Interview Response Time 2025 + Integration Round - Leonstaff",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "ramp": {
    "loop_shape": "CodeSignal-style async OA (often called 'the Puzzle', 70-90 min, 3-4 problems) -> recruiter screen -> live technical phone screen (pair programming) -> virtual onsite: 2 coding rounds (one increasingly 'AI-enabled'), project deep dive, system design, behavioral with hiring manager.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [
          "CodeSignal OA: 70-90 min for 3-4 progressively harder problems",
          "Multi-step decoding / API interaction / file-system manipulation problem",
          "3Sum variation finding triplets summing to a target",
          "Stock buy/sell with up to two transactions (DP, 4 states)",
          "Expression evaluator with +, -, *, / and operator precedence using stacks"
        ],
        "notes": "Practical bent rather than pure competitive programming. Webcam-proctored. Correctness + speed both scored."
      },
      {
        "type": "coding",
        "sample_questions": [
          "Build a transaction ledger with refund support (OOP design)",
          "Pattern recognition in transaction logs with non-obvious twists",
          "Apply familiar frameworks/libraries to a realistic fintech problem"
        ],
        "notes": "Pair-programming style. Less LeetCode, more 'simulate real Ramp work'. One slot is now an 'AI-enabled' coding round that the team is still calibrating."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design components for a corporate card / expense management system",
          "Holistic, communication-heavy system design"
        ],
        "notes": "Less documented than coding rounds. Focus is on how the candidate thinks/communicates."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Hiring manager round on past projects and Ramp values fit",
          "Project deep dive on a recent technical project"
        ],
        "notes": "Holistic evaluation - candidates consistently report it's NOT a leetcode shop."
      }
    ],
    "role_notes": "Ramp's loop heavily rewards practical product-engineering instincts over algorithmic showmanship. Backend candidates should be ready to model real fintech objects (ledger, card, vendor, approval) cleanly. AI Engineer / FDE-adjacent candidates may see the 'AI-enabled' coding round where using Cursor/Copilot is expected.",
    "sources": [
      {
        "url": "https://www.linkjob.ai/interview-questions/how-to-ace-ramp-codesignal-assessment-tips-strategies/",
        "title": "How I Cracked the Ramp CodeSignal Online Assessment - LinkJob",
        "year": 2025
      },
      {
        "url": "https://medium.com/career-drill/ramp-sde-interview-experience-this-is-how-to-crack-it-debc3ab2876e",
        "title": "Ramp SDE Interview Experience - Career Drill / Medium",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "brex": {
    "loop_shape": "Recruiter screen -> technical screen (practical coding, often against an existing codebase or API task) -> virtual onsite (3-4 rounds): practical coding/debugging, system design, values/behavioral, sometimes a technical deep dive. 3-5 weeks end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement a rate limiter allowing X requests per minute per user",
          "Given a stream of transactions, aggregate spending by category and return top merchants",
          "Refactor code to handle error states and improve performance",
          "Building small back-end services or transforming JSON payloads"
        ],
        "notes": "Practical coding in an IDE (not whiteboard). OOP design, JSON transforms, concurrency/thread-safety frequently appear."
      },
      {
        "type": "debugging",
        "sample_questions": [
          "Locate and fix issues in an existing codebase under a time limit",
          "Trace through an existing service to find the failing case"
        ],
        "notes": "Distinct from the coding round; emphasizes attention to detail and reading-code skill."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a system that generates monthly expense reports for millions of users",
          "Architect real-time fraud detection for credit card transactions",
          "Design an API for corporate card issuance",
          "Financial ledger schemas, SQL vs NoSQL, idempotency"
        ],
        "notes": "Heavy on financial-domain modeling: ledger correctness, idempotency, async processing. PostgreSQL + AWS assumed."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "When did you challenge the status quo to improve a process?",
          "Describe a technical tradeoff you made to meet a deadline",
          "How do you handle mid-project requirement changes?",
          "Conflict with a PM and resolution"
        ],
        "notes": "Tied to Brex 'Dream Big' / ownership values."
      }
    ],
    "role_notes": "Brex stack is Kotlin/Java/Go/TypeScript + Postgres + AWS, so backend candidates fluent there have a leg up. The practical coding round is the key differentiator vs FAANG-style loops - bring an IDE muscle. No public FDE-equivalent loop; AI Engineer candidates should expect the standard SWE loop with system-design slant toward data/ML platform questions.",
    "sources": [
      {
        "url": "https://dataford.io/interview-guides/brex/software-engineer",
        "title": "Brex Software Engineer Interview Guide 2026 - Dataford",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/brex/experiences/senior-software-engineer-brazil-june-6-2024-no-offer-neutral-a82d0fe3/",
        "title": "Brex Senior Software Engineer Interview Experience - Jun 2024 - Taro",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "mercury": {
    "loop_shape": "Recruiter screen (~30 min) -> technical phone screen (~60 min, one medium-hard coding problem) -> optional take-home for senior roles -> virtual onsite (4-5 rounds): 2 coding (one algorithms, one applied fintech), system design, distinctive 'craft / type-system' round, behavioral with hiring manager.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Model a transfer lifecycle with failure paths",
          "Implement an idempotent processor for at-least-once delivery",
          "Build a rate limiter with fairness guarantees",
          "Parse structured financial data (e.g., ACH NACHA files)",
          "Approval-chain routing or ledger reconciliation across accounts (algos with fintech twist)"
        ],
        "notes": "Any mainstream language (Python, TypeScript, Java, Haskell). Applied correctness > language choice. Often an open-ended ~90-min applied problem with data/text files."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a banking-platform component (transfers, ledger, recurring payments)",
          "Discuss partner-bank failure contingencies post-Synapse 2024 collapse"
        ],
        "notes": "Banking-platform scenarios; reconciliation, idempotency, and partner-bank failure modes are live concerns."
      },
      {
        "type": "api_design",
        "sample_questions": [
          "Represent mutually exclusive states with sum types vs nullable fields",
          "Error handling: exceptions vs Result/Either",
          "Concrete examples from past work where types caught bugs",
          "Modeling invariants in a ledger or transfer flow"
        ],
        "notes": "The 'craft / type-system' round - Mercury's signature. Conversational; ML/Haskell/Rust/strict-TS backgrounds find it most natural. No ideological purity required, but thoughtful tradeoffs expected."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Hiring manager round on collaboration, prior projects, and openness to Haskell/Elm"
        ],
        "notes": "Mercury screens early for openness to functional/typed languages; hostility to FP is a fast no."
      }
    ],
    "role_notes": "Mercury uses Haskell backend + Elm frontend. You do not need Haskell experience, but you must show openness and an appetite for types/invariants. AI Engineer / FDE roles are rare here; most SWE candidates go through the same loop with applied fintech problems. The 'craft' round is the make-or-break differentiator. Mercury is sparse on public data - 2 credible sources only.",
    "sources": [
      {
        "url": "https://www.techinterview.org/companies/mercury/",
        "title": "Mercury Interview Guide 2026: Haskell/Elm Stack + Craft Round - Tech Interview",
        "year": 2025
      },
      {
        "url": "https://serokell.io/blog/haskell-mercury-functionalfutures",
        "title": "Haskell in Mercury: Interview with Max Tagher - Serokell",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "plaid": {
    "loop_shape": "Recruiter phone screen -> technical phone screen (practical coding) -> virtual onsite, 4-5 rounds: 1-2 coding (DS&A applied to real-world problems), system design, technical deep dive on past project, behavioral. End-to-end 3-5 weeks.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Write a function to identify and merge overlapping transaction time windows",
          "Implement an in-memory key-value store with TTL expiration",
          "Parse nested JSON bank account structures into a target schema",
          "Build a thread-safe rate limiter using token bucket",
          "Detect cycles in a microservice dependency graph"
        ],
        "notes": "DS&A grounded in real fintech scenarios. HashMap-heavy. Interviewer iterates by adding constraints. Production-readiness (error handling, edge cases) explicitly evaluated."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a system to securely ingest millions of daily transactions from various bank APIs",
          "Architect a highly available webhook notification service for customers",
          "Build a distributed logging system for internal AI tooling",
          "Design real-time duplicate transaction detection",
          "Create a feature store for real-time ML inference on network enablement"
        ],
        "notes": "Bank-API ingestion, webhook fanout, idempotency, and rate-limiting are core themes."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Handle model drift in production",
          "Design an automated retraining pipeline for transaction categorization",
          "Batch vs real-time inference tradeoffs for fraud detection",
          "Optimize a high-latency Python ML service",
          "Balance model accuracy against strict latency constraints"
        ],
        "notes": "ML/AI-Engineer-specific design questions - Plaid has a documented AI/ML role track."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Making critical technical decisions with incomplete information",
          "Disagreements with PMs and how you resolved them",
          "Production outage analysis and what you learned",
          "Failed projects and lessons applied",
          "Feature velocity vs technical debt"
        ],
        "notes": "Collaboration emphasized; candidates explicitly told to think out loud and articulate assumptions."
      }
    ],
    "role_notes": "Plaid has a clear public AI Engineer track with dedicated ML design questions (model drift, retraining pipelines, transaction categorization). Backend SWE candidates should over-index on bank-data ingestion + webhook design. FDE-equivalent role isn't separately documented; backend SWE loop covers it.",
    "sources": [
      {
        "url": "https://dataford.io/interview-guides/plaid/software-engineer",
        "title": "Plaid Software Engineer Interview Guide 2026 - Dataford",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/questions?company=plaid",
        "title": "Plaid Interview Questions (Updated 2026) - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/plaid/experiences/software-engineer-united-states-december-10-2024-no-offer-negative-9a197fa8/",
        "title": "Plaid Software Engineer Interview Experience - Dec 2024 - Taro",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "robinhood": {
    "loop_shape": "Recruiter call (30 min) -> Karat technical phone screen (1 hr: 30 min coding + 30 min system design) -> recruiter prep call -> 5-hour onsite (4 rounds): coding, 2x system design, past-project review -> hiring manager / team matching. 4-6 weeks total.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Medium-difficulty DS&A: binary trees, trees, linked lists, maps, strings, graphs",
          "Phone screen has 1-2 medium-difficulty problems alongside the design portion"
        ],
        "notes": "Correctness over scalability. Karat administers the phone screen. Python/Go/C++ preferred."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a stock exchange / trading engine",
          "Design a real-time market data feed",
          "Design a portfolio tracker",
          "Design a new Robinhood feature",
          "Design Twitter / Google Docs (generic warmups still appear)"
        ],
        "notes": "Two design rounds (~60 min each). Low latency, real-time streaming, pub/sub, event-driven systems, fault tolerance. Domain skew toward trading/markets is the defining feature."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Past project review with a prepared system diagram (1 hr)",
          "Hiring manager call on cultural fit and motivation"
        ],
        "notes": "Project review is a separate dedicated round, not just behavioral filler. Bring an architecture diagram."
      }
    ],
    "role_notes": "Robinhood is highly competitive (reported ~1% conversion). System design is the biggest weight - two rounds, both trading/markets flavored. SWE loop is standard; no documented FDE track. AI Engineer candidates should expect the SWE loop with project deep-dive emphasizing data/ML systems. Berkeley EECS + Amazon background fits this profile well; brush up on trading-engine and real-time pipeline patterns specifically.",
    "sources": [
      {
        "url": "https://interviewing.io/robinhood-interview-questions",
        "title": "Robinhood's Interview Process & Questions - interviewing.io",
        "year": 2024
      },
      {
        "url": "https://www.tryexponent.com/blog/robinhood-interview-process",
        "title": "Get a Job at Robinhood: Interview Process and Top Questions - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.systemdesignhandbook.com/guides/robinhood-system-design-interview/",
        "title": "Robinhood System Design Interview: The Complete Guide",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "datadog": {
    "loop_shape": "Recruiter call -> 1hr technical phone screen (CoderPad, 2 questions) -> ~4hr onsite with 2 coding rounds (1 dropped for Staff+), 1 system design, 1 behavioral, plus a signature project deep-dive round. Team matching happens AFTER the onsite (centralized hiring). ~6 weeks end-to-end. Questions are LC-medium + layered complexity, not verbatim LC.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Bucketing numbers under specific constraints",
          "Calculate total file/directory sizes recursively",
          "Build a buffered file writer using given interfaces",
          "Top K frequent messages within a sliding time window of T seconds",
          "Cycle detection in a directed graph of microservice dependencies",
          "K-th smallest element in a dynamically-growing number stream"
        ],
        "notes": "2 coding rounds onsite, CoderPad, 1hr each. Pair-programming style. Bar ~Google L4-L5."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design a system that surfaces relevant flight data and notifies users on matches",
          "Distributed rate limiting across many servers (token/leaky bucket)",
          "Real-time metric ingestion from millions of agents",
          "Fault-tolerant low-latency aggregation pipeline"
        ],
        "notes": "1hr, Excalidraw common. Failure modes (SPOFs, sliding-window log expiry, threshold false positives) graded. Observability bias."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Walk me through a complex past project; defend every architectural and tech decision",
          "Time you led an ambiguous project",
          "Teammate conflict resolution"
        ],
        "notes": "Signature project deep-dive. Generic 'drove outcomes' fails; bring numbers."
      }
    ],
    "role_notes": "Project deep-dive plays directly to Amazon+BrainPOP background. Backend/platform: emphasize observability/streaming. AI Eng likely adds applied ML round.",
    "sources": [
      {
        "url": "https://interviewing.io/datadog-interview-questions",
        "title": "Datadog's Interview Process & Questions",
        "year": 2024
      },
      {
        "url": "https://www.jobmentis.com/en/interviews/datadog/swe",
        "title": "Datadog SWE Interview Questions & Prep 2026 - JobMentis",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Datadog-Software-Engineer-Interview-Questions-EI_IE762009.0,7_KO8,25.htm",
        "title": "Datadog SWE Interview - Glassdoor",
        "year": 2024
      }
    ],
    "confidence": "high"
  },
  "mongodb": {
    "loop_shape": "Recruiter -> 1-2 live coding (Zoom + shared editor) -> EM call -> system design -> behavioral/values. Team-based. ~19 days avg. Concurrency + distributed-systems heavy.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Hash table-based DSA (45min screen)",
          "Dynamic programming problem",
          "Language-specific coding with strict edge cases + OOP quality",
          "Database/index-aware: efficient SQL/aggregation query"
        ],
        "notes": "Live shared editor. Graded on concurrency-safety, edge cases, OOP. 'No riddle questions' per MongoDB blog."
      },
      {
        "type": "coding",
        "sample_questions": [
          "Concurrency (60min): multithreading + locks; thread-safe DS or race-condition fix",
          "Producer/consumer with bounded buffer"
        ],
        "notes": "Dedicated concurrency round is a MongoDB signature. C++/Go/Java preferred."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design solution scaling to high concurrency/throughput/reliability with tradeoff proof",
          "CAP, Paxos/Raft, replication, sharding, consistency models",
          "Design a sharded KV / DB-internals-flavored design"
        ],
        "notes": "DB/distributed-systems internals favored. Knowing replica sets/oplog/sharding is an edge."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Successes/failures and lessons",
          "Project you owned end-to-end",
          "Why MongoDB? Why this team?"
        ],
        "notes": "Team-based interviewing - HM and teammates evaluate fit directly."
      }
    ],
    "role_notes": "Amazon distributed-systems experience reads strongly. AI Eng path = Atlas Vector Search / RAG infra. Practice lock-free + condition variables in C++/Go.",
    "sources": [
      {
        "url": "https://www.mongodb.com/company/blog/culture/recruiting-tips/how-prepare-your-engineering-interview-mongodb",
        "title": "How To Prepare For Your MongoDB Engineering Interview",
        "year": 2024
      },
      {
        "url": "https://www.interviewhelp.io/blog/posts/mongodb_senior_software_engineer_interview_questio/",
        "title": "MongoDB Senior SWE Interview Pattern - interviewhelp.io",
        "year": 2024
      },
      {
        "url": "https://www.glassdoor.com/Interview/MongoDB-Software-Engineer-Interview-Questions-EI_IE433703.0,7_KO8,25.htm",
        "title": "MongoDB SWE Interview - Glassdoor",
        "year": 2024
      }
    ],
    "confidence": "high"
  },
  "vercel": {
    "loop_shape": "Recruiter -> 45-60min TS phone screen -> take-home (3-5hr) -> 4-5 onsite: HM, coding, frontend deep-dive, system design (edge platform), product sense / CPO chat. ~3 weeks. Bar between Google L4-L5; Next.js/edge depth is the gate.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [
          "3-5hr focused project; code quality, API DX, write-up polish weighted",
          "Often the seed for the live coding round"
        ],
        "notes": "Polish/docs matter. TypeScript dominant. Code-as-product instincts graded."
      },
      {
        "type": "frontend",
        "sample_questions": [
          "dynamic='force-static' vs 'force-dynamic' on a Next.js page - what happens?",
          "Hydration mismatch debugging",
          "Server vs Client Components tradeoffs",
          "Suspense + streaming SSR; CSS-in-JS w/ React 19 streaming",
          "Build a stateful component/hook w/ async semantics"
        ],
        "notes": "RSC, Suspense, hydration, ISR, rendering pipeline. Failure-mode reasoning (SWR races, CDN purge consistency) wins."
      },
      {
        "type": "coding",
        "sample_questions": [
          "Parse/transform structured stream (command log)",
          "Retry with exponential backoff",
          "TS async/streams/error-boundary correctness"
        ],
        "notes": "~60min, LC-medium + applied twist. TS-first."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "ISR for 1M pages w/ per-route revalidation",
          "Edge middleware for multi-tenant serverless",
          "Streaming SSR @ 10K concurrent req/region",
          "Build cache w/ proper invalidation (CI + local)",
          "Deploy pipeline for Next.js across 50 edge regions"
        ],
        "notes": "Cold-start avalanche, SWR, CDN purge consistency, cache invalidation."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Why Vercel? Shipping velocity stories",
          "Product sense: shown a feature - what would you change?"
        ],
        "notes": "CPO chat. Judgment > feature-listing. Real product usage screened."
      }
    ],
    "role_notes": "AI Eng pathway = v0 / AI SDK team (best fit with BrainPOP background). Frontend deep-dive is the biggest stretch for Amazon-SDE-heavy profile; invest prep here. Backend/Platform: edge-runtime + cache invalidation system design.",
    "sources": [
      {
        "url": "https://www.techinterview.org/companies/vercel/",
        "title": "Vercel Interview Guide 2026: Next.js, Edge Runtime, Turbopack",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Vercel-Senior-Software-Engineer-Interview-Questions-EI_IE6510369.0,6_KO7,31.htm",
        "title": "Vercel Senior SWE Interview - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/companies/vercel",
        "title": "Interviewing at Vercel (2025) - Exponent",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "notion": {
    "loop_shape": "Recruiter -> technical phone screen -> onsite w/ 4 rounds: Coding, Software Design, Domain Interview, Hiring Manager/Career. Startup-y, non-rigid; practical scenarios anchored to Notion's product. AI-enabled coding round (Claude Code / Cursor) recently added.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Simulate Notion's table aggregation: count, sum, average",
          "Follow-up: immutable vs mutable tables w/ lazy caching + incremental maintenance",
          "Row/cell operations on a sheet/block tree"
        ],
        "notes": "Practical, not pure LC. Anchored to Notion product logic. AI-enabled round screens Claude Code/Cursor fluency."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design task scheduler w/ priority queue reasoning ('why this queue? how priority adjusted?')",
          "Design Notion's real-time collaborative editor (OT vs CRDTs)",
          "Permissioned workspaces (workspace/page/block granularity)",
          "Offline-first sync + reconnection",
          "Block-based data model (nested/linked/styled)",
          "Full-text search across millions of blocks"
        ],
        "notes": "Open-ended. CRDT vs OT tradeoffs probed. Common failure: treating multiplayer as generic pub/sub."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Career interview w/ HM - aspirations + Notion values fit",
          "Domain interview - depth in a claimed area"
        ],
        "notes": "Values-fit gates the final stage."
      }
    ],
    "role_notes": "AI Engineer pathway is strong (Notion AI). Product-attuned reasoning > pure systems chops. Backend/Platform: master CRDT/OT + block-graph modeling. Claude Code/Cursor fluency now actively screened (real divergence from FAANG).",
    "sources": [
      {
        "url": "https://www.systemdesignhandbook.com/guides/notion-system-design-interview/",
        "title": "Notion System Design Interview Guide",
        "year": 2025
      },
      {
        "url": "https://programhelp.net/en/vo/notion-sde-interview-experience/",
        "title": "Notion SDE Interview - 4 rounds VO experience",
        "year": 2024
      },
      {
        "url": "https://www.glassdoor.com/Interview/Notion-Labs-Software-Engineer-Interview-Questions-EI_IE3304926.0,11_KO12,29.htm",
        "title": "Notion Labs SWE Interview - Glassdoor",
        "year": 2024
      }
    ],
    "confidence": "med"
  },
  "figma": {
    "loop_shape": "Recruiter (30min) -> HM call (45min) -> CoderPad phone screen (60min) -> sometimes take-home (3-5hr mini collab editor) -> ~4hr onsite: coding, two system design (one Figma-flavored, one role-specific), behavioral, project deep-dive. 3-4 weeks. Bar ~Google L4-L5; frontend bar > backend bar.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement a Figma doc w/ layers, properties, class definitions, update mechanisms",
          "Print objects on a 2D canvas: left-to-right, top-to-bottom",
          "Tries/autocomplete; range trees for selection; structured stream parsing",
          "State machines: undo/redo, selection, focus"
        ],
        "notes": "CoderPad, 60min, TS/Python/Rust. Frontend-applied flavor (DOM diffing, command-pattern undo). Unprompted edge-case calling graded."
      },
      {
        "type": "frontend",
        "sample_questions": [
          "Browser rendering pipeline: layout, paint, composite triggers",
          "Canvas vs DOM vs WebGL tradeoffs (Figma's renderer is custom WebGL)",
          "Bundle splitting + memory profiling",
          "Input handling: IME composition, pointer events"
        ],
        "notes": "Highest-signal round for FE. Figma's renderer is custom WebGL/wasm - React-lifecycle answers fail."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Backend for live cursors",
          "Conflict resolution for simultaneous text edits (RGA/CRDT specifics)",
          "Multi-user concurrent feature (e.g., poll)",
          "Figma components: scaling + storage"
        ],
        "notes": "Two SD rounds. Interviewers push past generic pub/sub until CRDT-specific reasoning emerges."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Project deep-dive w/ concrete metrics",
          "Why Figma? (real product usage screened)",
          "Conflict, ambiguity, ownership"
        ],
        "notes": "Numbers required, not 'drove outcomes'."
      }
    ],
    "role_notes": "Critical divergence: FRONTEND roles get the additional FE deep-dive + higher bar (custom WebGL renderer). For Amazon+AI Eng profile, BACKEND/Platform/Infra is the more natural fit. If targeting FE, build a toy CRDT editor. AI Eng = Figma AI/Make/FigJam AI.",
    "sources": [
      {
        "url": "https://interviewing.io/figma-interview-questions",
        "title": "Figma's Interview Process & Questions",
        "year": 2024
      },
      {
        "url": "https://www.techinterview.org/companies/figma/",
        "title": "Figma Interview Guide 2026: Collaborative Editor, CRDTs, FE Performance",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Figma-Software-Engineer-Interview-Questions-EI_IE1537286.0,5_KO6,23.htm",
        "title": "Figma SWE Interview - Glassdoor",
        "year": 2024
      }
    ],
    "confidence": "high"
  }
};

if (typeof window !== 'undefined') window.INTERVIEW_QUESTIONS_2026 = INTERVIEW_QUESTIONS_2026;
if (typeof module !== 'undefined') module.exports = { INTERVIEW_QUESTIONS_2026 };
