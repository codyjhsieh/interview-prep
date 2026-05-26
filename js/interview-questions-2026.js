/* ─── Interview question bank (2026 compile, all 138 companies) ──── */

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
  },
  "decagon": {
    "loop_shape": "Recruiter screen -> 2x 45-min CoderPad technical screens -> onsite virtual loop: 60-min coding pair, 60-min system design (AI-agent flavored), 60-min past-project deep dive + behavioral. Total cycle ~3-4 weeks. SDE bar is high (ex-OpenAI founders); LC medium-hard with emphasis on basic DSA over DP/greedy.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "LeetCode medium-to-hard problems via CoderPad (2x45min pre-onsite)",
          "Practical TypeScript/Python problems with concurrency or LLM-tooling patterns (onsite pair)"
        ],
        "notes": "Two pre-onsite screens + one onsite pair round. Emphasis is on basic data structures and algorithms; explicitly de-emphasizes DP and greedy. CoderPad collaboration / verbal reasoning matters as much as correctness."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design an AI agent system that resolves customer support tickets autonomously",
          "Design knowledge ingestion and retrieval for company-specific support documents",
          "Design an evaluation framework that measures autonomous resolution quality",
          "Reported recent variant: AI gateway with auditability requirements"
        ],
        "notes": "Heavy AI-agent / RAG / eval framework slant. Expect to talk about tool-use loops, hallucination guardrails, and offline eval pipelines even for SDE roles."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Past-project deep dive: pick a recent project you led and defend the technical decisions",
          "Why Decagon vs. a horizontal AI lab?"
        ],
        "notes": "60-min deep dive + behavioral combined. Founder-aligned 'why this company' matters; they probe ownership and ambiguity tolerance."
      }
    ],
    "role_notes": "Backend/Platform SDE loop is the same structure as AI Engineer loop; the AI/agent context is baked into both. As a Berkeley + Amazon SDE, the SDE-fit angle is leaning into platform/infra in your past-project deep dive (eval infra, agent runtime, retrieval pipelines).",
    "sources": [
      {
        "url": "https://www.techinterview.org/companies/decagon-interview-guide/",
        "title": "Decagon Interview Guide (2026): AI-Powered Customer Support",
        "year": 2025
      },
      {
        "url": "https://www.1point3acres.com/interview/thread/1165483",
        "title": "Decagon Fulltime SDE Onsite Interview: New System Design Problem",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Decagon-Software-Engineer-Interview-Questions-EI_IE2972902.0,7_KO8,25.htm",
        "title": "Decagon Software Engineer Interview Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.teamblind.com/post/decagon-interview-system-design-6sphav4u",
        "title": "Decagon Interview System Design - Blind",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "credal": {
    "loop_shape": "Intro conversation with CTO -> candidate-choice between take-home assignment OR live whiteboard tech screen -> onsite at NYC Dumbo office: meet engineering team + CEO. Founding-SWE bar is 5+ YOE; full-stack TypeScript/React/Postgres + AWS/K8s expected.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [],
        "notes": "Candidate-choice: take-home OR live whiteboard. No public take-home prompts surfaced. Given stack (TS/NextJS/Postgres + LLM APIs), expect a feature-build (e.g., wire up a multi-LLM endpoint with auth + audit log) similar to other YC AI take-homes."
      },
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "Whiteboard tech screen as alternative to take-home. No specific questions in public sources. Likely problem-solving over LC-style pure algos given founding-SWE framing."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Initial CTO conversation: background + ownership examples",
          "Onsite culture fit with engineering team + CEO"
        ],
        "notes": "High-ownership signal is explicitly screened for: 'proven ability to own things from ambiguous start to clean finish.'"
      }
    ],
    "role_notes": "Limited public 2024-2025 data; loop-shape inferred from YC job post + role framing. Series-A enterprise-AI-control-plane startup; backend/platform SDE work is the core product (data governance, sync pipelines, LLM proxy). Expect heavier infra/security framing than at a chat-style AI company.",
    "sources": [
      {
        "url": "https://www.ycombinator.com/companies/credal-ai/jobs/Z6XipH7-founding-software-engineer-full-stack",
        "title": "Founding Software Engineer, Full-Stack at Credal.ai - YC",
        "year": 2025
      },
      {
        "url": "https://credal.ai/careers",
        "title": "Careers | Credal",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "mirage": {
    "loop_shape": "Limited public 2024-2025 data; loop-shape inferred from role-mix (senior/staff+ only), vertical (gen-video foundation models), and stage (Series A, Sequoia/a16z). Likely: recruiter screen -> coding screen (CoderPad, 60min) -> onsite at NYC Union Square HQ with 2 coding rounds, 1 system design (likely video/inference flavored), 1 founder/leadership behavioral. In-person required.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "No public questions surfaced. Inferred from stage/role-mix: 2 coding rounds at LC-medium-to-hard, likely Python given ML-heavy stack."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Inferred. Likely video-generation infra topics: design a low-latency inference serving layer, design a video processing pipeline with GPU scheduling, or design an asset/render pipeline."
      },
      {
        "type": "applied_ai",
        "sample_questions": [],
        "notes": "Inferred from 'Applied AI Engineer' role posting. Likely model evaluation, capability probing, or fine-tuning workflows."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "Inferred. 'Senior/staff+ scope' + 'end-to-end product ownership' framing means founder-style behavioral probing on autonomy and shipping velocity."
      }
    ],
    "role_notes": "Rebranded from Captions in 2025. Hires only senior/staff+; in-person NYC required. No backend/Platform-only role surfaced - most roles are Applied-AI / full-stack with model touchpoints. As pure SDE, you'd likely be evaluated on full-stack product surfaces (UI + backend + model calls).",
    "sources": [
      {
        "url": "https://jobs.ashbyhq.com/mirage",
        "title": "Mirage Jobs - Ashby",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/The-Mirage-Interview-Questions-E39600.htm",
        "title": "The Mirage Interview Experience & Questions - Glassdoor",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "tavily": {
    "loop_shape": "Initial recruiter/founder call -> role-relevant technical assessment (likely RAG/agent design oriented) -> conversations with team members. Total 2-4 weeks application-to-offer. Small Series-A-ish search-API-for-agents company; loop is lighter than mid-stage standard.",
    "rounds": [
      {
        "type": "applied_ai",
        "sample_questions": [
          "What is RAG? How would you design a RAG system to generate articles to a user based on passed-in information?",
          "AI agent design oriented questions",
          "ML/LLM fundamentals"
        ],
        "notes": "Primary technical signal is around RAG and agent design rather than pure algorithmic coding. Discussion-style rather than CoderPad."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Culture/fit discussion: what do you need from us, what we need from you, what it means to work at a startup"
        ],
        "notes": "Explicit startup-fit screen. Small team - expect to talk to most of engineering."
      }
    ],
    "role_notes": "Limited public 2024-2025 data; loop-shape inferred from Glassdoor (Tavily Inc) + careers page. Search-API-for-agents product. SDE/Backend candidates should expect to spend more time on RAG/agent reasoning than DSA. Stage means no formal multi-round system design.",
    "sources": [
      {
        "url": "https://www.glassdoor.com/Interview/Tavily-Inc-Interview-Questions-E10232651.htm",
        "title": "Tavily Inc Interview Experience & Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.tavily.com/careers",
        "title": "Careers | Tavily",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "normal-computing": {
    "loop_shape": "Limited public 2024-2025 data; loop-shape inferred from role-mix (production-AI + thermodynamic-hardware), vertical (deep-tech infra), and stage (Series A, NYC, founded by ex-Google Brain/Alphabet X/Palantir). Likely: recruiter screen -> tech phone screen (Python + distributed systems) -> 4-5 round virtual onsite with 2 coding, 1 system design (distributed/ML infra), 1 deep dive on production AI work, 1 founder/behavioral.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "Inferred. Strong Python + distributed-systems requirement signals LC-medium-to-hard + concurrency / data-pipeline-flavored questions."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Inferred. Distributed-systems & production-AI infra focus. Likely topics: design a document-understanding pipeline, design an agentic workflow runtime, ML training infra."
      },
      {
        "type": "applied_ai",
        "sample_questions": [],
        "notes": "Inferred. Heavy preference for candidates who have shipped production AI involving language models / agentic workflows."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "Deep-tech founders -> expect first-principles probing and 'why thermo-computing' interest signal."
      }
    ],
    "role_notes": "Two tracks: (1) AI Engineer / Software Engineer on the application platform (doc understanding, agents) - this is the SDE-fit lane. (2) Research Engineer on thermodynamic-computing hardware - PhD/researcher lane. For backend/platform SDE, focus on track 1.",
    "sources": [
      {
        "url": "https://jobs.ashbyhq.com/Normal%20Computing%20AI",
        "title": "Normal Computing Corporation Jobs - Ashby",
        "year": 2025
      },
      {
        "url": "https://simplify.jobs/p/ed4220bb-a73b-4783-8f2c-82b720c08cc1/AI-Engineer",
        "title": "AI Engineer @ Normal Computing - Simplify",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "distyl": {
    "loop_shape": "5-round video interview process per candidate report: initial screening -> AI-based coding assessment -> system design round -> additional technical/behavioral rounds -> final with Director of Engineering. Medium difficulty / reasonable bar. Hybrid 3 days/week (T/W/Th), 25-50% customer travel.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Technical overview of Python scripts and Dockerfiles",
          "Correcting errors a junior engineer might make in code"
        ],
        "notes": "Practical Python + Docker focus rather than pure LC. Code-review style debugging questions appear."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Discussion of CI/CD and service orchestration"
        ],
        "notes": "DevOps/orchestration flavor. AI-system design likely overlays the platform-engineering questions."
      },
      {
        "type": "fde_case",
        "sample_questions": [],
        "notes": "Distyl is fundamentally an FDE / Palantir-style consultancy model serving enterprise customers. Expect a customer-scenario round even on SDE tracks. No specific case prompts surfaced publicly."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Discussion of past projects with ownership framing"
        ],
        "notes": "Final round with Director of Engineering is heavily behavioral / past-project."
      }
    ],
    "role_notes": "FDE-heavy company - the bulk of their roles are Forward Deployed AI Engineer (not pure backend/platform). 2+ YOE minimum, Python core. As an Amazon SDE pivoting here, expect to be evaluated more on customer-empathy + shipping under ambiguity than pure infra depth.",
    "sources": [
      {
        "url": "https://www.1point3acres.com/interview/thread/1156132",
        "title": "Distyl Fulltime ML/AI Engineer 5-Round Video Interview Experience",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.co.nz/Interview/Distyl-AI-Interview-Questions-E10705947.htm",
        "title": "Distyl AI Interview Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://jobs.ashbyhq.com/Distyl/ec9e338a-4040-4aa2-b049-424cd343f5f5",
        "title": "Forward Deployed AI Engineer @ Distyl AI - Ashby",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "glean": {
    "loop_shape": "Recruiter screen -> 1-2 technical phone screens (algorithmic, sometimes practical) -> 4-5 hour onsite (typically virtual): advanced algorithmic coding, system design, behavioral with HM, and a signature 2-hour practical coding assignment. Considered a high bar even by mid-stage standards.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Implement a Graph DFS to solve a connectivity problem",
          "Write a program to play Connect 4, including logic to detect a winner",
          "Rotate a 2D image/matrix in place",
          "Merge multiple sorted arrays efficiently"
        ],
        "notes": "LC medium-to-hard difficulty. Clean, bug-free code at speed; explicit edge-case probing."
      },
      {
        "type": "take_home",
        "sample_questions": [
          "2-hour practical assignment: build a functional piece of software or complex module from a prompt",
          "Build a small application that processes a stream of events"
        ],
        "notes": "The signature differentiator. NOT a long-form take-home - it's a timed 2-hour onsite assignment evaluated on code organization, modularity, and shipping a working solution. Distinguishes Glean from pure-LC shops."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "Design the API and database schema for a feature (e.g., a commenting system)",
          "How would you test a public-facing API? Describe the test scenarios"
        ],
        "notes": "Enterprise-search context. Topics that recur: knowledge graphs, data ingestion at scale, multi-tenant permissions."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Tell me about a time you had to handle a difficult situation with a coworker",
          "Describe a project where you went above and beyond your defined responsibilities",
          "Why a startup like Glean vs. big tech?"
        ],
        "notes": "Behavioral round is with hiring manager."
      }
    ],
    "role_notes": "SDE / Backend / Platform is the dominant Glean track (enterprise search, knowledge graphs, ingestion infra). LLM exposure valued but not required. As a Berkeley + Amazon SDE, this is one of the higher-fit companies in this bucket - the loop maps cleanly to FAANG-style prep + their 2-hr practical.",
    "sources": [
      {
        "url": "https://dataford.io/interview-guides/glean-(ca)/software-engineer",
        "title": "Glean (CA) Software Engineer Interview Guide 2026",
        "year": 2025
      },
      {
        "url": "https://www.1point3acres.com/interview/thread/1141498",
        "title": "Glean Fulltime SDE Onsite Algorithm Interview Experience",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/Glean-CA-Interview-Questions-E5795738.htm",
        "title": "Glean (CA) Interview Experience & Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.interviewdb.io/question/glean",
        "title": "Glean Interview Questions (Updated May 2026)",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "elevenlabs": {
    "loop_shape": "Recruiter screen -> 90-min async CoderPad coding screen (2-3 LC-style problems incl. medium-hard) -> virtual onsite: behavioral, coding round, and a 'Product Decomposition' round (system design + product/UI hybrid, no code written). Timeline 4-5 weeks. FDE track adds a Case Study round and Founder interview.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Tree traversal algorithms",
          "Detecting cycles in linked lists",
          "Implementing sorting algorithms with time-complexity explanations",
          "Onsite: problems flavored around audio file management, video processing, dubbing"
        ],
        "notes": "Async screen: 1:30 for 2 mediums + 1 medium-hard. Onsite coding round is reported as the most difficult; interviewers may nudge you toward their internal solutions."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Combined with product round - see Product Decomposition below."
      },
      {
        "type": "api_design",
        "sample_questions": [
          "Product Decomposition round: design a solution end-to-end from UI to backend database schema, no code written"
        ],
        "notes": "Distinguishing round. Hybrid of system design + product/UI thinking. Tests whether you can decompose a real product feature into components, contracts, and storage."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Deep dive on a project you owned or led, with explicit focus on production shipping",
          "Passion / 'why audio synthesis or AI?' framing"
        ],
        "notes": "Behavioral round is NOT generic culture fit - it's a product/ownership deep dive. Production-shipped work strongly preferred over personal projects."
      },
      {
        "type": "fde_case",
        "sample_questions": [
          "FDE track only: customer-problem case study with diagramming"
        ],
        "notes": "Only present in the Forward Deployed Engineer loop. Includes a separate founder round at the end."
      }
    ],
    "role_notes": "SDE loop = coding screen + onsite coding + product decomposition + behavioral. FDE loop swaps in CodeSignal coding assessment + case study + founder round. Behavioral is sprinkled throughout FDE rounds (no dedicated behavioral). For Backend/Platform-leaning SDE, the Product Decomp round is the big delta from FAANG - prep UI/UX + db-schema thinking, not just box-and-arrow distributed systems.",
    "sources": [
      {
        "url": "https://www.tryexponent.com/guides/elevenlabs-software-engineer-interview",
        "title": "ElevenLabs Software Engineer Interview | Sample Questions - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/guides/elevenlabs-forward-deployed-engineer-interview",
        "title": "ElevenLabs Forward Deployed Engineer Interview - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/experiences/eleven-labs-software-engineer-interview-8e1b37",
        "title": "ElevenLabs Software Engineer, Full Stack Interview Experience",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "rilla": {
    "loop_shape": "Lightweight loop (~10-12 days end-to-end): casual chat with an engineer about background -> coding round in their domain space (voice/conversation intelligence). In-person onsites held in NYC. Difficulty self-reported moderate (2.9/5).",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "Build a tool in the voice AI space (domain-specific coding round)"
        ],
        "notes": "Coding is domain-flavored rather than pure LC. Expect to work with audio/transcript-shaped data."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "Reported as 'casual chat about experience and interests' rather than structured behavioral. Small-team feel."
      }
    ],
    "role_notes": "Limited public 2024-2025 data on full SDE loop; loop-shape inferred from Glassdoor self-reports + small-stage NYC startup pattern. Two job-page tracks: 'Software Engineer' (generalist) and 'Software Engineer, Applied AI'. As a backend/platform candidate, expect to be evaluated as a generalist - Rilla is small enough that platform vs. AI vs. product roles blur.",
    "sources": [
      {
        "url": "https://www.glassdoor.com/Interview/Rillavoice-Interview-Questions-E9238383.htm",
        "title": "Rilla Interview Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://jobs.ashbyhq.com/rilla/fad15157-b4cc-44ff-92b7-4afd4fe3388e",
        "title": "Software Engineer, Applied AI @ Rilla - Ashby",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "langchain": {
    "loop_shape": "Non-traditional loop. Hiring manager chat (non-technical) -> coding assignment on LangChain's actual codebase (1 day on-site or 1 week remote, 2 parts: data-layer feature + service endpoint with spec/tests) -> 60-min system design split into 2x 30-min halves (analyze existing service architecture + design a new product feature). AI tools allowed during assignment; Slack channel for spec clarification (not implementation help). 5+ YOE bar.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [
          "Part 1: Implement a new feature within LangChain's existing data layer",
          "Part 2: Build a service endpoint with full spec and test cases"
        ],
        "notes": "Multi-part build inside their real codebase. Evaluated on: navigating unfamiliar code, implementation quality, clarifying ambiguous requirements, resourcefulness. NOT traditional LC - explicitly skip algorithmic puzzle prep."
      },
      {
        "type": "system_design",
        "sample_questions": [
          "First 30min: Analyze LangChain's service architecture for weaknesses, bottlenecks, scaling concerns",
          "Second 30min: Design a new product feature - event logging, alarm system, or observability tools"
        ],
        "notes": "Live analysis of their own architecture is unusual. They want production-system reasoning, not textbook patterns."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Background, motivation, and product interest discussion with hiring manager"
        ],
        "notes": "Single non-technical conversation up front. No separate behavioral round at the end."
      }
    ],
    "role_notes": "Cross-track: same loop covers LangSmith (observability), LangGraph (orchestration), and core OSS library. SDE / Backend / Platform fit is strong - the loop literally tests you on real backend service code. AI Engineer divergence is small; the company assumes everyone has some AI tool familiarity. Big preparation delta vs. FAANG: do NOT grind LC, instead study production-system reasoning + reading large unfamiliar Python codebases.",
    "sources": [
      {
        "url": "https://www.tryexponent.com/guides/langchain-software-engineer-interview-guide",
        "title": "LangChain Software Engineer Interview Guide | Sample Questions - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/courses/ai-company-interview-experiences/langchain-swe-feb-2025",
        "title": "LangChain Interview | Software Engineer | February 2025 - Exponent",
        "year": 2025
      },
      {
        "url": "https://www.tryexponent.com/guides/langchain-deployed-engineer-interview",
        "title": "LangChain Deployed Engineer Interview Guide - Exponent",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "baseten": {
    "loop_shape": "Recruiter screen -> ~1 hour ML-flavored coding take-home (not LC-style) -> half-day virtual onsite with multiple technical coding rounds covering data modeling, coding fundamentals, and ML-related problems. FDE track adds explicit product-intuition + customer-comm screening in parallel to the standard technical bar.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [],
        "notes": "Time-boxed ~1 hour. ML-related and 'relevant rather than straight from LeetCode.' No public prompts surfaced. Inference-platform context suggests it touches deploying/serving a small model or wiring up an inference endpoint."
      },
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "Multiple coding rounds in the onsite. Mix of data modeling, coding questions, and ML-flavored problems. Rooted in DSA fundamentals but ML-adjacent. No specific public prompts."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "System design is woven into the technical rounds rather than a single dedicated slot. Expect ML-serving infra topics: GPU inference scheduling, model deployment, autoscaling, request batching."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "FDE track explicitly screens for: deep curiosity across stack (ML/infra/networking), customer empathy, 'PM hat' for pattern-spotting in customer requests, bias to action, founder mindset. SDE track has standard behavioral."
      }
    ],
    "role_notes": "Backend/Platform SDE fit is strong - Baseten is fundamentally ML infrastructure. They explicitly prefer engineering fundamentals over ML expertise ('engineers who operate comfortably across different stacks can quickly pick up ML fundamentals on the job'). FDE divergence: parallel product-intuition screen, but same technical bar. As an Amazon SDE, the platform/infra background transfers directly.",
    "sources": [
      {
        "url": "https://www.interviewquery.com/interview-guides/baseten",
        "title": "Baseten Interview Guide - Interview Query",
        "year": 2025
      },
      {
        "url": "https://www.baseten.co/blog/forward-deployed-engineering/",
        "title": "Forward deployed engineering on the frontier of AI - Baseten Blog",
        "year": 2025
      },
      {
        "url": "https://gamma.app/docs/Baseten-interview-preparation-guide-Engineering-onsite-u7754eb285tzui2",
        "title": "Baseten interview preparation guide: Engineering onsite",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "deepgram": {
    "loop_shape": "Recruiter screen -> tech screen (no coding - technical experience discussion + DS fundamentals) -> take-home project (build a basic app) -> 2.5-hour virtual onsite: 90 min expanding on the take-home, 15 min break, 45 min with hiring manager. Total ~4 weeks. Reports of inconsistent recruiter follow-through.",
    "rounds": [
      {
        "type": "take_home",
        "sample_questions": [],
        "notes": "Build a basic app. The expansion happens live in the onsite (90-min block). No specific public prompts surfaced, but given Deepgram is speech-to-text, expect something that consumes their API or transcript data."
      },
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "No traditional LC coding round. The 90-min onsite block is effectively the coding round - extending the take-home app live with the interviewer."
      },
      {
        "type": "debugging",
        "sample_questions": [],
        "notes": "Tech screen is described as 'no coding, just technical questions on experience plus data structure fundamentals' - more of a verbal technical interview / past-project probe."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "Final 45 min with hiring manager. No specific prompts in public sources. Standard fit/motivation framing."
      }
    ],
    "role_notes": "Strongly take-home-centric loop - this is the dominant signal. As a Berkeley + Amazon SDE, the take-home is where you should invest 90% of your prep time. ML/Research Scientist track has a different loop (HackerRank ML challenge + research interview); SDE track does NOT touch HackerRank. Light loop overall compared to FAANG.",
    "sources": [
      {
        "url": "https://www.glassdoor.com/Interview/Deepgram-Interview-RVW87576955.htm",
        "title": "Deepgram Software Engineer Interview Questions - Glassdoor",
        "year": 2024
      },
      {
        "url": "https://deepgram.com/careers",
        "title": "Careers - Deepgram",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "assemblyai": {
    "loop_shape": "Recruiter screen -> hiring manager chat -> HackerRank code challenge (1 LC easy + 1 LC hard) -> take-home assessment -> 3 x 40-min interviews with team + executive: design whiteboard, cultural roundtable, live debug/refactor. Total ~3 weeks, 24-day average.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [
          "HackerRank: 1 LeetCode-easy problem + 1 LeetCode-hard problem"
        ],
        "notes": "Unusual difficulty distribution (easy + hard, no medium). Live debugging and refactoring code also reported in the onsite."
      },
      {
        "type": "take_home",
        "sample_questions": [],
        "notes": "Reported as 'based on sales engineer questions' for some roles - tightly tied to AssemblyAI's product & API. Need to incorporate understanding of their API in solutions. No specific prompts surfaced for pure SDE."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Design whiteboard session in onsite. No specific prompts surfaced - given the product (speech-to-text API + voice agents), likely covers high-throughput audio pipelines, streaming APIs, async job queues."
      },
      {
        "type": "debugging",
        "sample_questions": [],
        "notes": "Live debugging and refactoring code reported as part of the onsite mix."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Experience-related and situational questions",
          "Cultural roundtable with peers"
        ],
        "notes": "Cultural roundtable is a distinct round. AssemblyAI explicitly disallows AI assistants / meeting bots during interviews."
      }
    ],
    "role_notes": "Loop has both algorithmic (HackerRank) AND practical (take-home + debugging) signal - rare combo. SDE / Backend / Platform fit is good given the API-platform product. ML Engineer track is separate (research-leaning). The disallow-AI-during-interview policy is explicit and policed.",
    "sources": [
      {
        "url": "https://www.glassdoor.com/Interview/AssemblyAI-Software-Engineer-Interview-Questions-EI_IE4953587.0,10_KO11,28.htm",
        "title": "AssemblyAI Software Engineer Interview Experience & Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://www.assemblyai.com/candidate-ai-guidance",
        "title": "Candidate AI Guidance - AssemblyAI",
        "year": 2025
      },
      {
        "url": "https://www.glassdoor.com/Interview/AssemblyAI-Interview-Questions-E4953587.htm",
        "title": "AssemblyAI Interview Experience & Questions - Glassdoor",
        "year": 2025
      }
    ],
    "confidence": "med"
  },
  "writer": {
    "loop_shape": "Three-component process: one round focused on technical theory, one on system design, and one on coding. Hubs in SF, NYC, Austin, Chicago, London - mixed in-office/remote. Difficulty self-reported 3.1/5.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "Dedicated coding round. No specific public prompts surfaced for Writer's SDE/AI Engineer track."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Dedicated system design round. Enterprise generative-AI platform context (Palmyra models, RAG, agentic workflows for enterprise). No specific public prompts."
      },
      {
        "type": "ml_design",
        "sample_questions": [],
        "notes": "'Technical theory' round is the AI/ML conceptual probing - LLM fundamentals, fine-tuning, retrieval. Distinguishes Writer's AI Engineer loop from pure SDE."
      },
      {
        "type": "behavioral",
        "sample_questions": [],
        "notes": "Not a dedicated round per public sources; likely embedded in recruiter/hiring-manager stages."
      }
    ],
    "role_notes": "Limited public 2024-2025 detail; loop-shape from Glassdoor + careers page. Writer is enterprise-focused (Fortune 500 customers), so SDE/Backend/Platform tracks emphasize multi-tenancy, data isolation, and enterprise integration. AI Engineer divergence: 'technical theory' round goes deeper on ML/LLM fundamentals.",
    "sources": [
      {
        "url": "https://www.glassdoor.com/Interview/Writer-AI-Engineer-Interview-Questions-EI_IE4046687.0,6_KO7,18.htm",
        "title": "Writer AI Engineer Interview Experience & Questions - Glassdoor",
        "year": 2025
      },
      {
        "url": "https://writer.com/company/careers/",
        "title": "Career opportunities at WRITER",
        "year": 2025
      }
    ],
    "confidence": "low"
  },
  "abridge": {
    "loop_shape": "Recruiter call -> hiring manager round (technical conversation: complex project discussion + mini-system-design thought exercise) -> virtual onsite of 3 rounds: DS&A coding, system design, AI coding round -> final round with VP of Engineering / CTO. ~19 day average for Senior SWE.",
    "rounds": [
      {
        "type": "coding",
        "sample_questions": [],
        "notes": "DS&A-style coding round at the onsite. No specific public prompts. Reported as 'related to the company's product rather than random LeetCode questions' so likely healthcare-conversation / transcript-shaped problems."
      },
      {
        "type": "system_design",
        "sample_questions": [],
        "notes": "Dedicated system design round. Topics reported to include security focus (healthcare data sensitivity / HIPAA). Mini-version of system design also appears in the HM round."
      },
      {
        "type": "applied_ai",
        "sample_questions": [],
        "notes": "Recent 2025+ reports show a dedicated 'AI coding round' as the third onsite slot. Product context is medical conversation -> structured clinical notes in real-time."
      },
      {
        "type": "behavioral",
        "sample_questions": [
          "Infrastructure decisions around a past project",
          "What would you have done differently?",
          "What technical tradeoffs did you consider?"
        ],
        "notes": "HM round + final CTO/VP round are heavily project-deep-dive + behavioral. 'Super nice and chill' interviewer style reported. Product-sense interview is part of the loop."
      }
    ],
    "role_notes": "Healthcare-AI vertical adds compliance/security framing to system design. SDE / Backend / Platform fit is strong - Abridge has lots of platform work around audio ingestion, transcription pipelines, EHR integration. AI Engineer divergence is the dedicated 'AI coding round'. As an Amazon SDE, the loop maps reasonably cleanly with the addition of healthcare-domain awareness.",
    "sources": [
      {
        "url": "https://www.jointaro.com/interviews/companies/abridge/experiences/software-engineer-united-states-february-1-2025-declined-offer-positive-db40167f/",
        "title": "Abridge Software Engineer Interview Experience - Taro (Feb 2025)",
        "year": 2025
      },
      {
        "url": "https://www.jointaro.com/interviews/companies/abridge/experiences/senior-software-engineer-san-francisco-ca-june-1-2025-no-offer-negative-76d75340/",
        "title": "Abridge Senior Software Engineer Interview Experience - Taro (Jun 2025)",
        "year": 2025
      },
      {
        "url": "https://www.1point3acres.com/interview/thread/1171449",
        "title": "abridge Full Technical Phone Screen Overview for SWE",
        "year": 2025
      }
    ],
    "confidence": "high"
  },
  "Ideogram": {
    "loop_shape": "Recruiter screen -> 1-2 technical rounds (problem-solving + ML model debugging) -> behavioral with eng lead -> final onsite with founders/senior engineers (project deep-dive + system design)",
    "rounds": [
      {
        "name": "Recruiter / Talent Partner Call",
        "duration_min": 30,
        "format": "phone/video",
        "sample_questions": [
          "Why Ideogram? What draws you to generative image AI?",
          "Walk me through your background and recent projects."
        ],
        "notes": "Motivation, mission alignment, background screen. Standard founder-led screen."
      },
      {
        "name": "Technical / Coding",
        "duration_min": 60,
        "format": "live coding (CoderPad-style)",
        "sample_questions": [
          "Practical problem-solving (DS&A medium). For SDE roles expect backend/infra leaning problems rather than pure ML-from-scratch."
        ],
        "notes": "ML-focused candidates report 'design, implement, debug ML model from scratch'. SDE/Platform candidates more likely to get practical backend / data-pipeline coding. JAX/PyTorch nice-to-know but not required for backend."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "whiteboard / virtual",
        "sample_questions": [
          "Design an image-generation API with prompt queueing, GPU autoscaling, and result delivery.",
          "Design storage + CDN for billions of generated images."
        ],
        "notes": "Inferred from product surface. Expect GPU scheduling, async job systems, S3-style object stores, rate limiting."
      },
      {
        "name": "Behavioral",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [
          "Tell me about navigating ambiguity in a flat, interdisciplinary team.",
          "Describe a time you shipped something end-to-end at Amazon."
        ],
        "notes": "Founders look for cross-functional collaboration and ownership."
      },
      {
        "name": "Final / Founder round",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [
          "Deep-dive on a previous project (architecture, tradeoffs, what you'd do differently)."
        ],
        "notes": "Project deep-dive + values + system design discussion with founder."
      }
    ],
    "role_notes": "For SDE/Platform candidate (Berkeley + 3yr Amazon SDE): lean into backend infra strengths. ML-from-scratch coding is for ML-Engineer reqs only. Emphasize distributed systems, async pipelines, GPU/cost optimization, ownership stories.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/ideogram-ml-engineer",
      "https://www.interviewquery.com/interview-guides/ideogram-machine-learning-engineer"
    ],
    "confidence": "low"
  },
  "Poolside": {
    "loop_shape": "Screening call with eng lead -> 2 tailored technical interviews (research-oriented, NOT leetcode) -> culture-fit calls",
    "rounds": [
      {
        "name": "Screening Call (Eng Lead)",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [
          "Walk through your background and what you want to work on.",
          "Why Poolside / why code-generation models?"
        ],
        "notes": "Coordinated by hiring manager. Background + motivation."
      },
      {
        "name": "Technical Interview 1 (Subject-area deep dive)",
        "duration_min": 60,
        "format": "discussion + coding",
        "sample_questions": [
          "Tailored to the candidate's background. For backend/platform: distributed training infra, eval pipelines, data preprocessing at scale.",
          "Walk through a system you built. Why did you make these choices?"
        ],
        "notes": "Explicitly described as 'not leetcode'. Research-oriented. For SDE/Platform you'll be probed on infra you've built, code-quality reasoning, debugging real systems."
      },
      {
        "name": "Technical Interview 2 (Team overview / fit)",
        "duration_min": 60,
        "format": "discussion",
        "sample_questions": [
          "Overview of the team you'd join + how your skills map.",
          "What's a hard engineering decision you've had to make recently?"
        ],
        "notes": "Tailored to team-of-fit. More architecture / tradeoff discussion than coding."
      },
      {
        "name": "Culture-Fit Calls",
        "duration_min": 30,
        "format": "video, multiple",
        "sample_questions": [
          "Values, working style, async/remote collaboration."
        ],
        "notes": "Multiple short calls with cross-functional folks."
      }
    ],
    "role_notes": "Process described as 'research-oriented, not leetcode'. Mixed reviews on organization. Lean into Amazon-scale infra stories, code-gen / eval pipelines, RLHF data plumbing knowledge. Strong fit for backend/platform if you can talk about training-data infra and eval harnesses.",
    "sources": [
      "https://www.glassdoor.co.uk/Interview/Poolside-ai-Interview-Questions-E10870647.htm",
      "https://www.teamblind.com/post/poolside-ai-interview-process-zws6rnp2"
    ],
    "confidence": "low"
  },
  "Lovable": {
    "loop_shape": "Application form -> exploratory recruiter call -> live coding -> multiple technical interviews (system design + troubleshooting + architecture) -> 1-2 day workshop OR portfolio presentation",
    "rounds": [
      {
        "name": "Application + Exploratory Call",
        "duration_min": 30,
        "format": "form + video",
        "sample_questions": [
          "Walk me through your background. Why Lovable?",
          "Show me something you've shipped that you're proud of."
        ],
        "notes": "Recruiter alignment on expectations + culture fit."
      },
      {
        "name": "Live Coding (Baseline Fluency)",
        "duration_min": 45,
        "format": "live coding",
        "sample_questions": [
          "Short practical problem. Not whiteboard puzzles. Real-world ambiguity is valued."
        ],
        "notes": "Quick screen for fluency rather than algorithm gauntlet."
      },
      {
        "name": "Technical Interview - System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [
          "Design the backend for an AI-assisted code-generation product (job queue, sandboxed execution, file diffing, multi-tenant state).",
          "How would you handle thousands of concurrent LLM streaming sessions?"
        ],
        "notes": "Architectural thinking. Inferred from product."
      },
      {
        "name": "Technical Interview - Troubleshooting / Architecture",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [
          "Walk me through debugging a production incident you've owned.",
          "Discuss tradeoffs in a system you previously architected."
        ],
        "notes": "Real-world ambiguity, debugging under pressure."
      },
      {
        "name": "Workshop OR Portfolio Showcase",
        "duration_min": 480,
        "format": "1-2 day workshop (remote/onsite) or portfolio talk",
        "sample_questions": [
          "Pair with the team on a real project. Mutual evaluation."
        ],
        "notes": "Track-dependent. Sales-ish 'mutual evaluation' framing. Heavy commitment - clarify upfront if compensated."
      }
    ],
    "role_notes": "Lovable is hyper-customer-facing. Emphasize taking ambiguous user pain points and turning them into well-scoped engineering work. 'Customer-facing engineer' framing - prep concrete stories of you owning customer interactions at Amazon. The workshop step is a real time investment - negotiate.",
    "sources": [
      "https://dataford.io/interview-guides/lovable/software-engineer",
      "https://softaims.com/faqs/lovable-ai/what-is-the-hiring-process-like-at-lovable-ai"
    ],
    "confidence": "low"
  },
  "Fireworks AI": {
    "loop_shape": "Recruiter screen -> tech phone screen (45min: 30min coding + 10min Qs) -> take-home (build mini chat playground using Fireworks API) -> full loop: behavioral + take-home review + system design + product",
    "rounds": [
      {
        "name": "Recruiter Screen",
        "duration_min": 30,
        "format": "phone",
        "sample_questions": [
          "Background, why Fireworks, comp expectations."
        ],
        "notes": "Multiple Glassdoor reports of low comp offers - prepare to negotiate hard with Amazon comp data."
      },
      {
        "name": "Technical Phone Screen",
        "duration_min": 45,
        "format": "CoderPad-style",
        "sample_questions": [
          "Check if an undirected graph is a single chain (no branches, no cycles).",
          "Detect a cycle in an undirected graph.",
          "Easy-to-medium graph problems."
        ],
        "notes": "30 min coding + 10 min technical Qs + 5 min your Qs. Reports of strict no-library-lookup expectation."
      },
      {
        "name": "Take-Home Assignment",
        "duration_min": 360,
        "format": "async build",
        "sample_questions": [
          "Build a simplified LLM chat playground (ChatGPT-clone) using the Fireworks AI inference API. Streaming, history, model selection."
        ],
        "notes": "Common assignment. 4-8 hours. Test API integration + streaming + clean code."
      },
      {
        "name": "Take-Home Review",
        "duration_min": 60,
        "format": "video walkthrough",
        "sample_questions": [
          "Walk us through your architecture. Why these choices? What would you do at scale?",
          "Extend a feature live."
        ],
        "notes": "Deep dive on the take-home. Be ready to live-extend."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [
          "Design a multi-tenant LLM inference platform with GPU scheduling, batching, autoscaling.",
          "Design a model-serving cache + CDN for token-level streaming."
        ],
        "notes": "Infra-heavy. Strong fit for Amazon backend background."
      },
      {
        "name": "Behavioral + Product",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [
          "Behavioral leadership / ownership stories.",
          "How would you prioritize features for an LLM inference platform?"
        ],
        "notes": "Often described as 'product interview' even for SDE - they want commercially-minded engineers."
      }
    ],
    "role_notes": "Reported as 'extremely selective, fails the vast majority'. Some reports of unprofessional interviewers. SDE/Platform fit is STRONG here - inference infra, GPU scheduling, batching, distributed serving = your wheelhouse. Push back on low-ball offers using Amazon levels.fyi data.",
    "sources": [
      "https://www.glassdoor.com/Interview/Fireworks-AI-Software-Engineer-Interview-Questions-EI_IE9514416.0,12_KO13,30.htm",
      "https://www.jointaro.com/interviews/companies/fireworksai/?tab=experiences"
    ],
    "confidence": "med"
  },
  "Blee": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: YC S22 seed, vertical: regtech/marketing-compliance AI, headcount: <30}: founder-led full-stack loop with practical coding + a take-home + values-heavy founder round.",
    "rounds": [
      {
        "name": "Founder/Recruiter Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "At YC seed-stage <30 headcount, expect a founder (Guy Shahar) on the first call. Motivation, background, mission alignment with regtech. Bring questions about runway, ARR, design partners."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad / CodeSandbox",
        "sample_questions": [],
        "notes": "Founding-team full-stack role. Expect a practical web problem (build a small feature, debug a snippet) over leetcode. TypeScript/React/Postgres likely. Compliance-domain problems possible (e.g., text-rule matching, redaction)."
      },
      {
        "name": "Take-Home Build",
        "duration_min": 360,
        "format": "async",
        "sample_questions": [],
        "notes": "Likely 4-8 hour build: simple compliance-review UI consuming an LLM. Be ready to discuss prompt design, evaluation, edge cases."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design a multi-tenant marketing-content review pipeline: ingest -> rules engine -> LLM check -> human-in-loop -> audit trail. Reg-tech specifics: PII handling, audit logs, role-based access."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "At <30 headcount, founders test for high-agency operators who can wear many hats. Customer-roleplay possible (Fintech/Pharma buyers)."
      }
    ],
    "role_notes": "Sub-30 YC company - founders interview every hire. Lean into Amazon ownership stories + any compliance/PII experience. Expect to talk to multiple founders.",
    "sources": [
      "https://www.ycombinator.com/companies/blee",
      "https://www.workatastartup.com/jobs/63531"
    ],
    "confidence": "low"
  },
  "Camber": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: Series A ($50M, a16z/Craft/YC), vertical: healthcare admin/behavioral health AI, headcount: <30-50}: McKinsey/AWS-flavored loop - structured screens + Python coding + take-home + onsite with healthcare-domain depth.",
    "rounds": [
      {
        "name": "Recruiter / Hiring Manager Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Head of eng is ex-AWS (led team of 10). Expect Amazon-style structured screen. Bring concrete metrics. Healthcare mission-fit is important."
      },
      {
        "name": "Technical Coding",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Strong Python required for AI-Product roles. Expect data-manipulation problems (FHIR/claims data wrangling) or async/API work. Senior SDE postings expect 5+ yrs production exp - LC medium plus practical."
      },
      {
        "name": "Take-Home or Project Deep-Dive",
        "duration_min": 240,
        "format": "async or interview",
        "sample_questions": [],
        "notes": "Could be either: take-home building an AI workflow over healthcare-ish data, OR a deep-dive on a past Amazon production system (design doc, tradeoffs, what you'd change)."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "whiteboard / virtual",
        "sample_questions": [],
        "notes": "Healthcare-flavored: HIPAA-compliant data pipeline, audit trail, multi-tenant EHR-integration architecture, idempotent claim-processing. Amazon background = strong fit."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Founders are ex-McKinsey healthcare consultants - expect crisp, structured behavioral. Mission alignment with behavioral-health access is real."
      }
    ],
    "role_notes": "Engineering bar is Amazon/Bloomberg/Palantir/Headway-flavored. Your Amazon SDE background is directly relevant. Domain prep: skim how EHRs + claims clearinghouses work.",
    "sources": [
      "https://www.ycombinator.com/companies/camber-2",
      "https://jobs.ashbyhq.com/camber/d85afd85-0014-4607-b4ce-587941026093"
    ],
    "confidence": "low"
  },
  "Crosby": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: $26M total raised (Sequoia + BCV), vertical: agentic legal services, headcount: <30, CTO = ex-Ramp early eng}: Ramp-flavored loop - high-bar practical coding, take-home product build, system design, customer-roleplay.",
    "rounds": [
      {
        "name": "Founder / Recruiter Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "CTO John Sarihan (ex-Ramp) likely runs early screens. Ramp's bar is high - expect a substantive technical conversation, not just background. Why Crosby/why legaltech."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Ramp-style: practical not leetcode. Build a small system from scratch (e.g., simple contract-clause matcher, rate-limited API wrapper). TypeScript or Python likely."
      },
      {
        "name": "Take-Home Build",
        "duration_min": 360,
        "format": "async",
        "sample_questions": [],
        "notes": "Likely 4-8hr build of an agentic workflow (e.g., LLM agent that reviews a contract redline). Prompt engineering + eval + tool use."
      },
      {
        "name": "System Design / Architecture",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design an agentic contract-review pipeline with human-in-loop, audit trail, document parsing/OCR, citation grounding, multi-doc context. Determinism over non-deterministic LLMs is a Crosby-specific topic."
      },
      {
        "name": "Founder Round + Customer Roleplay",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "CEO is a lawyer (ex-Cooley). Expect a roleplay or scenario: how would you debug a wrong-clause hallucination with a Fortune-500 GC on the line? Lawyer-engineer collaboration stories."
      }
    ],
    "role_notes": "Ex-Ramp CTO = high engineering quality bar. Lean into Amazon production ownership + any agentic/LLM-tool-use side projects. Legal domain not required but be curious about it.",
    "sources": [
      "https://crosby.ai/careers",
      "https://baincapitalventures.com/insight/crosby-is-redefining-legal-work-with-ai-powered-contract-automation/"
    ],
    "confidence": "low"
  },
  "FLORA": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: seed (a16z Speedrun + Menlo), vertical: AI-native creative tooling / infinite canvas, headcount: 11-50}: founder-led product-engineer loop with strong design sensibility checks + frontend-heavy coding + creator-aesthetic culture fit.",
    "rounds": [
      {
        "name": "Founder Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Founder Weber Wong + art-background team. Expect strong opinions on craft + aesthetics. Why FLORA / how you think about creative tools."
      },
      {
        "name": "Practical Coding (Frontend-leaning)",
        "duration_min": 60,
        "format": "CodeSandbox",
        "sample_questions": [],
        "notes": "Product-engineer role. Expect React/TS + canvas/SVG work, drag-and-drop, node-graph state management. Less DS&A, more 'build this UI interaction'."
      },
      {
        "name": "Take-Home or Portfolio Show",
        "duration_min": 240,
        "format": "async or live",
        "sample_questions": [],
        "notes": "Likely either: build a small node-graph editor, OR walk through your most polished UI work. Design-sensibility matters more than at typical SDE shops. Backend roles still possible (ML model orchestration, async job queues for image/video gen)."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design a real-time collaborative infinite canvas with multi-model orchestration (image+video+text gen), GPU queue, large-asset storage."
      },
      {
        "name": "Founder / Aesthetics Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Strong cultural emphasis on creative taste. Bring opinions on creative-tool UX (Figma, Midjourney, Photoshop, Pika)."
      }
    ],
    "role_notes": "FLORA is design-led. SDE/Platform backend role is the more natural fit (multi-model orchestration, GPU queueing, async pipelines). Bring opinions on creative tools to bond with founder.",
    "sources": [
      "https://flora.ai/careers",
      "https://techcrunch.com/2025/03/02/flora-is-building-an-ai-powered-infinite-canvas-for-creative-professionals/"
    ],
    "confidence": "low"
  },
  "General Context": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: stealth/early-seed, vertical: AI, headcount: <30}: classic small-team founder-led loop - screen -> 1 practical coding -> take-home -> onsite (system design + founder values).",
    "rounds": [
      {
        "name": "Founder Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Founder-led at sub-30 headcount. Background + why-us + what you want to build."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad / CodeSandbox",
        "sample_questions": [],
        "notes": "Practical small-feature problem rather than leetcode. Common at early-stage AI shops."
      },
      {
        "name": "Take-Home (Optional)",
        "duration_min": 240,
        "format": "async",
        "sample_questions": [],
        "notes": "4-8hr build using the company's API or a representative LLM/agent integration. Common but not universal."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Generic AI-app system design: LLM API gateway, prompt routing, retrieval, eval pipeline."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Conviction + high-agency + on-site/in-person commitment likely tested. Equity-vs-cash + runway conversation expected."
      }
    ],
    "role_notes": "Stealth/very-early. Treat the loop as mutual due diligence - ask about runway, ARR (if any), team thesis, founder market-fit. Backend/platform skills broadly applicable.",
    "sources": [],
    "confidence": "low"
  },
  "Loop": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: YC + $3.5M raised, vertical: AI interview prep, headcount: 51-200 per Wellfound (likely lower in reality)}: full-stack/AI engineering loop - screen + practical coding + system design + founder round. Note: founder is ex-Director of Eng who 'spent 90% on hiring' - expect a polished, structured process.",
    "rounds": [
      {
        "name": "Recruiter / Founder Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Founder is a hiring veteran - expect a sharper-than-average screen. Bring strong metrics and clear narrative."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Likely a mix of LC-medium + practical (since they study interviewing professionally, expect a thoughtful problem). Python/TypeScript."
      },
      {
        "name": "Take-Home / Build",
        "duration_min": 240,
        "format": "async",
        "sample_questions": [],
        "notes": "Possible: build a small interview-feedback feature (LLM evaluates response, returns rubric). Eval-pipeline mindset important."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design a real-time interview-practice system: WebRTC/streaming audio, transcription, LLM feedback, async eval, multi-tenant storage."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Founder cares deeply about hiring - expect deliberate behavioral questions. Stories of growth + feedback + deliberate practice land well."
      }
    ],
    "role_notes": "Founder studies interviewing for a living - the loop will be sharper and more rubric-driven than peers. Audio/streaming/eval-pipeline experience is a plus.",
    "sources": [
      "https://news.ycombinator.com/item?id=43572896",
      "https://wellfound.com/company/loop-ai-xyz"
    ],
    "confidence": "low"
  },
  "Metropolis": {
    "loop_shape": "No public 2024-2025 interview reports. Inferred from {stage: post-SP+ acquisition (large), vertical: AI/CV + parking ops, headcount: 100s-1000s actual but small AI engine team}: standard mid/late-stage SDE loop - recruiter -> tech phone -> onsite (3-4 rounds incl. coding, system design, behavioral, possibly CV/ML round).",
    "rounds": [
      {
        "name": "Recruiter Screen",
        "duration_min": 30,
        "format": "phone",
        "sample_questions": [],
        "notes": "Standard. Background, comp expectations. Senior SE comp $180-200k range publicly."
      },
      {
        "name": "Technical Phone Screen",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Scala or Java stated as preferred for senior SE roles. LC-medium DS&A + JVM/Scala fluency. Brush up on Scala basics if Java-only."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Design large-scale systems: vehicle-event ingestion, real-time CV inference pipeline, payments/billing, multi-garage state sync. Your Amazon background = direct fit."
      },
      {
        "name": "Coding Onsite",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Another DS&A or practical coding round. Possibly object-oriented design."
      },
      {
        "name": "Behavioral / Bar-Raiser-style",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Office-first culture (4 days/wk on-site). Expect questions about in-office collaboration + ownership. Amazon LP-style stories work well."
      }
    ],
    "role_notes": "More 'big-co'-flavored than the others on this list given size + Scala/Java + large-scale infra focus. Your Amazon SDE background is the strongest fit of any company here.",
    "sources": [
      "https://talents.vaia.com/companies/metropolis/senior-software-engineer-customer-experience-29154202/",
      "https://www.levels.fyi/companies/metropolis-technologies"
    ],
    "confidence": "low"
  },
  "Plot": {
    "loop_shape": "No public 2024-2025 data. Inferred from {stage: early/seed, vertical: AI, headcount: <30}: classic small-team founder-led loop - screen -> practical coding -> take-home -> onsite (system design + founder values + possible customer-roleplay).",
    "rounds": [
      {
        "name": "Founder Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Sub-30 headcount, founder-led. Background + why-Plot + what excites you about the product surface."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad / CodeSandbox",
        "sample_questions": [],
        "notes": "Practical small-feature problem. TypeScript/Python likely."
      },
      {
        "name": "Take-Home Build",
        "duration_min": 360,
        "format": "async",
        "sample_questions": [],
        "notes": "4-8hr build using their API or a representative LLM/agent task."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Generic AI-app design: API gateway, retrieval, eval, async jobs. Tailor to whatever Plot ships."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "High-agency + ownership + on-site commitment. Possible customer-roleplay if Plot is B2B."
      }
    ],
    "role_notes": "Treat the loop as mutual due diligence. Ask about thesis, customers, runway. Hard to prep specifically without product details - bring strong Amazon ownership stories and adaptability.",
    "sources": [],
    "confidence": "low"
  },
  "Qloo": {
    "loop_shape": "No public 2024-2025 SDE interview reports. Inferred from {stage: Series C, vertical: taste/recommendation AI + cultural-graph API, headcount: ~100 (larger than rest of list)}: standard mid-stage API/platform loop - recruiter -> tech phone -> virtual onsite (coding + system design + behavioral + possibly data-modeling/recsys round).",
    "rounds": [
      {
        "name": "Recruiter Screen",
        "duration_min": 30,
        "format": "phone",
        "sample_questions": [],
        "notes": "Standard. Background + comp + interest in taste/recommendation."
      },
      {
        "name": "Technical Phone Screen",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "LC-medium DS&A. Possibly a graph/knowledge-graph flavored problem given Qloo's product is a cultural-graph API."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Design a high-QPS recommendation API. Cache layers, graph traversal, embedding similarity, multi-tenant rate limiting. Your Amazon API background is directly relevant."
      },
      {
        "name": "Coding / Data Modeling",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Possibly schema-design or graph-traversal problem. Recsys basics (collaborative filtering, embeddings, ANN) are useful conversation."
      },
      {
        "name": "Behavioral / Founder Round",
        "duration_min": 45,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Standard behavioral. Ownership + cross-functional + ambiguity stories."
      }
    ],
    "role_notes": "Mid-stage = more structured loop than the seed-stage cohort. Product is graph + recommendations - skim recsys 101 and graph data structures. Your Amazon API/platform background is the strongest fit.",
    "sources": [],
    "confidence": "low"
  },
  "Sandbar": {
    "loop_shape": "No public 2024-2025 SDE interview reports. Inferred from {stage: early, vertical: fintech / anti-money-laundering AI, headcount: <30}: founder-led loop - screen -> coding -> take-home (data pipeline) -> system design -> founder values.",
    "rounds": [
      {
        "name": "Founder / Recruiter Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Sub-30 headcount, founder-led. Why-Sandbar + comfort with finance/AML domain (or willingness to learn)."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Full-stack role. Practical problem - likely data-wrangling or API-integration. Python/TS."
      },
      {
        "name": "Take-Home / Project Deep-Dive",
        "duration_min": 240,
        "format": "async or interview",
        "sample_questions": [],
        "notes": "Likely data-pipeline-flavored: ingest messy transaction data, normalize, flag anomalies. OR a deep-dive on a complex production system you've owned."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design an AML detection pipeline: streaming ingest, entity resolution, anomaly scoring, case-management UI, audit/explainability. Regulated-data nuances (audit trail, immutable logs)."
      },
      {
        "name": "Founder / Values Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Ownership + ambiguity. Domain-curiosity about financial crime."
      }
    ],
    "role_notes": "Fintech + AML domain. Skim BSA/AML basics + SAR workflow + entity resolution to sound informed. Backend/platform/data-pipeline strength is a great fit.",
    "sources": [
      "https://www.sandbar.ai/",
      "https://sandbar.com/ml-engineer"
    ],
    "confidence": "low"
  },
  "Sola": {
    "loop_shape": "No public 2024-2025 SDE interview reports. Inferred from {stage: $21M raise (a16z + Conviction + YC), vertical: agentic RPA / desktop automation, headcount: <30, CTO ex-Heap/StackOverflow}: founder-led loop - screen + practical coding + take-home (build a small automation) + system design + founder.",
    "rounds": [
      {
        "name": "Founder Screen",
        "duration_min": 30,
        "format": "video",
        "sample_questions": [],
        "notes": "Founders (Jessica Wu ex-Citadel/Thrive; Neil Deshmukh MIT) likely run early calls. Ex-CTO David Fullerton (Heap/SO) brings high eng bar."
      },
      {
        "name": "Practical Coding",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [],
        "notes": "Practical. Possibly a problem with parsing/automation/state-machine flavor (RPA-adjacent). Python + TS."
      },
      {
        "name": "Take-Home Build",
        "duration_min": 360,
        "format": "async",
        "sample_questions": [],
        "notes": "Likely: build a small browser/desktop-automation flow using their SDK or a Playwright-style tool. Vision-LLM tool-use is the company's bread and butter."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Design a reliable workflow-execution engine on top of non-deterministic LLM/CV models. Determinism, retries, idempotency, recording-replay, observability. THIS is the Sola-specific topic per their own framing."
      },
      {
        "name": "Founder + Customer Roleplay",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [],
        "notes": "Fortune-100 customers. Roleplay debugging a flaky bot with a customer ops lead. Practical/customer-empathy stories from Amazon work well."
      }
    ],
    "role_notes": "Sola's stated technical problem is 'reliable deterministic execution over non-deterministic models' - prep that framing. Backend/platform fit is excellent (queues, retries, idempotency, observability = Amazon strengths).",
    "sources": [
      "https://www.sola.ai/",
      "https://www.ycombinator.com/companies/sola/jobs/J394nAN-software-engineer-backend"
    ],
    "confidence": "low"
  },
  "Suno": {
    "loop_shape": "Recruiter screen -> tech screen (1-2 rounds) -> onsite with founders/eng. SDE roles look more standard; audio/ML roles add an audio-ML round.",
    "rounds": [
      {
        "name": "Recruiter / HR Screen",
        "duration_min": 30,
        "format": "phone",
        "sample_questions": [
          "Why Suno? Have you used the product? What do you like and dislike about it?",
          "What's your relationship with music?"
        ],
        "notes": "Reported strong emphasis on product use + music affinity. Try the product before applying. Glassdoor positive: 25%."
      },
      {
        "name": "Technical Phone Screen",
        "duration_min": 60,
        "format": "CoderPad",
        "sample_questions": [
          "Compute total credits for users with >0 credits. Referrals give 100 credits each to referrer + referee (only when referee first generates a song), capped at 300 referral credits per user.",
          "(Practical SQL/data-modeling-flavored problems are common.)"
        ],
        "notes": "The credit problem is real and reported. Mix of SQL/data-modeling + coding. Practical, not pure LC."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [
          "Design a music-generation API: prompt -> async GPU job -> streaming preview + final WAV/MP3 delivery.",
          "Design billing + credit-tracking system (ties back to the credit phone-screen problem)."
        ],
        "notes": "Inferred. Frontend-eng HR screen has been reported to include early system-design probing, so be ready."
      },
      {
        "name": "Behavioral / Founder Round",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [
          "Past projects deep-dive. Why Suno specifically (not generic 'AI')?"
        ],
        "notes": "Communication + past-project clarity emphasized. Avg hiring process ~17 days."
      },
      {
        "name": "Audio-ML round (ML/research roles only)",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Not for backend/platform SDE roles - skip if SDE only. Diffusion + audio-tokenization knowledge would be probed for ML roles."
      }
    ],
    "role_notes": "Strong product-affinity signal. Generate at least 5-10 songs on Suno before the screen. Backend/platform fit: credit systems, async job orchestration, GPU queueing - all Amazon strengths. SQL fluency matters.",
    "sources": [
      "https://www.glassdoor.com/Interview/SUNO-Software-Engineer-Interview-Questions-EI_IE1265394.0,4_KO5,22.htm",
      "https://www.teamblind.com/post/suno-ai-tech-screen-interview-u4vbt11q"
    ],
    "confidence": "med"
  },
  "Warp": {
    "loop_shape": "Recruiter screen -> tech phone screen (real Warp-flavored problem) -> onsite (more coding + system design + founder). Two interviewers per round (one leads, one observes) is reported.",
    "rounds": [
      {
        "name": "Recruiter Screen",
        "duration_min": 30,
        "format": "phone",
        "sample_questions": [
          "Background + why Warp + Rust experience? (Warp is Rust-heavy)"
        ],
        "notes": "Warp is built in Rust + the terminal is the product. Rust experience or strong systems background matters."
      },
      {
        "name": "Technical Phone Screen (Warp-flavored coding)",
        "duration_min": 60,
        "format": "CoderPad, 2 interviewers",
        "sample_questions": [
          "Tree problem about splitting terminal windows + updating a toString() function to show the split layout (reported real question).",
          "Practical coding problem derived from Warp's actual product (window/pane management, command history, etc.)."
        ],
        "notes": "Explicitly NOT typical leetcode - they pull simplified problems from their codebase. STRICT no-library-lookup rule reported; candidates rejected for googling stdlib. Memorize your language's standard library."
      },
      {
        "name": "Coding Onsite",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "More practical coding. Possibly a parser, tokenizer, or text-manipulation problem (terminal stuff)."
      },
      {
        "name": "System Design",
        "duration_min": 60,
        "format": "virtual",
        "sample_questions": [],
        "notes": "Design a multi-machine terminal sync + LLM-assisted command suggestion service. Real-time, low-latency, multi-platform desktop."
      },
      {
        "name": "Founder / Behavioral",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [],
        "notes": "Standard behavioral + Warp values. Strong opinions about developer tools land well."
      }
    ],
    "role_notes": "TWO real prep notes: (1) memorize your language stdlib cold - looking things up has been a rejection signal. (2) Use Warp as your daily terminal for a week before applying. Rust/systems-programming/C++ background helps; pure Java/Python at Amazon may be a weak spot - emphasize any systems-level work.",
    "sources": [
      "https://www.glassdoor.com/Interview/Warp-Software-Engineer-Interview-Questions-EI_IE7632331.0,4_KO5,22.htm",
      "https://www.warp.dev/blog/how-to-snag-a-design-role-at-an-early-stage-startup"
    ],
    "confidence": "med"
  },
  "AlphaSense": {
    "loop_shape": "HackerRank OA -> 1-hr technical interview (DS&A + concepts) -> 1-hr managerial round (system design + HR + light behavioral). Sometimes a separate system design round for senior.",
    "rounds": [
      {
        "name": "Online Assessment (HackerRank)",
        "duration_min": 90,
        "format": "HackerRank",
        "sample_questions": [
          "9 MCQs: technical (HTTP methods - GET/POST/PATCH semantics), aptitude, reasoning.",
          "2 coding questions (LC easy-medium)."
        ],
        "notes": "Standard structured OA. HTTP methods MCQs reported. Brush up on REST semantics."
      },
      {
        "name": "Technical Interview",
        "duration_min": 60,
        "format": "video coding",
        "sample_questions": [
          "Buildings With an Ocean View (LC 1762)",
          "Remove Element (LC 27)",
          "Counting Bits (LC 338)",
          "Trie problems (reported for SDE-3)",
          "Array/String mediums dominant."
        ],
        "notes": "Reported ~30 problems in their bank: 12 Easy, 12 Medium, 6 Hard. Array + String + Trie heavy. Also brief conceptual DS&A questions."
      },
      {
        "name": "Managerial / System Design",
        "duration_min": 60,
        "format": "video",
        "sample_questions": [
          "Design a Slack-style mentions feature (reported).",
          "Design a financial-document search system (Elasticsearch + ranking) - inferred from product."
        ],
        "notes": "Combo: intro + HR + system design discussion. Lighter design than FAANG but real."
      },
      {
        "name": "Hiring Manager / Behavioral",
        "duration_min": 45,
        "format": "video",
        "sample_questions": [
          "Standard behavioral + culture fit.",
          "How do you handle ambiguous requirements?"
        ],
        "notes": "Avg hiring takes ~60 days per Glassdoor."
      }
    ],
    "role_notes": "Most 'big-co'-flavored process on this list (HackerRank OA, structured rounds, named LC problems). Easiest to prep using standard LC + system design. Skim financial-document search / NLP retrieval since that's the product. Amazon SDE background = strong direct fit.",
    "sources": [
      "https://www.glassdoor.com/Interview/AlphaSense-Software-Engineer-Interview-Questions-EI_IE1664354.0,10_KO11,28.htm",
      "https://leetcode.com/discuss/interview-experience/5652155/AlphaSense-or-SDE-1-or-Fresher-or-May-2024-or-College-Grad-Offer/"
    ],
    "confidence": "high"
  },
  "Alloy": {
    "loop_shape": "Recruiter screen -> Coding pair-program (multi-step LeetCode-esque) -> Onsite (API design coding, system design on banking, behavioral with PM + EM). ~3 weeks.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Online pair programming with multi-step LeetCode-esque problem, escalating from string manipulation to graph algorithms.",
        "sample_questions": [
          "Multi-stage string manipulation problem that grows into a graph traversal (detecting cycles in financial transaction relationships)."
        ]
      },
      {
        "type": "api_design",
        "notes": "Write a functioning RESTful API in code (e.g. accepts user/identity data and validates it). Strong fintech-infra theme: idempotency, validation, error semantics.",
        "sample_questions": [
          "Design and implement a REST endpoint for user identity verification with validation rules.",
          "Implement a graph search to detect circular relationships in financial transactions."
        ]
      },
      {
        "type": "system_design",
        "notes": "System design on banking / identity-decisioning systems. Edge cases, data security, bottlenecks emphasized.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Behavioral with PMs and EMs; mission-fit on identity/KYC infra.",
        "sample_questions": []
      }
    ],
    "role_notes": "B2B fintech identity infra (KYC/KYB). Universal fintech-SDE topics highly relevant: idempotency, webhook design, rate-limit, schema validation. Stack: backend services.",
    "sources": [
      "https://www.glassdoor.com/Interview/Alloy-Interview-Questions-E2084992.htm",
      "https://www.glassdoor.com/Interview/Alloy-NY-Software-Engineer-Interview-Questions-EI_IE3072397.0,8_KO9,26.htm",
      "https://alloy.ai/wp-content/uploads/2022/07/Interviewing-at-Alloy.pdf"
    ],
    "confidence": "med"
  },
  "Gusto": {
    "loop_shape": "Recruiter screen -> Technical phone screen (CoderPad pair-program, ~1hr) -> Virtual onsite: coding, system design, behavioral. Heavy Ruby on Rails / TypeScript / React stack.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Pair-programming on realistic problem. Emphasis on code quality, testing, edge cases, readability \u2014 not LeetCode tricks. CoderPad.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "For senior/staff: scalable fault-tolerant systems for payroll/tax data. Data modeling, API design, distributed-systems tradeoffs, compliance/security.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Culture + collaboration fit. Standard.",
        "sample_questions": []
      }
    ],
    "role_notes": "Backend in Ruby on Rails (Rails-heavy shop). Money-movement correctness and tax-compliance domain \u2014 emphasize idempotency, auditability, ledger-style thinking.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/gusto-software-engineer",
      "https://www.glassdoor.com/Interview/Gusto-Software-Engineer-Interview-Questions-EI_IE1069704.0,5_KO6,23.htm",
      "https://dataford.io/interview-guides/gusto/software-engineer"
    ],
    "confidence": "high"
  },
  "SoFi": {
    "loop_shape": "Application -> optional OA -> recruiter -> technical phone screen -> onsite loop of 3-4 rounds (coding, system design for senior, behavioral). Java/Kotlin backend.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Clean production code. HashMaps/Arrays/Lists/Trees, string parsing/formatting/validation (fintech data-processing slant). Light DP.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "For experienced: 45-60 min dedicated round. Microservices, Kafka, eventual consistency, SQL vs NoSQL choice (PostgreSQL/DynamoDB), service boundaries, scaling/reliability.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Standard fintech behavioral; tradeoff explanation throughout.",
        "sample_questions": []
      }
    ],
    "role_notes": "Heavy Java/Kotlin backend. Lending + brokerage + banking. Use Java in coding rounds to discuss language nuances.",
    "sources": [
      "https://www.glassdoor.com/Interview/SoFi-Software-Engineer-Interview-Questions-EI_IE779979.0,4_KO5,22.htm",
      "https://dataford.io/interview-guides/sofi/software-engineer",
      "https://www.jointaro.com/interviews/companies/sofi/experiences/senior-software-engineer-south-san-francisco-ca-august-2-2024-declined-offer-positive-ca139cdc/"
    ],
    "confidence": "high"
  },
  "Modern Treasury": {
    "loop_shape": "Screening -> coding quiz -> meet-and-greet -> 4.5hr virtual onsite (5 sub-rounds: 1 coding API integration, 1 system design, 3 non-technical). ~19 days median.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Build an integration against the Modern Treasury REST API \u2014 real API-client work, not LeetCode. Authentication, pagination, retries, idempotency keys, webhook handling.",
        "sample_questions": [
          "Build a client that integrates with the Modern Treasury REST API."
        ]
      },
      {
        "type": "system_design",
        "notes": "Payments/ledger-flavored system design. Money movement, idempotency, eventual consistency, double-entry, reconciliation.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Several non-technical rounds; product/customer focus + Y-Combinator-startup-energy.",
        "sample_questions": []
      }
    ],
    "role_notes": "Payments-ops infra (ACH, wires, RTP, ledgers). The canonical universal fintech-SDE topics \u2014 idempotency, webhook design, retries, ledger modeling \u2014 are core to this job.",
    "sources": [
      "https://www.glassdoor.com/Interview/Modern-Treasury-Software-Engineer-Interview-Questions-EI_IE3201381.0,15_KO16,33.htm",
      "https://www.moderntreasury.com/careers"
    ],
    "confidence": "med"
  },
  "Carta": {
    "loop_shape": "Phone screen (resume/projects) -> take-home (OOP-heavy in Python) -> technical onsite (design patterns / OOP) -> behavioral. ~36 days median; 2.6/5 difficulty.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Take-home with strong OOP emphasis (Python). Graded on clarity, maintainability, documentation. NOT a LeetCode algo challenge.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "OOP / design-patterns conversation. Code organization weighted higher than algorithm cleverness (iterative-merge-sort-style algo questions are de-emphasized).",
        "sample_questions": [
          "Design a system using OOP in Python (open-ended)."
        ]
      },
      {
        "type": "behavioral",
        "notes": "Cap-table/equity domain culture fit.",
        "sample_questions": []
      }
    ],
    "role_notes": "Equity/cap-table SaaS \u2014 Python + Django historically. Ownership of cap-table correctness; OOP-modeling matters. Lower algorithmic bar than FAANG; higher code-quality bar.",
    "sources": [
      "https://www.glassdoor.com/Interview/Carta-Software-Engineer-Interview-Questions-EI_IE1880027.0,5_KO6,23.htm",
      "https://www.interviewquery.com/interview-guides/carta-software-engineer",
      "https://prepfully.com/interview-questions/carta/backend-engineer"
    ],
    "confidence": "med"
  },
  "Blockworks": {
    "loop_shape": "Initial screening -> system architecture round -> code screening. Small media+research+events shop, sparse public engineering interview data.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Reported Dec-2024 candidate: session was Express.js / API-endpoint setup (originally billed as DS&A), high-level, thought-process oriented.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "System architecture round before coding.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Friendly, conversational; cultural-fit weighted.",
        "sample_questions": []
      }
    ],
    "role_notes": "Crypto media/research company \u2014 engineering org is small. Eng roles tend to be full-stack Node/TS web platform work, NOT trading systems. Low public data.",
    "sources": [
      "https://www.glassdoor.com/Interview/Blockworks-Interview-Questions-E2275559.htm",
      "https://blockworks.co/careers/build-with-us/1bb424e70c8180149951e7f435dab325"
    ],
    "confidence": "low"
  },
  "Betterment": {
    "loop_shape": "Recruiter -> Byteboard 2hr async (open-ended design + coding) -> onsite: pair-programming coding + system/app design + behavioral. ~26 days median.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Byteboard assessment: 2-hour open-ended system/application design followed by coding up part of the application. Used as their main first-round screen.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "Pair-programming on real-world-flavored problems (40 min). Plus LeetCode-medium-style in later round.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "System/app design round at onsite. Robo-advisor + brokerage domain.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Standard; collaboration emphasis.",
        "sample_questions": []
      }
    ],
    "role_notes": "Robo-advisor / brokerage. Ruby/Rails-heavy historically. Byteboard makes the first round non-traditional.",
    "sources": [
      "https://www.betterment.com/engineering/the-betterment-engineering-interview",
      "https://www.glassdoor.com/Interview/Betterment-Software-Engineer-Interview-Questions-EI_IE817462.0,10_KO11,28.htm",
      "https://www.byteboard.dev/case-study/betterment"
    ],
    "confidence": "high"
  },
  "Propel": {
    "loop_shape": "Recruiter -> hiring-manager -> ~3hr take-home (scenario-based, write-up) -> take-home present -> 2 final 1:1s. ~6 weeks; structured rubric/scorecard process.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "~3 hours, based on a real scenario from the company (Providers/Fresh-EBT mobile + backend domain). Presentation round after submission.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Mission-driven shop \u2014 low-income financial health. Mission fit matters a lot.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "Lighter LC-style coding may appear in 1:1s but emphasis is on take-home + applied problem-solving.",
        "sample_questions": []
      }
    ],
    "role_notes": "NYC-based, mission-driven (EBT/SNAP recipients). Small eng org. Take-home centric, lower algorithmic bar. Note: Glassdoor search also surfaces unrelated 'Propel Technology Group' India campus-hire flow \u2014 distinct entity.",
    "sources": [
      "https://www.glassdoor.com/Interview/Propel-Interview-Questions-E1847074.htm",
      "https://www.keyvalues.com/propel",
      "https://www.joinpropel.com/careers"
    ],
    "confidence": "med"
  },
  "Gemini": {
    "loop_shape": "4-round panel: tech-screen coding, system design, cross-functional, behavioral (manager + senior leadership). ~30 days end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Standard backend coding screen; Scala/JVM stack means functional-programming patterns surface in code-review-style questions.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Distributed systems w/ heavy security emphasis (custody, wallets, exchange order flow). Monitoring/instrumentation discussion.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Cross-functional round + behavioral with manager and senior leadership.",
        "sample_questions": []
      }
    ],
    "role_notes": "Crypto exchange + custody. Scala/JVM-heavy backend. Security/compliance is a hard requirement throughout the interview signal.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/gemini-software-engineer",
      "https://prepfully.com/interview-questions/gemini/backend-engineer",
      "https://www.glassdoor.com/Interview/Gemini-Senior-Software-Engineer-Interview-Questions-EI_IE1400858.0,6_KO7,31.htm"
    ],
    "confidence": "med"
  },
  "Alchemy": {
    "loop_shape": "Screening -> tech screens (LeetCode easy then medium) -> final 4-5hr loop: 2 technical, 1 system design, 1 behavioral, 1 customer-facing behavioral.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Two coding rounds, LC-easy escalating to LC-medium. Standard DS&A.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Architect distributed/high-throughput/low-latency systems (Alchemy's blockchain API platform is the canonical example). Reliability + latency at scale.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Two behavioral rounds \u2014 one customer-facing-flavored, since they support enterprise web3 devs.",
        "sample_questions": []
      }
    ],
    "role_notes": "Web3 dev-infra (RPC, indexing, NFT API). Requires 5+ years for senior backend. AWS, low-latency / high-throughput a plus. Java/TS/Go backend.",
    "sources": [
      "https://www.glassdoor.com/Interview/Alchemy-Interview-Questions-E110467.htm",
      "https://www.builtinnyc.com/job/software-engineer-backend/3542088",
      "https://www.alchemy.com/blog/2025-internship-program"
    ],
    "confidence": "med"
  },
  "Kalshi": {
    "loop_shape": "Phone screen -> manager interview (past projects) -> final coding round (LeetCode-style class implementation with efficiency + tradeoff discussion). Onsite full loop also reported.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Implement a class for a stateful problem; discuss efficiency, multiple solution approaches and tradeoffs. Practical, LC-flavored.",
        "sample_questions": [
          "Implement a class with required methods; analyze tradeoffs across different implementations."
        ]
      },
      {
        "type": "behavioral",
        "notes": "Tell-about-a-technical-project deep dive; high intensity startup culture probe.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "REST API design + relational/NoSQL choice (Postgres/MySQL/Mongo). Order-matching / exchange domain.",
        "sample_questions": []
      }
    ],
    "role_notes": "CFTC-regulated event-prediction exchange. Go + Java stack. Backend + REST + DB design weighted; exchange-correctness mindset (ordering, settlement) helps.",
    "sources": [
      "https://www.glassdoor.com/Interview/Kalshi-Software-Engineer-Interview-Questions-EI_IE5273135.0,6_KO7,24.htm",
      "https://www.1point3acres.com/interview/thread/1133122",
      "https://www.teamblind.com/post/kalshi-interview-3q6qyuxk"
    ],
    "confidence": "med"
  },
  "Polymarket": {
    "loop_shape": "Limited public data. Inferred: recruiter -> backend tech screen -> onsite (coding + systems). Polymarket sources mostly via job postings, not candidate reports.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred from JD: low-latency backend coding. C/C++ or Go/Rust/Java for exchange-engine roles; Go for US Exchange full-stack.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Inferred from JD: design exchange/matching-engine-adjacent components. Correctness + latency under trading load. Order book, settlement, oracle integration.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "High-ownership, minimal-bureaucracy IC culture is the explicit pitch.",
        "sample_questions": []
      }
    ],
    "role_notes": "Crypto-native prediction market on Polygon. Multiple backend tracks: Gamma (core markets API), US Exchange (Go-heavy), Markets (low-latency systems). Sparse interview reports; treat round structure as inference.",
    "sources": [
      "https://jobs.ashbyhq.com/polymarket",
      "https://jobs.ashbyhq.com/polymarket/0cdcc6a1-0187-4bde-9e26-55039517f5db",
      "https://www.glassdoor.com/Reviews/Polymarket-Reviews-E6828642.htm"
    ],
    "confidence": "low"
  },
  "Numeric": {
    "loop_shape": "Sparse public data. Inferred: recruiter -> tech screen -> onsite (coding + SQL/data-modeling + system design + behavioral with founder/eng-lead).",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: TS/Node coding given stack. Heavy SQL fluency expected (they avoid ORMs, depend on Slab for safe SQL).",
        "sample_questions": []
      },
      {
        "type": "sql",
        "notes": "Strong SQL + DB understanding called out explicitly by engineering blog as a hire criterion.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Inferred: data-platform / financial-reconciliation architecture. Accounting close = ledger + dimensional models + audit.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "'Top 1%' bar + 'business-building athletes'; product ownership + customer empathy probed.",
        "sample_questions": []
      }
    ],
    "role_notes": "AI accounting / month-end close startup (Series A, $28M Oct-2024). Node + React in TypeScript. Customers include OpenAI, Plaid, Brex. Small team, high bar.",
    "sources": [
      "https://www.numeric.io/blog/tool-stack-as-a-startup",
      "https://www.numeric.io/careers",
      "https://siliconangle.com/2024/10/10/ai-accounting-software-startup-numeric-raises-28m/"
    ],
    "confidence": "low"
  },
  "Jane Street": {
    "loop_shape": "Recruiter (30m) -> 1hr technical phone screen (1 LC-medium with 2 parts) -> 5hr onsite: 3x 75-min coding/system-design hybrids in CoderPad + 1x 75-min technical project deep-dive. ~4 weeks.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Underspecified problems \u2014 ask clarifying questions. Trees, hash maps, arrays, strings, matrices, search, stacks/maps, memoization. Build something from scratch, e.g. Tetris or a video-player API.",
        "sample_questions": [
          "Build a Tetris game from scratch.",
          "Design a video player API from scratch.",
          "Recursive tree traversal / subset generation / parser-like state machine (OA-flavored)."
        ]
      },
      {
        "type": "system_design",
        "notes": "Hybrid with coding rounds \u2014 whiteboard pieces then jump into code. Practical, not the scaling-Netflix-style FAANG genre.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Technical project deep dive (75 min) is the closest thing \u2014 present a technically complex past project. Collaboration weighted heavily.",
        "sample_questions": []
      }
    ],
    "role_notes": "Prop trading. OCaml internally but interviews are language-agnostic \u2014 DO NOT learn OCaml for the interview. They explicitly value collaboration as much as correctness.",
    "sources": [
      "https://interviewing.io/jane-street-interview-questions",
      "https://www.janestreet.com/preparing-for-a-software-engineering-interview/",
      "https://blog.janestreet.com/what-a-jane-street-dev-interview-is-like/"
    ],
    "confidence": "high"
  },
  "Mosaic": {
    "loop_shape": "Multi-stage: 1hr technical (Java/SQL/Unix) -> 2hr pair-programming exercise -> 30min COO behavioral -> 30min eng-lead conversation. (Pattern observed at Mosaic Smart Data; Mosaic Tech FP&A startup loop is sparse.)",
    "rounds": [
      {
        "type": "coding",
        "notes": "2-hour pair-programming exercise: parse user input and convert to a different format. Practical data-manipulation flavor.",
        "sample_questions": [
          "Parse user input and convert it to a different output format."
        ]
      },
      {
        "type": "coding",
        "notes": "1hr technical: Java + SQL + Unix fundamentals.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "COO + eng-lead conversations.",
        "sample_questions": []
      }
    ],
    "role_notes": "Multiple 'Mosaic' entities exist \u2014 most public interview data is from Mosaic Smart Data (post-trade analytics, London). Mosaic Tech (FP&A SaaS, US) has near-zero public interview data; expect generic startup loop. Treat pattern as inferred for FP&A startup.",
    "sources": [
      "https://www.glassdoor.com/Interview/Mosaic-Smart-Data-Software-Engineer-Interview-Questions-EI_IE2923979.0,17_KO18,35.htm",
      "https://dataford.io/interview-guides/mosaic-north-america/software-engineer",
      "https://www.glassdoor.com/Interview/MOSAIC-Software-Engineer-Interview-Questions-EI_IE1051860.0,6_KO7,24.htm"
    ],
    "confidence": "low"
  },
  "Forge": {
    "loop_shape": "Recruiter (30m) -> coding challenge / DS&A screen -> 5hr onsite of ~5 rounds: system design, coding, behavioral; product manager + CTO conversations.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Standard DS&A coding challenge after recruiter screen. Onsite includes a coding round and an algorithm-focused technical round.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Onsite system design round. Private-securities marketplace + brokerage domain.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Product manager conversation + brief CTO discussion.",
        "sample_questions": []
      }
    ],
    "role_notes": "Private-securities marketplace (secondary trading of private-company stock). Frontend/TS/React strong; backend also needed for marketplace + KYC + settlement flows.",
    "sources": [
      "https://www.glassdoor.com/Interview/Forge-Interview-Questions-E2085190.htm",
      "https://www.interviewquery.com/interview-guides/forge-software-engineer",
      "https://forgeglobal.com/careers/"
    ],
    "confidence": "med"
  },
  "Middesk": {
    "loop_shape": "Recruiter -> technical CoderPad pair-programming (backend-flavored, business-verification logic with REST+TypeORM) -> 4hr panel (HM + Web API/DB + PM + system design).",
    "rounds": [
      {
        "type": "coding",
        "notes": "Practical pair-programming on CoderPad. JSON parsing + business-verification logic via REST API / TypeORM. NOT algorithm-heavy.",
        "sample_questions": []
      },
      {
        "type": "api_design",
        "notes": "DB-to-endpoint round: schema creation through API endpoint development. Universal fintech-infra theme.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "System design with collaboration emphasis. KYB (business verification) domain.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Hiring-manager + PM brainstorming round.",
        "sample_questions": []
      }
    ],
    "role_notes": "B2B KYB (business identity verification). Ruby on Rails + Postgres + React; some Scala/Python/Go. 2.9/5 difficulty. Practical-coding bar, not algo-heavy.",
    "sources": [
      "https://www.glassdoor.com/Interview/Middesk-Software-Engineer-Interview-Questions-EI_IE3244626.0,7_KO8,25.htm",
      "https://www.glassdoor.com/Interview/Middesk-Interview-RVW70783789.htm",
      "https://www.interviewquery.com/interview-guides/middesk"
    ],
    "confidence": "med"
  },
  "Pinwheel": {
    "loop_shape": "Recruiter -> practical coding screen with 2 engineers -> system design (multi-scale walkthrough) -> mock outage / debugging-via-logs interview -> 2 execs (final). ~29-60 days.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Practical coding screen with 2 engineers. Backend/web-microservices flavored (Pinwheel is payroll-data API).",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Walk through a design at multiple scales (small -> large) \u2014 explicit scaling-discussion structure.",
        "sample_questions": []
      },
      {
        "type": "debugging",
        "notes": "Mock-outage round: verbally troubleshoot a system; can ask the interviewer for logs. Production-incident style.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Two Pinwheel execs in the loop in addition to functional team.",
        "sample_questions": []
      }
    ],
    "role_notes": "Payroll-connectivity API (income/employment verification). Backend microservices + customer-facing APIs. The mock-outage / debugging round is distinctive and worth practicing.",
    "sources": [
      "https://www.glassdoor.com/Interview/Pinwheel-NY-Interview-Questions-E4378725.htm",
      "https://www.pinwheelapi.com/company/careers",
      "https://job-boards.greenhouse.io/pinwheelapi/jobs/7712545003"
    ],
    "confidence": "med"
  },
  "Point72": {
    "loop_shape": "HR screen (30-60m) -> HackerRank OA (LC algo + SQL, medium-to-hard) -> 2+ technical rounds (DS&A, language-specific: C#, Python, or Java) -> possible take-home. ~17 days median for SWE.",
    "rounds": [
      {
        "type": "coding",
        "notes": "OA on HackerRank: mix of algorithmic and SQL. Medium-to-hard. Software-engineering principles (testing, source control) explicitly assessed.",
        "sample_questions": [
          "Python data-manipulation tasks + SQL window-function/joins/aggregations across large tables."
        ]
      },
      {
        "type": "sql",
        "notes": "Real data-analysis scenarios: joins across large tables, window functions, aggregations. Mirrors quant research workflows.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "For SDE roles, light system-design / DS&A combined. For quant-dev, less classic-FAANG-system-design.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Cultural fit + motivation.",
        "sample_questions": []
      }
    ],
    "role_notes": "Hedge fund. SDE + quant-dev tracks differ. Backend stacks include C#, Python, Java. Code quality > clever algos. Probability/stats deep knowledge for quant-dev roles only.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/point72-software-engineer",
      "https://www.glassdoor.com/Interview/Point72-Software-Engineer-Interview-Questions-EI_IE1032703.0,7_KO8,25.htm",
      "https://www.datainterview.com/blog/point72-quantitative-researcher-interview"
    ],
    "confidence": "high"
  },
  "Jump Trading": {
    "loop_shape": "Codility/HackerRank OA -> C++ proficiency phone screen -> final round: 3x 45-min rounds onsite (~3hr total). Some loops also have a UI/front-end variant.",
    "rounds": [
      {
        "type": "coding",
        "notes": "OA on Codility; phone screen probes C++ proficiency (system programming, low-level concepts). Final rounds: 3x 45-min C++/algo.",
        "sample_questions": [
          "C++ proficiency: memory model, RAII, templates, move-semantics; low-level systems questions."
        ]
      },
      {
        "type": "system_design",
        "notes": "Low-latency / HFT-adjacent design at senior level. Core-dev role is infrastructure-and-systems-heavy.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Standard behavioral; secretive firm \u2014 low public detail.",
        "sample_questions": []
      }
    ],
    "role_notes": "HFT prop trading. C++ is the language. 'Core dev' is the infra/backend SDE track. Modest behavioral footprint vs heavy technical depth.",
    "sources": [
      "https://www.glassdoor.co.uk/Interview/Jump-Trading-Software-Engineer-Interview-Questions-EI_IE251744.0,12_KO13,30.htm",
      "https://nodeflair.com/companies/jump-trading/interviews/c-software-engineer",
      "https://www.teamblind.com/company/Jump-Trading/posts/jump-trading-interview"
    ],
    "confidence": "med"
  },
  "Virtu Financial": {
    "loop_shape": "OA (LC-style, 5 questions, you write your own tests) -> technical rounds (mix of LC + brain teasers + market-making domain) -> behavioral. ~18 days median.",
    "rounds": [
      {
        "type": "coding",
        "notes": "OA fairly easy LeetCode-style, ~5 questions \u2014 but YOU write your own test cases. Topics: loops, arrays, basic algorithms.",
        "sample_questions": [
          "URLSearchParams implementation (reported 2024).",
          "Clock-hands problem: angle between hour and minute hand at 15:15; when do they meet again?"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Domain probe: 'Who are market makers?' Brain teasers and skill-gap probing reported.",
        "sample_questions": [
          "Who are market makers?"
        ]
      }
    ],
    "role_notes": "Global market-maker. Less algo-rigorous than Jane Street / Jump but expects you to write test cases yourself. Some HR/interviewer disorganization reported. Brain teasers expected.",
    "sources": [
      "https://www.glassdoor.com/Interview/Virtu-Financial-Software-Engineer-Interview-Questions-EI_IE337434.0,15_KO16,33.htm",
      "https://www.wallstreetoasis.com/company/virtu-financial/interview",
      "https://www.tradermath.org/knowledge-base/virtu-financial-interview-guide"
    ],
    "confidence": "med"
  },
  "Extend": {
    "loop_shape": "Hiring-manager screen -> 3 team-member meetings (different role aspects) -> final case-study presentation. 2.76/5 difficulty; 'one of the more straightforward processes' per candidates.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Practical coding + system design \u2014 explicitly NOT 'silly algorithms', per candidate report.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Discussed during 1:1s; virtual-card / card-issuing fintech domain.",
        "sample_questions": []
      },
      {
        "type": "take_home",
        "notes": "Final case-study presentation.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Multiple team-member 1:1s; culture-fit weighted.",
        "sample_questions": []
      }
    ],
    "role_notes": "Virtual-card / card-issuing infra. ~20-day hiring timeline. Below-average difficulty; emphasizes practical engineering. Some candidate-experience complaints exist.",
    "sources": [
      "https://www.glassdoor.com/Interview/Extend-Inc-Interview-Questions-E3381711.htm",
      "https://www.glassdoor.com/Salary/Extend-Inc-Salaries-E3381711.htm"
    ],
    "confidence": "low"
  },
  "Chime": {
    "loop_shape": "Recruiter (30-45m) -> coding round -> system design round -> manager round. 3/5 difficulty. Stack: Go, Python, Ruby; AWS.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Standard DS&A coding screen. LC-medium.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Backend system-design. Concrete reported topics: load-balanced multi-instance backend service; production-grade Remote Deposit Capture (mobile check-deposit) for consumer banking.",
        "sample_questions": [
          "Design a backend service deployed across multiple instances behind a load balancer.",
          "Design a production-grade Remote Deposit Capture (RDC) feature for mobile check deposit."
        ]
      },
      {
        "type": "behavioral",
        "notes": "Manager round; team-fit + ownership.",
        "sample_questions": []
      }
    ],
    "role_notes": "Neobank. 4+ years backend with Go/Python/Ruby + AWS. Consumer-banking domain with real-money correctness + KYC + fraud + compliance themes.",
    "sources": [
      "https://www.glassdoor.com/Interview/Chime-Software-Engineer-Interview-Questions-EI_IE1493686.0,5_KO6,23.htm",
      "https://www.interviewquery.com/interview-guides/chime-software-engineer",
      "https://prachub.com/companies/chime/positions/software-engineer/categories/system-design"
    ],
    "confidence": "high"
  },
  "Wealthfront": {
    "loop_shape": "Recruiter -> 7-day take-home -> manager call -> onsite: 2 main technical modules (functional pair-program + analytic/design) + behavioral. Backend interviews in Java.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "7-day take-home assignment (reported as tedious). Gates entry to engineering-director conversation.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "Functional Interview Module: pair-program with an engineer; build working, tested software from requirements. Backend = Java.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Analytic/Design Module: well-defined problems + new situations applying CS knowledge (DS/algo to real scenarios) + deductive/inductive reasoning.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Manager call early; standard behavioral integrated into onsite.",
        "sample_questions": []
      }
    ],
    "role_notes": "Robo-advisor / wealth-management. Java-heavy backend. The 7-day take-home is the gate; budget for it.",
    "sources": [
      "https://eng.wealthfront.com/2021/04/27/the-engineering-interview-at-wealthfront/",
      "https://www.interviewquery.com/interview-guides/wealthfront-software-engineer",
      "https://www.glassdoor.com/Interview/Wealthfront-Software-Engineer-Interview-Questions-EI_IE395250.0,11_KO12,29.htm"
    ],
    "confidence": "high"
  },
  "Stash": {
    "loop_shape": "Recruiter -> take-home coding (CRUD-flavored) -> technical homework walkthrough -> DS&A round -> culture fit. Some loops report 4hr whiteboard+system-design with senior staff.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Take-home: build a small CRUD app with variations. Showcase coding skills end-to-end.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "DS&A pair-coding focused on data structures and algorithms. Standard prep applies.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "Whiteboarding + system design at senior level. Brokerage + micro-investing domain.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Culture-fit round.",
        "sample_questions": []
      }
    ],
    "role_notes": "Micro-investing + brokerage app. Reliable/scalable backend services + core APIs + trading systems.",
    "sources": [
      "https://www.glassdoor.com/Interview/Stash-Senior-Backend-Engineer-Interview-Questions-EI_IE1513331.0,5_KO6,29.htm",
      "https://blog.powertofly.com/interviewing-at-stash",
      "https://nodeflair.com/companies/stash/interviews"
    ],
    "confidence": "med"
  },
  "Block": {
    "loop_shape": "Technical screen -> onsite: 2x pair-programming coding + 1 system design + 1 past-technical-design + 1 hiring-manager. ~3.1/5 difficulty.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Practical coding (NOT LeetCode): e.g. 'Build an app to split a bill with friends.' CoderPad with screen-share. 1-2 interviewers, 60 min. Communication + collaboration + requirements analysis + code fluency + troubleshooting graded.",
        "sample_questions": [
          "Build an app to split a bill with friends."
        ]
      },
      {
        "type": "system_design",
        "notes": "High-level system-design. They share the prompt before the onsite so you can prepare.",
        "sample_questions": [
          "Design a hotel-booking system."
        ]
      },
      {
        "type": "behavioral",
        "notes": "Past-technical-design round (deep dive into a prior project) + hiring-manager conversation.",
        "sample_questions": []
      }
    ],
    "role_notes": "Square/Cash App/Afterpay parent. Polyglot, but Cash/Square backends use Java/Kotlin/Go. Practical-coding bar is the defining feature \u2014 prep for build-something-real, not algo trickery.",
    "sources": [
      "https://www.glassdoor.com/Interview/Block-Software-Engineer-Interview-Questions-EI_IE422050.0,5_KO6,23.htm",
      "https://interviewing.io/block-interview-questions",
      "https://algocademy.com/blog/top-square-block-interview-questions-for-software-engineers/"
    ],
    "confidence": "high"
  },
  "Sequence": {
    "loop_shape": "Initial call -> ~1hr take-home -> 60-min pair-program technical (extends take-home) -> 30-min product round w/ VP Eng -> 45-min system design -> 30-min founder/culture -> references. ~1-2 weeks.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Lightweight (<1hr) coding exercise. Used as the foundation for the live pair-program round.",
        "sample_questions": []
      },
      {
        "type": "coding",
        "notes": "60-min pair-program extending the take-home. Implement functions/classes + write a test suite as you build. NO obscure algos or trick questions. Standard-library + testing-library fluency expected.",
        "sample_questions": []
      },
      {
        "type": "system_design",
        "notes": "45-min collaborative whiteboard discussion. No single right answer \u2014 graded on decomposition, tradeoffs, communication. Billing/revenue-ops domain.",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "Product round w/ VP Eng (AI usage in your work + Sequence's product probed); founder culture round.",
        "sample_questions": []
      }
    ],
    "role_notes": "Billing/revenue-ops SaaS startup (NOT to be confused with Chain's old 'Sequence' ledger product). Strong product-thinking + AI-leverage probe is distinctive. Lowest-trick interview pattern of the bunch.",
    "sources": [
      "https://www.sequencehq.com/blog/how-we-interview-engineers-at-sequence"
    ],
    "confidence": "high"
  },
  "BlackRock": {
    "loop_shape": "Recruiter -> OA (2 coding, DS&A \u2014 e.g. valid parentheses, graphs) -> technical screen -> onsite: usually 2 technical + 1 HR. Aladdin & Technology track.",
    "rounds": [
      {
        "type": "coding",
        "notes": "OA: 2 coding questions on DS&A (valid-parens, graph traversal). Onsite: relatively easy DS&A. Language-agnostic; Aladdin internally uses Java/Python/JS.",
        "sample_questions": [
          "Check if a string can be rearranged to form a palindrome.",
          "Find pairs in an array that sum to a target value, handling duplicates.",
          "Find the top-k frequent words from a large dataset."
        ]
      },
      {
        "type": "system_design",
        "notes": "Distributed-systems design within Aladdin's context: how features fit the platform; multi-tenant customization across institutional clients; correctness + audit trails (real-money risk).",
        "sample_questions": []
      },
      {
        "type": "behavioral",
        "notes": "OOP + Java-fundamentals discussion. Resume project deep-dive \u2014 something you led end-to-end.",
        "sample_questions": []
      }
    ],
    "role_notes": "World's largest asset manager. Aladdin is the flagship platform. Java-heavy; lower algorithmic bar than FAANG but higher correctness/audit bar. Practical fluency > LC over-rotation.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/blackrock-software-engineer",
      "https://nodeflair.com/companies/blackrock/interviews/aladdin-technology",
      "https://medium.com/career-drill/backend-engineer-blackrock-interview-experience-6cac351a559a"
    ],
    "confidence": "high"
  },
  "Attentive": {
    "loop_shape": "Recruiter screen -> Engineering Screen (Coding + Project Retro) -> Onsite (multi-round)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Engineering Screen coding portion; emphasis on walking through thought process + collaboration. Mid-difficulty DS&A."
      },
      {
        "type": "behavioral",
        "notes": "'Project Retro' segment: deep-dive on past project, challenges, decisions, business impact."
      },
      {
        "type": "coding",
        "notes": "Onsite coding rounds similar in shape to screen."
      },
      {
        "type": "system_design",
        "notes": "Communication-heavy. Architect from vague/abstract requirements. Handle feedback + iteration."
      },
      {
        "type": "behavioral",
        "notes": "Engineering Manager round: cultural/team fit."
      }
    ],
    "role_notes": "Backend stack: Java/Python/Go + relational + NoSQL. Mid-difficulty; communication weighted heavily. Mixed candidate sentiment (~32% positive Glassdoor).",
    "sources": [
      "https://tech.attentive.com/articles/mastering-engineering-interviews-at-attentive",
      "https://www.interviewquery.com/interview-guides/attentivemobile-software-engineer",
      "https://www.glassdoor.com/Interview/Attentive-Software-Engineer-Interview-Questions-EI_IE2461853.0,9_KO10,27.htm"
    ],
    "confidence": "high"
  },
  "Squarespace": {
    "loop_shape": "Recruiter -> Tech screen (DS&A) -> 4-5 round onsite",
    "rounds": [
      {
        "type": "coding",
        "notes": "Tech screen: DS&A / LeetCode-style."
      },
      {
        "type": "coding",
        "notes": "Onsite coding round, often Java-specific for backend."
      },
      {
        "type": "system_design",
        "notes": "Architecture/scalability; 30-40% weight for senior. Backend: data modeling, microservice patterns. Frontend candidates report dashboard design."
      },
      {
        "type": "behavioral",
        "notes": "Cultural collaboration emphasis."
      },
      {
        "type": "debugging",
        "notes": "Code review round reported in recent loops."
      }
    ],
    "role_notes": "Backend loop = DS&A + Java specifics + system design + behavioral. Frontend candidates see take-home + JS UI rounds. Conversational interview style.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/squarespace-software-engineer",
      "https://www.glassdoor.com/Interview/Squarespace-Software-Engineer-Interview-Questions-EI_IE466343.0,11_KO12,29.htm",
      "https://www.teamblind.com/post/squarespace-interview-prep-q6tle8ei"
    ],
    "confidence": "high"
  },
  "Ridgeline": {
    "loop_shape": "Phone screen -> Collaborative technical interview (2 engineers) -> Full-day onsite (technical + behavioral) -> Upper mgmt 1:1",
    "rounds": [
      {
        "type": "coding",
        "notes": "LeetCode-medium problems during coding portion."
      },
      {
        "type": "coding",
        "notes": "Collaborative technical with 2 engineers."
      },
      {
        "type": "system_design",
        "notes": "Reported on senior loops; not consistently confirmed across all levels."
      },
      {
        "type": "behavioral",
        "notes": "Multiple behavioral/situational rounds; heavy culture-fit emphasis."
      }
    ],
    "role_notes": "Fintech/investment-mgmt SaaS. Difficulty 2.9/5. Process is long (~33 days). Heavy personality/culture filter alongside technical.",
    "sources": [
      "https://www.glassdoor.com/Interview/Ridgeline-Software-Engineer-Interview-Questions-EI_IE3313373.0,9_KO10,27.htm",
      "https://www.teamblind.com/post/software-engineer-onsite-interview-at-ridgeline-wv28mq4c"
    ],
    "confidence": "med"
  },
  "Justworks": {
    "loop_shape": "Recruiter -> Technical screen (live coding) -> Virtual/NYC onsite (4 parts)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Live coding screen: LeetCode-style algorithmic / debugging. ~LC medium."
      },
      {
        "type": "coding",
        "notes": "Onsite coding: reportedly 2 LC mediums in one hour."
      },
      {
        "type": "system_design",
        "notes": "Reported: large-scale payroll platform; JIRA/Kanban-style board with data model + API + system design."
      },
      {
        "type": "behavioral",
        "notes": "PM conversation."
      },
      {
        "type": "behavioral",
        "notes": "EM conversation."
      }
    ],
    "role_notes": "HR/payroll SaaS. Architecture round combines data modeling + API design + system design. Difficulty 2.7/5. Tractable for ex-Amazon SDE.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/justworks-software-engineer",
      "https://www.glassdoor.com/Interview/Justworks-Software-Engineer-Interview-Questions-EI_IE915954.0,9_KO10,27.htm",
      "https://www.teamblind.com/post/justworks-interview-questions-kmqwhbdd"
    ],
    "confidence": "high"
  },
  "Unify": {
    "loop_shape": "Sparse public data. Likely small-startup SDE pattern: recruiter -> tech screen -> onsite (2 coding + system/product design + behavioral/founder)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: live coding via Coderpad-style."
      },
      {
        "type": "coding",
        "notes": "Inferred: second coding/practical round."
      },
      {
        "type": "system_design",
        "notes": "Inferred: backend platform / data pipeline design for GTM data ingestion."
      },
      {
        "type": "behavioral",
        "notes": "Founder/leadership chat; mission-driven (ex-Ramp/Scale leadership)."
      }
    ],
    "role_notes": "Series A/B startup founded 2023 (ex-Ramp/Scale). No public interview reports for Unify GTM specifically. Inference from small B2B SaaS SDE loop pattern. Treat with caution.",
    "sources": [
      "https://jobs.battery.com/jobs/unify-gtm",
      "https://www.builtinsf.com/job/software-engineer-ai/7563614"
    ],
    "confidence": "low"
  },
  "Drata": {
    "loop_shape": "Recruiter -> 60-min coding phone -> Virtual onsite (2 coding + system design + craft deep-dive + behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "60-min phone DSA, ~LC medium."
      },
      {
        "type": "coding",
        "notes": "Onsite coding round 1."
      },
      {
        "type": "coding",
        "notes": "Onsite coding round 2."
      },
      {
        "type": "system_design",
        "notes": "Standard distributed system design."
      },
      {
        "type": "behavioral",
        "notes": "Craft deep-dive (past project / technical depth)."
      },
      {
        "type": "behavioral",
        "notes": "Values / cultural behavioral."
      }
    ],
    "role_notes": "Compliance automation SaaS. ~3-4 week cycle. Difficulty 3/5. Well-structured loop; coding-heavy.",
    "sources": [
      "https://www.glassdoor.com/Interview/Drata-Interview-Questions-E4333749.htm",
      "https://www.techinterview.org/companies/drata-interview-guide/"
    ],
    "confidence": "high"
  },
  "Yext": {
    "loop_shape": "Tech screen (coding) -> Multi-round onsite (coding + debugging + behavioral + design)",
    "rounds": [
      {
        "type": "coding",
        "notes": "~1hr DSA from LeetCode pool. Graph problems heavily featured."
      },
      {
        "type": "debugging",
        "notes": "Reported 30-min debugging round on a banking app with multiple functions."
      },
      {
        "type": "coding",
        "notes": "Graph problems: flood-fill, mine-counting on 2D matrix (DFS/BFS)."
      },
      {
        "type": "system_design",
        "notes": "OOD/design: e.g., airline search system design."
      },
      {
        "type": "behavioral",
        "notes": "Standard fit."
      }
    ],
    "role_notes": "Search/listings SaaS. Graph/DFS-heavy coding. Debugging round is distinctive \u2014 practice reading unfamiliar code.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/yext-software-engineer",
      "https://medium.com/write-a-catalyst/how-i-cracked-the-yext-interview-software-engineer-iii-role-2025-3a8490e7fa8f",
      "https://www.glassdoor.com/Interview/Yext-Software-Engineer-Interview-Questions-EI_IE312260.0,4_KO5,22.htm"
    ],
    "confidence": "high"
  },
  "The Trade Desk": {
    "loop_shape": "CodeSignal OA -> Recruiter -> Onsite (2 coding + 2 system design)",
    "rounds": [
      {
        "type": "coding",
        "notes": "CodeSignal assessment + take-home. Reported: N-way set associative cache implementation with refactoring, optimization, and concurrency quizzes."
      },
      {
        "type": "coding",
        "notes": "Live coding ~LC medium DSA."
      },
      {
        "type": "system_design",
        "notes": "OOP-style design (no code execution). e.g., URL shortener, rate limiter, social feed."
      },
      {
        "type": "system_design",
        "notes": "Second design round - data models, APIs, scalability tradeoffs."
      }
    ],
    "role_notes": "AdTech. Heavy on caching/concurrency (real bid-time infra). 2 coding + 2 design is unusual weight - prep design hard.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/the-trade-desk-software-engineer",
      "https://hw.glich.co/resources/companies/the-trade-desk/interview-process/software-engineer-i-software-engineer",
      "https://www.jointaro.com/interviews/companies/the-trade-desk/experiences/software-engineer-united-states-march-1-2024-no-offer-negative-ca3716e4/"
    ],
    "confidence": "high"
  },
  "Secureframe": {
    "loop_shape": "Recruiter -> Code screen -> Virtual onsite",
    "rounds": [
      {
        "type": "coding",
        "notes": "60-min coding question."
      },
      {
        "type": "system_design",
        "notes": "60-min architecture design."
      },
      {
        "type": "behavioral",
        "notes": "30-min behavioral."
      },
      {
        "type": "behavioral",
        "notes": "Additional behavioral round(s)."
      }
    ],
    "role_notes": "Compliance SaaS (Drata competitor). Process <3 weeks. Difficulty 3/5; high positive rating. Lean loop - 1 coding + 1 design.",
    "sources": [
      "https://www.glassdoor.com/Interview/Secureframe-Senior-Software-Engineer-Interview-Questions-EI_IE3427807.0,11_KO12,36.htm"
    ],
    "confidence": "med"
  },
  "Asana": {
    "loop_shape": "Recruiter -> Technical phone (~1hr) -> Onsite (4-6 rounds, 45-60 min each)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Tech phone: coding + algorithm + OOD discussion. Candidates pick language + editor. IDE-based, not whiteboard."
      },
      {
        "type": "coding",
        "notes": "Onsite coding (2-hr exercise). Heavy emphasis on OOD."
      },
      {
        "type": "coding",
        "notes": "Algorithms round (DS-focused, collaborative, not memorization)."
      },
      {
        "type": "system_design",
        "notes": "Design round: clarity, simplicity, explicit tradeoffs."
      },
      {
        "type": "behavioral",
        "notes": "For senior roles: structured behavioral on past technical problems."
      }
    ],
    "role_notes": "Official guide is detailed and public. Three buckets: coding, algorithms, design. Strongly emphasizes collaboration + tradeoff articulation. Object-oriented design weighted heavily.",
    "sources": [
      "https://asana.com/eng/interview-guide",
      "https://asana.com/inside-asana/asana-engineering-interview-guide",
      "https://www.tryexponent.com/guides/asana-software-engineer-interview"
    ],
    "confidence": "high"
  },
  "Iterable": {
    "loop_shape": "Recruiter -> 1-2 Zoom tech screens (Coderpad) -> Single-day onsite (3 tech screens + 15-min presentation + Q&A)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Coderpad coding screens; candidate picks language (Scala-heavy internally but not required)."
      },
      {
        "type": "coding",
        "notes": "Onsite coding/algorithms. String + Array emphasis. 34 problems known: 7 Easy / 21 Medium / 6 Hard distribution."
      },
      {
        "type": "system_design",
        "notes": "One onsite tech screen tends to be system design."
      },
      {
        "type": "behavioral",
        "notes": "15-min candidate-led presentation on a project + 15-min Q&A. Includes founder/team chat + lunch."
      }
    ],
    "role_notes": "Marketing automation SaaS. Official 'how-we-work' repo on GitHub. Distinctive presentation round - prep a 15-min deck on a project.",
    "sources": [
      "https://github.com/Iterable/how-we-work/blob/master/how_we_interview_engineers.md",
      "https://www.interviewquery.com/interview-guides/iterable-software-engineer",
      "https://iterable.com/blog/4-tips-to-improve-the-technical-interview/"
    ],
    "confidence": "high"
  },
  "Braze": {
    "loop_shape": "HR screen -> Technical phone -> Onsite (3 rounds: EM behavioral + system design + debugging)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Technical phone: algorithmic, HackerRank-style. Live coding via Zoom + shared link."
      },
      {
        "type": "system_design",
        "notes": "Onsite system design / data processing round."
      },
      {
        "type": "debugging",
        "notes": "Distinctive: race-to-finish debugging round - solve as many fixes as possible. Reported as the hardest round."
      },
      {
        "type": "behavioral",
        "notes": "EM behavioral."
      }
    ],
    "role_notes": "Ruby + JS stack; MongoDB + Postgres backends. Debugging round is the differentiator - practice reading unfamiliar code under time pressure.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/braze-software-engineer",
      "https://www.glassdoor.ca/Interview/Braze-Software-Engineer-Interview-Questions-EI_IE1879400.0,5_KO6,23.htm",
      "https://nodeflair.com/companies/braze/interviews/sr-software-engineer"
    ],
    "confidence": "high"
  },
  "Kustomer": {
    "loop_shape": "Recruiter -> Behavioral with manager -> LeetCode-style tech screen -> Panel (project deep-dive + behavioral + system design)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Live LC-style screen, <1hr. Easy-medium difficulty - 'very standard'."
      },
      {
        "type": "system_design",
        "notes": "Described as 'easy' by candidates."
      },
      {
        "type": "behavioral",
        "notes": "Manager behavioral early in loop."
      },
      {
        "type": "behavioral",
        "notes": "Project deep-dive in panel."
      }
    ],
    "role_notes": "CX SaaS (Meta-owned). Reported as lighter difficulty than peers. Avg 17 days to hire. Good practice loop.",
    "sources": [
      "https://www.glassdoor.com/Interview/Kustomer-Software-Engineer-Interview-Questions-EI_IE1304497.0,8_KO9,26.htm",
      "https://www.interviewquery.com/interview-guides/kustomer"
    ],
    "confidence": "med"
  },
  "DoubleVerify": {
    "loop_shape": "Phone interview -> Onsite (4-5 hrs: 2 coding + 1 system design + 1 behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Java-flavored; multi-threading focus. e.g., compare two lists of strings for matching results. Easy difficulty but JVM-specific."
      },
      {
        "type": "coding",
        "notes": "Second coding, similar."
      },
      {
        "type": "system_design",
        "notes": "Distributed systems experience signal. Reported: securely upload photos system. Candidates expected to address core problem, not just name-drop tools."
      },
      {
        "type": "behavioral",
        "notes": "Standard fit."
      }
    ],
    "role_notes": "AdTech verification. Java + multithreading specifically tested. Hands-on distributed systems experience signal expected. Difficulty 3/5.",
    "sources": [
      "https://www.glassdoor.com/Interview/DoubleVerify-Staff-Software-Engineer-Interview-Questions-EI_IE379389.0,12_KO13,36.htm",
      "https://www.linkedin.com/pulse/interview-tip-tricks-from-doubleverifys-vp-nicholas-giannotti",
      "https://www.teamblind.com/post/staff-software-engineer-interview-at-doubleverify-ujjs2qd1"
    ],
    "confidence": "high"
  },
  "Mighty Networks": {
    "loop_shape": "Recruiter -> CEO chat -> 2 technical interviews -> Team meet-and-greets",
    "rounds": [
      {
        "type": "coding",
        "notes": "Standard small-startup live coding; tractable difficulty."
      },
      {
        "type": "coding",
        "notes": "Second technical."
      },
      {
        "type": "behavioral",
        "notes": "CEO chat - mission/fit/culture-add."
      }
    ],
    "role_notes": "Community-platform SaaS. Lightweight loop. Difficulty 2.7/5; avg 7 days to hire. Conversational - less formal than FAANG-clones.",
    "sources": [
      "https://www.glassdoor.com/Interview/Mighty-Networks-Software-Engineer-Interview-Questions-EI_IE1660456.0,15_KO16,33.htm",
      "https://www.mightynetworks.com/careers"
    ],
    "confidence": "med"
  },
  "Beacons": {
    "loop_shape": "30-min recruiter -> 2 tech rounds -> 1-2 behavioral (founder-led)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Tech stack familiarity-focused; 'straightforward'. Not LC-heavy."
      },
      {
        "type": "coding",
        "notes": "Second tech round."
      },
      {
        "type": "behavioral",
        "notes": "Chat with founders + team in 'cool, chill' atmosphere."
      }
    ],
    "role_notes": "Creator-economy SaaS. Difficulty 2/5; 67% positive. ~14 days to hire. Founder-led culture-fit emphasis.",
    "sources": [
      "https://www.glassdoor.com/Interview/Beacons-AI-Software-Engineer-Interview-Questions-EI_IE5606528.0,10_KO11,28.htm"
    ],
    "confidence": "low"
  },
  "Navan": {
    "loop_shape": "Application -> HackerRank OA -> Onsite (3 algo + 1 system design + 1 manager)",
    "rounds": [
      {
        "type": "coding",
        "notes": "HackerRank OA: multiple choice + algorithm; reported as hard LC-difficulty."
      },
      {
        "type": "coding",
        "notes": "Coderpad live coding. Reported: LRU cache impl in Java; tuple-sum enumeration; type-ahead search from scratch; BFS problems."
      },
      {
        "type": "coding",
        "notes": "Senior: code-design round - production-quality code + APIs with request/response models."
      },
      {
        "type": "system_design",
        "notes": "Reported: Property Listing Service low-level design."
      },
      {
        "type": "behavioral",
        "notes": "Manager round."
      }
    ],
    "role_notes": "Corporate travel/expense (formerly TripActions). Hard OA - reportedly LC-hard. 5-round onsite is heavy. Java-flavored.",
    "sources": [
      "https://www.glassdoor.com/Interview/TripActions-Software-Engineer-Interview-Questions-EI_IE1376371.0,11_KO12,29.htm",
      "https://leetcode.com/discuss/interview-experience/6157051/",
      "https://www.teamblind.com/post/NavanTripActions-Backend-Engineer-Interview-zQbmBcz6"
    ],
    "confidence": "high"
  },
  "GlossGenius": {
    "loop_shape": "Recruiter -> Final round (tech + behavioral) for IC; senior: Recruiter -> Coding -> System Design -> Experience -> Values -> Cross-functional -> Team/manager",
    "rounds": [
      {
        "type": "coding",
        "notes": "Live coding; described as easier than FAANG."
      },
      {
        "type": "system_design",
        "notes": "~50 min. Broad-and-deep on a real project. Tests collaboration + ownership thinking."
      },
      {
        "type": "behavioral",
        "notes": "Experience interview led by eng."
      },
      {
        "type": "behavioral",
        "notes": "Values interview."
      },
      {
        "type": "behavioral",
        "notes": "Cross-functional partnership interview."
      }
    ],
    "role_notes": "Vertical SaaS for beauty/wellness solopreneurs. Heavy values/behavioral weighting. Status updates within 3 days each step.",
    "sources": [
      "https://www.teamblind.com/post/glossgenius-interview-loop-q2gpx2gb",
      "https://www.glassdoor.com/Interview/GlossGenius-Software-Engineer-Interview-Questions-EI_IE2538673.0,11_KO12,29.htm"
    ],
    "confidence": "med"
  },
  "Opus Training": {
    "loop_shape": "Sparse public data. Inferred small B2B SaaS SDE pattern: recruiter -> phone coding -> take-home OR onsite (2 coding + 1 design + 1 behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: phone screen live coding."
      },
      {
        "type": "take_home",
        "notes": "Inferred: small B2B SaaS take-home common."
      },
      {
        "type": "coding",
        "notes": "Inferred: onsite coding."
      },
      {
        "type": "system_design",
        "notes": "Inferred: backend design for multi-tenant training platform / video content delivery."
      },
      {
        "type": "behavioral",
        "notes": "Inferred: founder/EM chat."
      }
    ],
    "role_notes": "Restaurant frontline LMS SaaS (mobile, multilingual, video). No public interview reports for the engineering loop. Use small-startup template; expect heavy mobile/i18n discussion in design rounds.",
    "sources": [
      "https://www.opus.so/platform/training",
      "https://www.glassdoor.com/Overview/Working-at-Opus-Training-EI_IE8199705.11,24.htm"
    ],
    "confidence": "low"
  },
  "Output": {
    "loop_shape": "Sparse public data. Inferred: recruiter -> tech screen -> onsite (coding + design + behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred standard live coding."
      },
      {
        "type": "system_design",
        "notes": "Inferred: audio-pipeline / DSP-aware design likely if backend; web/cloud-app design if platform side."
      },
      {
        "type": "behavioral",
        "notes": "Inferred founder/team chat."
      }
    ],
    "role_notes": "Music software (Arcade, plugins). $45M Series A. Audio/DSP domain; backend roles likely touch cloud + Electron + plugin ecosystem. No public SWE interview reports. Difficulty 3/5 (general). Treat with caution.",
    "sources": [
      "https://www.glassdoor.com/Overview/Working-at-Output-EI_IE3130581.11,17.htm",
      "https://app.welcometothejungle.com/companies/Output"
    ],
    "confidence": "low"
  },
  "Salesforce": {
    "loop_shape": "Recruiter -> Tech phone screen (~1hr) -> Onsite (~4 hrs: 2hr coding + 1hr system design + 1hr behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "OA: 2 medium DSA. Onsite: 2hr coding total - trees/linked lists/strings/hash tables. LC medium sufficient. Java-specific language depth tested."
      },
      {
        "type": "system_design",
        "notes": "1 hr. For MTS/LMTS: low-level design heavy (Zoom Car, ticketing system, ride-share). For backend: multi-tenant SaaS, rate limiting, partitioning, failure modes. Includes class diagrams, API design (Richardson Maturity Model), ER diagrams."
      },
      {
        "type": "behavioral",
        "notes": "1 hr. Ohana culture, customer-centricity emphasis. Managerial + resume grilling on senior loops."
      }
    ],
    "role_notes": "Big-tech decentralized loop; varies by org (Slack, Quip, Tableau internal). Coding is most heavily weighted. Tell recruiter early if backend-only - default loop assumes full-stack.",
    "sources": [
      "https://interviewing.io/salesforce-interview-questions",
      "https://leetcode.com/discuss/interview-experience/5815567/Salesforce-or-MTS-or-September-2024-or-Select/",
      "https://leetcode.com/discuss/post/6857467/salesforce-interview-experience-lmts-apr-a9rw/"
    ],
    "confidence": "high"
  },
  "Stainless": {
    "loop_shape": "Sparse public data. Inferred: recruiter -> tech screen -> take-home OR onsite focused on SDK generation / API design",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: practical coding (not LC-style); expect parser/codegen problems given product focus."
      },
      {
        "type": "api_design",
        "notes": "Inferred: API/SDK design round - their product IS SDK generation from OpenAPI specs. Stripe-style API design likely."
      },
      {
        "type": "take_home",
        "notes": "Inferred: small take-home around code generation, type systems, or schema parsing."
      },
      {
        "type": "behavioral",
        "notes": "Inferred founder chat."
      }
    ],
    "role_notes": "Generates SDKs from OpenAPI specs (used by OpenAI, Anthropic, Cloudflare). Founders ex-Stripe API team. Expect Stripe-flavored API-design emphasis + strong type-system / codegen interest. No public SWE interview reports.",
    "sources": [
      "https://www.tryexponent.com/guides/stripe-software-engineer-interview"
    ],
    "confidence": "low"
  },
  "Airtable": {
    "loop_shape": "Recruiter (30 min) -> Tech assessment (take-home or coding challenge) -> Onsite (~6 hrs, 4-5 rounds)",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Sometimes a take-home assignment / online coding challenge: algorithmic problems or small project."
      },
      {
        "type": "coding",
        "notes": "Onsite coding: basic DS&A, two pointers, DFS/BFS. Standard distribution."
      },
      {
        "type": "system_design",
        "notes": "Architecture + system design; common at all levels."
      },
      {
        "type": "frontend",
        "notes": "Product engineer track has UI/component-building round."
      },
      {
        "type": "behavioral",
        "notes": "Values fit + collaboration."
      }
    ],
    "role_notes": "No-code DB / spreadsheet-like product. Product Engineer track is distinct (frontend-heavy). Backend/Platform track is more standard DS&A + design. 6-hour onsite is intense.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/airtable-software-engineer",
      "https://www.tryexponent.com/guides/airtable-swe-interview",
      "https://algodaily.com/companies/airtable"
    ],
    "confidence": "high"
  },
  "Sigma": {
    "loop_shape": "Hiring mgr phone -> Technical phone screen (CoderPad) -> 4-round virtual onsite panel",
    "rounds": [
      {
        "type": "coding",
        "notes": "Phone screen: Python, NOT LeetCode-style. Practical problems mimicking daily work. Cares about reasoning + code structure + tests, not finishing."
      },
      {
        "type": "coding",
        "notes": "Onsite Algorithms round: similar to phone but harder, focus on complex state mgmt + maintainability. Reported: binary parser tree from token array."
      },
      {
        "type": "system_design",
        "notes": "High-level abstraction questions about limitations, workload variations, correctness."
      },
      {
        "type": "frontend",
        "notes": "Product Design: interface design + code structure + requirement handling."
      },
      {
        "type": "behavioral",
        "notes": "Past projects + accomplishments + collaboration. Product demo if relevant."
      }
    ],
    "role_notes": "BI/spreadsheet analytics tool. Officially anti-LeetCode. Recent (May 2025) OA includes LLD/system design. Communicate reasoning explicitly.",
    "sources": [
      "https://www.sigmacomputing.com/blog/interviewing-at-sigma",
      "https://www.glassdoor.com/Interview/Sigma-Computing-Software-Engineer-Interview-Questions-EI_IE1887281.0,15_KO16,33.htm",
      "https://www.teamblind.com/post/sigma-computing-on-site-interview-software-engineering-mtadqt2s"
    ],
    "confidence": "high"
  },
  "Glide": {
    "loop_shape": "Sparse public data (no-code app builder, small co.). Inferred: recruiter -> tech screen -> panel (2-3 rounds)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: practical coding; likely TypeScript/React given product."
      },
      {
        "type": "system_design",
        "notes": "Inferred: spreadsheet/data-binding design - their core product is reactive data layer."
      },
      {
        "type": "behavioral",
        "notes": "Get-to-know followed by deeper experience dive in second round."
      }
    ],
    "role_notes": "No-code app platform. Small team; tight loop. Public data describes general process shape but not technical specifics. Expect TS/React + reactive-data depth.",
    "sources": [
      "https://www.glassdoor.com/Interview/Glide-US-Interview-Questions-E564707.htm"
    ],
    "confidence": "low"
  },
  "Monte Carlo": {
    "loop_shape": "Recruiter -> Hiring manager + coding -> 2 technical interviews -> 4-6 hour take-home -> Director final",
    "rounds": [
      {
        "type": "coding",
        "notes": "Coding interview + hiring manager discussion combined."
      },
      {
        "type": "coding",
        "notes": "Two further technical rounds."
      },
      {
        "type": "take_home",
        "notes": "Distinctive: 4-6 hour take-home, 3-4 business days to complete. Followed by a 45-min presentation 2 days later."
      },
      {
        "type": "system_design",
        "notes": "Reported: web crawler design and similar data-platform topics."
      },
      {
        "type": "behavioral",
        "notes": "Director final round."
      }
    ],
    "role_notes": "Data observability platform. Take-home is the differentiator - 4-6hr commitment is a real cost. 3-4 week process. Multiple candidate reports of poor feedback on rejection.",
    "sources": [
      "https://www.glassdoor.com/Interview/Monte-Carlo-Interview-Questions-E2486954.htm",
      "https://www.glassdoor.co.in/Interview/Monte-Carlo-Data-Interview-Questions-E5073603.htm"
    ],
    "confidence": "med"
  },
  "Knock": {
    "loop_shape": "HR intro -> 2 technical interviews -> 2 final (upper mgmt) - all video. ~5 rounds total.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Practical coding reflecting day-to-day work. Process-over-output emphasis. Algorithmic concept explanations included."
      },
      {
        "type": "system_design",
        "notes": "Notification infra is the product - expect notification system design (real-time delivery, fan-out, channel routing, deduplication)."
      },
      {
        "type": "behavioral",
        "notes": "Conversational; reflects company culture."
      },
      {
        "type": "behavioral",
        "notes": "Final round with upper management."
      }
    ],
    "role_notes": "Notifications-infra-as-a-service. ~2 weeks app-to-completion. Highly responsive recruiting. Limited public data; some interpolation from product domain.",
    "sources": [
      "https://www.glassdoor.com/Interview/Knock-Senior-Software-Engineer-Interview-Questions-EI_IE1933635.0,5_KO6,30.htm",
      "https://knock.app/blog"
    ],
    "confidence": "low"
  },
  "LogRocket": {
    "loop_shape": "Phone screen -> Screening exercise (writing/coding) -> Multiple video + panel interviews",
    "rounds": [
      {
        "type": "coding",
        "notes": "Live coding; reported anagram-style problems. ~LC easy/medium."
      },
      {
        "type": "take_home",
        "notes": "Screening exercise: small written/coding take-home."
      },
      {
        "type": "system_design",
        "notes": "Inferred: session replay / event-stream pipeline design likely given product focus."
      },
      {
        "type": "behavioral",
        "notes": "Multiple rounds with team members."
      }
    ],
    "role_notes": "Session replay + observability for frontend apps. Process described as somewhat redundant by some candidates. Difficulty 3/5; 36% positive.",
    "sources": [
      "https://www.glassdoor.com/Interview/LogRocket-Software-Engineer-Interview-Questions-EI_IE2504641.0,9_KO10,27.htm",
      "https://interviewprep.org/logrocket-interview-questions/"
    ],
    "confidence": "med"
  },
  "Neon": {
    "loop_shape": "CV review -> Talent partner call -> 3 technical interviews (1:1 with engineers, 45-60 min each)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Inferred: Go-flavored coding (storage team uses Golang); systems-level problems."
      },
      {
        "type": "system_design",
        "notes": "Inferred: distributed storage / Postgres-internals design - separation of storage and compute, autoscaling, branching."
      },
      {
        "type": "behavioral",
        "notes": "Engineering culture fit + Postgres/infra interest signal."
      }
    ],
    "role_notes": "Serverless Postgres (acquired by Databricks 2025). Backend stack: Go + Kubernetes + Docker + cloud. Postgres internals depth heavily valued. Loop is lean (3 rounds) but each is substantive.",
    "sources": [
      "https://startup.jobs/backend-engineer-neon-3369321",
      "https://neon.com/careers",
      "https://davidgomes.com/one-year-at-a-database-startup-called-neon/"
    ],
    "confidence": "med"
  },
  "Modal Labs": {
    "loop_shape": "Recruiter -> Tech phone (analyze code / sort algorithms) -> Onsite (multi-round)",
    "rounds": [
      {
        "type": "coding",
        "notes": "Distinctive: code-reading / analysis rather than blank-page writing. Sorting algorithm knowledge tested."
      },
      {
        "type": "coding",
        "notes": "Standard live coding likely included in fuller loops."
      },
      {
        "type": "system_design",
        "notes": "Inferred from product domain: serverless infra, container scheduling, Python-runtime sandboxing, GPU scheduling, distributed function execution."
      },
      {
        "type": "behavioral",
        "notes": "Inferred: founder/team chat - small team, mission-driven."
      }
    ],
    "role_notes": "Serverless infra for AI/ML/data (containerized Python on GPUs). Engineering-blog-heavy (erikbern.com). 11 days avg process; difficulty 3.2/5. Public data is sparse on full loop - heavy inference from product. Erik Bernhardsson is technical-leadership signal.",
    "sources": [
      "https://www.glassdoor.com/Interview/Modal-Interview-Questions-E1953636.htm",
      "https://www.teamblind.com/post/modal-interview-4eo8v3dj",
      "https://erikbern.com/2022/12/07/what-ive-been-working-on-modal.html"
    ],
    "confidence": "low"
  },
  "CoreWeave": {
    "loop_shape": "Recruiter screen (30 min) -> Online assessment (Linux/K8s) -> Programming challenge -> System design -> Hiring manager -> Director",
    "rounds": [
      {
        "type": "coding",
        "notes": "Programming challenge: less LC-style, more debugging-an-app + practical concurrency/threading. Go/Python expected."
      },
      {
        "type": "system_design",
        "notes": "Scalable + reliable + maintainable architecture; tradeoffs + tech choices; large-data + real-time scenarios. GPU infra / Kubernetes-heavy."
      },
      {
        "type": "debugging",
        "notes": "OA: Linux + Kubernetes admin, troubleshooting, commands, K8s fundamentals."
      },
      {
        "type": "behavioral",
        "notes": "Hiring manager call."
      },
      {
        "type": "behavioral",
        "notes": "Director call."
      }
    ],
    "role_notes": "AI hyperscaler / GPU cloud. 5-stage Senior SWE loop. ~3 weeks total. Selective - 'fails most engineers'. Stack: Go + Python + Kubernetes + distributed systems. Linux + K8s knowledge is hard prerequisite.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/coreweave-software-engineer",
      "https://www.glassdoor.com/Interview/CoreWeave-Senior-Software-Engineer-Interview-Questions-EI_IE5711823.0,9_KO10,34.htm",
      "https://www.jointaro.com/interviews/companies/coreweave/experiences/senior-software-engineer-united-states-august-1-2025-no-offer-positive-6e5507f9/"
    ],
    "confidence": "high"
  },
  "Lyft": {
    "loop_shape": "Recruiter screen -> 1hr tech phone screen (Coderpad) -> Onsite: 4 rounds (System Design 60m, CS Fundamentals/coding 60m, Laptop Programming Test 90m, Behavioral 45m) -> Team match",
    "rounds": [
      {
        "type": "coding",
        "notes": "Phone screen on Coderpad. LeetCode-style DSA, medium difficulty. Emphasis on clean code and communicating thought process.",
        "example_topics": [
          "arrays/strings",
          "graphs (location/routing flavor)",
          "hash maps",
          "heaps"
        ]
      },
      {
        "type": "coding",
        "notes": "Onsite CS Fundamentals round - laptop or Coderpad. DSA + edge case handling.",
        "example_topics": [
          "data structures",
          "algorithm complexity",
          "edge cases"
        ]
      },
      {
        "type": "coding",
        "notes": "Laptop Programming Test (90 min) - 'most unique aspect'. Internet allowed, choose your language. Graded: correctness 45%, clean code 35%, performance 20%. Closer to a take-home in feel but live.",
        "example_topics": [
          "practical implementation",
          "testing",
          "API consumption"
        ]
      },
      {
        "type": "system_design",
        "notes": "60 min, often on Google Draw/whiteboarding. Topics frequently touch Lyft domain: matching service, location tracking, real-time pricing, payments, notifications. Discuss APIs, DB schema, sharding, caching, websockets, Kafka.",
        "example_topics": [
          "design Uber/Lyft",
          "real-time location tracking",
          "ride matching",
          "surge pricing",
          "notification system"
        ]
      },
      {
        "type": "behavioral",
        "notes": "45 min with EM. Lyft values: 'Disagree and Commit', 'Dive Deep', 'All-in ownership'. Ownership, collaboration, impact stories.",
        "example_topics": [
          "ownership",
          "cross-team conflict",
          "deep technical dive on a past project"
        ]
      }
    ],
    "role_notes": "FAANG-tier rigor. Strong fit for Amazon SDE2 background - ownership stories transfer well. Domain prep on real-time/geo systems pays off. The laptop programming round is the differentiator - practice timed mini-projects.",
    "sources": [
      "https://www.tryexponent.com/guides/lyft-swe-interview",
      "https://www.interviewquery.com/interview-guides/lyft-software-engineer",
      "https://www.glassdoor.com/Interview/Lyft-Software-Engineer-Interview-Questions-EI_IE700614.0,4_KO5,22.htm",
      "https://www.jointaro.com/interviews/companies/lyft/experiences/software-engineer-new-york-ny-july-8-2025-no-offer-positive-8fb3fc38/"
    ],
    "confidence": "high"
  },
  "Bombas": {
    "loop_shape": "Recruiter phone screen -> Hiring manager phone screen -> 2 in-person/virtual interviews. ~30 days end-to-end. Heavily behavioral/culture-fit weighted.",
    "rounds": [
      {
        "type": "behavioral",
        "notes": "Multiple conversational rounds with recruiter, hiring manager, and team members. Heavy culture-fit emphasis. Process described as 'meaningful and very conversational'.",
        "example_topics": [
          "why Bombas / mission alignment (giving back)",
          "collaboration",
          "past project deep dive"
        ]
      },
      {
        "type": "coding",
        "notes": "Role-pattern: small DTC e-commerce company. For an SDE role expect 1 coding round, likely take-home or live screen, focused on practical web/JS or backend skills (Node/Python). LeetCode-easy/medium tier. Not publicly documented for SWE specifically.",
        "example_topics": [
          "e-commerce CRUD",
          "API integration",
          "data manipulation"
        ]
      },
      {
        "type": "system_design",
        "notes": "Role-pattern: likely a single architecture conversation rather than formal whiteboard. Discuss past systems, e-commerce/order pipeline design.",
        "example_topics": [
          "e-commerce platform",
          "inventory system"
        ]
      }
    ],
    "role_notes": "Sparse public data for engineering specifically - most Glassdoor entries are non-eng roles. Expect a low-rigor, culture-heavy loop. Lead with mission alignment and Amazon scale stories. Likely 1 light technical round vs FAANG-tier.",
    "sources": [
      "https://www.glassdoor.com/Interview/Bombas-Interview-Questions-E1605933.htm",
      "https://www.linkedin.com/jobs/view/software-engineer-discovery-at-bombas-4335540374"
    ],
    "confidence": "low"
  },
  "Partiful": {
    "loop_shape": "Role-pattern (no public engineering interview write-ups found): Recruiter screen -> Tech screen (live coding or take-home) -> Onsite ~3-4 rounds (coding, system/product design, team-fit). NYC-based, early-stage consumer social.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Role-pattern: small consumer social startup. Expect 1-2 live coding rounds, often product-flavored (e.g., events/RSVP logic). Likely TypeScript/React or Node. LeetCode easy/medium.",
        "example_topics": [
          "string/array manipulation",
          "event scheduling logic",
          "JS/TS proficiency"
        ]
      },
      {
        "type": "take_home",
        "notes": "Role-pattern: small startups often use a take-home for full-stack. Build a small feature in their stack (React/TS/Node).",
        "example_topics": [
          "mini full-stack feature",
          "API + UI"
        ]
      },
      {
        "type": "system_design",
        "notes": "Role-pattern: lightweight design conversation. Likely product-oriented (design Partiful's invite/RSVP system, push notifications).",
        "example_topics": [
          "event/RSVP system",
          "notifications",
          "social graph basics"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Culture/founder fit at an early-stage startup. Product taste matters - they want builders who use the product.",
        "example_topics": [
          "why Partiful",
          "product taste",
          "ownership at small scale"
        ]
      }
    ],
    "role_notes": "No specific engineering interview data found. Treat as YC-stage consumer social pattern: product taste + practical full-stack ability matters more than algo prowess. Use the app before interviewing. Stack is TS/React/Node-flavored.",
    "sources": [],
    "confidence": "low"
  },
  "Substack": {
    "loop_shape": "Recruiter screen (30-45m) -> EM interview (45m) -> Technical onsite (4-6 hrs, 3-6 interviews). ~26-29 days end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Live coding on practical problems. Recent reports include 'implement a get-set map with timestamps' (TimeMap-style LC), SQL coding challenges. Mostly LeetCode-medium, with practical/data-flavored variants.",
        "example_topics": [
          "TimeMap / get-set with timestamps",
          "SQL queries",
          "string/array DSA"
        ]
      },
      {
        "type": "system_design",
        "notes": "Backend/queue-focused system design (one recent candidate reported 'system design focused on queues'). Email/publishing infra is a natural domain.",
        "example_topics": [
          "queue-based system",
          "scalable email delivery",
          "publishing platform",
          "feed/notification"
        ]
      },
      {
        "type": "frontend",
        "notes": "For full-stack roles: build a chart / small frontend component reported recently. Skip if backend-only.",
        "example_topics": [
          "build a chart",
          "React component"
        ]
      },
      {
        "type": "behavioral",
        "notes": "STAR-format. Substack noted as 'focused on the answer' over thought process - be decisive. 71% report feeling rushed - move efficiently.",
        "example_topics": [
          "challenge handled",
          "feedback received",
          "collaboration"
        ]
      }
    ],
    "role_notes": "Backend track: lean into queue/email/feed system design. SQL is real here - brush up. Substack tends to value crisp answers over verbose reasoning. Negative experience reports suggest aggressive pacing - rehearse to be terse.",
    "sources": [
      "https://4dayweek.io/interview-process/substack-interview",
      "https://www.glassdoor.com/Interview/Substack-Software-Engineer-Interview-Questions-EI_IE3403284.0,8_KO9,26.htm"
    ],
    "confidence": "med"
  },
  "Reddit": {
    "loop_shape": "Phone screen (recruiter) -> Technical phone screen (60m DSA) -> Hiring manager round -> Onsite: backend coding + system design + behavioral + (sometimes) manager round",
    "rounds": [
      {
        "type": "coding",
        "notes": "Technical phone screen + onsite coding. LeetCode medium typical, occasional hard. Reported problems: add two numbers as strings, word break, merge intervals. Languages favored: Go, Python, Java, C++ (also Rust).",
        "example_topics": [
          "add two numbers as strings",
          "word break / dictionary segmentation",
          "merge intervals",
          "graph/tree traversal"
        ]
      },
      {
        "type": "system_design",
        "notes": "Design feature/scale a system. Reddit domain: feed ranking, comment trees, voting, news feed. Discuss Kafka, sharding, caching, hot-key problems.",
        "example_topics": [
          "design Reddit feed",
          "design comment thread store",
          "vote counting at scale",
          "rate limiter",
          "hot post detection"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Final-round behavioral on collab, ownership, culture fit. Some roles also include a separate manager round for team/culture fit.",
        "example_topics": [
          "disagreement with peer",
          "impactful project",
          "why Reddit"
        ]
      }
    ],
    "role_notes": "FAANG-tier rigor. Backend infra-heavy company - Go fluency is a plus (not required). System design domain mapping: feed/ranking/comments/voting all touch Amazon-scale distributed systems patterns - your SDE2 experience is highly relevant.",
    "sources": [
      "https://prepfully.com/interview-guides/reddit-software-engineer",
      "https://www.interviewquery.com/interview-guides/reddit-software-engineer",
      "https://www.glassdoor.com/Interview/Reddit-Software-Engineer-Interview-Questions-EI_IE796358.0,6_KO7,24.htm"
    ],
    "confidence": "high"
  },
  "Spotify": {
    "loop_shape": "Recruiter (30-45m) -> Tech phone screen (60-75m on Coderpad, or take-home for new grads, or OA) -> Onsite (4 rounds: coding + system design + case study + values/behavioral)",
    "rounds": [
      {
        "type": "coding",
        "notes": "1 hour, medium-to-hard LeetCode. Trees, hashmaps, strings, BFS/DFS, MapReduce concepts. One reported easy-tier: 'print all 8-digit palindromes without string manipulation'.",
        "example_topics": [
          "binary trees",
          "hash maps",
          "BFS/DFS",
          "string manipulation",
          "palindromes"
        ]
      },
      {
        "type": "system_design",
        "notes": "1 hour, 'Design X' format with scalability follow-ups. Spotify-flavored: shuffle algorithm, real-time notifications, podcast search, recommendation feed.",
        "example_topics": [
          "design shuffle",
          "podcast search",
          "real-time notifications",
          "music recommendation backend"
        ]
      },
      {
        "type": "debugging",
        "notes": "Case Study Round - Spotify's signature round. Open-ended real-world production scenario (e.g., feature failing for subset of users). May include system diagrams, code snippets, simulated terminals. Triage approach, metrics to check, stakeholder comms. Dialogue-heavy - ask lots of clarifying questions.",
        "example_topics": [
          "debug failing feature",
          "triage production incident",
          "metric investigation",
          "user-segment outage"
        ]
      },
      {
        "type": "behavioral",
        "notes": "1 hour values/behavioral round. Hiring manager has final say; no fixed numerical bar.",
        "example_topics": [
          "values fit",
          "collaboration",
          "impact stories"
        ]
      }
    ],
    "role_notes": "FAANG-tier. The case study is uniquely valuable to prep - it rewards your on-call/oncall debugging instincts from Amazon. Practice describing a real prod incident end-to-end (triage -> metrics -> mitigation -> postmortem). Spotify moves slowly between rounds - expect 4-5 week timelines.",
    "sources": [
      "https://interviewing.io/spotify-interview-questions",
      "https://www.interviewcoder.co/blog/spotify-software-engineer-interview",
      "https://prepfully.com/interview-guides/spotify-software-engineer",
      "https://www.geeksforgeeks.org/spotify-interview-experience-for-backend-engineer-ii/"
    ],
    "confidence": "high"
  },
  "Patreon": {
    "loop_shape": "Recruiter call (20m + 2 HackerRank Qs) -> Phone interview (50m CS fundamentals, 2-3 problems) -> Coding challenge (1hr live video) -> Onsite panel (2 coding + 1 behavioral). Backend phone screens noted as 1.5hr (longer than usual).",
    "rounds": [
      {
        "type": "coding",
        "notes": "Multi-round coding. Recruiter call includes 2 HackerRank Qs. Phone screen is CS fundamentals, non-LeetCode-style medium. Backend phone screens specifically 1.5hr. Problems: reverse linked list, two-sum, balanced BST check, merge intervals.",
        "example_topics": [
          "arrays / linked lists",
          "binary trees",
          "strings",
          "merge intervals",
          "balanced BST"
        ]
      },
      {
        "type": "api_design",
        "notes": "Reported in 2025 phone screens: 'OOP, basic methods, and common API design'. Likely OOP-flavored design exercise (design a class/API) rather than full distributed design.",
        "example_topics": [
          "OOP design",
          "REST API design",
          "schema design (e.g., messaging app DB)"
        ]
      },
      {
        "type": "system_design",
        "notes": "For experienced/senior candidates. Topics: social platform for millions of users, payment/transaction processing, ride-sharing, TinyURL.",
        "example_topics": [
          "social platform at scale",
          "payment/transactions",
          "TinyURL",
          "subscription/recurring billing (Patreon-native)"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Panel includes behavioral. Difficult problems solved, feedback received, working with challenging teammates.",
        "example_topics": [
          "mission alignment (creator economy)",
          "tough technical decision",
          "feedback story"
        ]
      }
    ],
    "role_notes": "Stack: Python, Java, MySQL backend. Subscription/billing infra is the product - lean into payments/billing system design. Difficulty rated 2.9/5, 28% positive experiences - process can feel uneven. Backend phone is longer (1.5hr) so pace yourself.",
    "sources": [
      "https://prepfully.com/interview-guides/patreon-software-engineer",
      "https://www.interviewquery.com/interview-guides/patreon-software-engineer",
      "https://www.glassdoor.com/Interview/Patreon-Software-Engineer-Interview-Questions-EI_IE915057.0,7_KO8,25.htm"
    ],
    "confidence": "med"
  },
  "Slate": {
    "loop_shape": "Role-pattern (no recent SWE-specific public data): Recruiter screen -> Tech screen (likely live coding or take-home) -> 2-3 onsite/virtual rounds. ~15-30 days end-to-end. Glassdoor difficulty 2.14/5.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Role-pattern: small digital media company, light technical rigor. Expect 1 coding round - LeetCode easy/medium or practical web task. Stack likely PHP/JS or Python.",
        "example_topics": [
          "practical web tasks",
          "string/array DSA",
          "CMS-flavored CRUD"
        ]
      },
      {
        "type": "system_design",
        "notes": "Role-pattern: lightweight architecture chat, not a formal whiteboard. Discuss past systems.",
        "example_topics": [
          "past project deep dive",
          "content delivery / CMS"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Described as 'easy', 'friendly', 'conversational'. Tech stack alignment, prior experience, qualifications, interpersonal.",
        "example_topics": [
          "why Slate",
          "past work deep dive",
          "culture fit"
        ]
      }
    ],
    "role_notes": "Very sparse engineering-specific data. Treat as a low-rigor, conversational media-company loop. Difficulty 2.14/5. Your Amazon background is overqualified - lean into culture/mission fit and product passion.",
    "sources": [
      "https://www.glassdoor.com/Interview/Slate-Magazine-Interview-Questions-E27225.htm",
      "https://www.linkedin.com/jobs/view/software-engineer-at-slate-magazine-4371658567"
    ],
    "confidence": "low"
  },
  "The Walt Disney Company": {
    "loop_shape": "Recruiter screen -> Technical screen(s) (live coding or take-home) -> Onsite loop (~3 back-to-back 60m rounds: system design, coding + service deep-dive, behavioral/hiring manager). ~4 weeks end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "notes": "DSA: arrays, strings, trees, graphs, hashing, sorting, DP, complexity. Streaming-org roles weight C/C++/Rust heavily; other Disney orgs use Java/Python/JS. Onsite coding often paired with service deep-dive.",
        "example_topics": [
          "arrays/strings",
          "trees/graphs",
          "DP",
          "rotate matrix 90 degrees",
          "reverse linked list"
        ]
      },
      {
        "type": "system_design",
        "notes": "60m with principal engineer common. Streaming-flavored: discuss manifest behavior, segment timing, latency math, startup time p50/p95, rebuffer rate. Caching, CDN, traffic spikes (live events).",
        "example_topics": [
          "design Disney+ streaming backend",
          "video segment delivery / CDN",
          "live event scaling",
          "DRM/playback session",
          "multithreading challenges"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Hiring manager round. Ownership, disagreements, cross-functional collab, 'guest-centric' framing. Storytelling matters.",
        "example_topics": [
          "end-to-end project ownership",
          "cross-team conflict",
          "guest/customer impact story"
        ]
      },
      {
        "type": "take_home",
        "notes": "Sometimes used in early screen (varies by org - Disney Streaming, Disney Experiences, ESPN, Hulu all have separate loops).",
        "example_topics": [
          "small service / API",
          "streaming-adjacent task"
        ]
      }
    ],
    "role_notes": "Disney is a federation of orgs (Streaming, Experiences, ESPN, Hulu, Studios). Streaming/Disney+ is the closest match to your Amazon backend background and is the most rigorous. Talk in measurable SLOs and platform constraints, not buzzwords. Multiple separate interview guides exist per org.",
    "sources": [
      "https://www.interviewcoder.co/blog/disney-software-engineer-interview",
      "https://www.glassdoor.com/Interview/Walt-Disney-Company-Software-Engineer-Interview-Questions-EI_IE717.0,19_KO20,37.htm",
      "https://www.jointaro.com/interviews/companies/disney/experiences/lead-software-engineer-new-york-new-york-november-18-2025-declined-offer-positive-cccecfb2/"
    ],
    "confidence": "high"
  },
  "Comcast (NBCUniversal)": {
    "loop_shape": "Recruiter phone screen (30-45m) -> Technical video interview (~45m) -> Onsite: architectural interview + coding interview + (sometimes) behavioral. ~35 days end-to-end. Difficulty 2.6/5 - milder than FAANG.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Standard DSA via video. Problem-solving fundamentals, communication, clean implementation prioritized. Languages: Java, Python, JS. LeetCode easy/medium typical.",
        "example_topics": [
          "arrays/strings",
          "hash maps",
          "trees",
          "RESTful API implementation"
        ]
      },
      {
        "type": "system_design",
        "notes": "'Architectural interview' is a distinct round. Cloud (AWS/Azure/GCP) familiarity expected. Media/streaming domain depending on team (NBC Sports, Peacock).",
        "example_topics": [
          "REST API design",
          "cloud-native service",
          "video streaming pipeline (Peacock/NBC)"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Culture fit, motivations, collaboration. Generally relaxed (65% positive).",
        "example_topics": [
          "why NBCUniversal/Comcast",
          "team collab",
          "past project"
        ]
      }
    ],
    "role_notes": "Lower rigor than FAANG. Org sprawl is significant (Comcast cable, Xfinity, Peacock, NBC Sports, Sky). Peacock/streaming roles closest to your backend background. Architectural round is the key differentiator vs. pure coding - prep cloud-native + streaming patterns.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/nbcuniversal-software-engineer",
      "https://www.glassdoor.com/Interview/NBCUniversal-Software-Engineer-Interview-Questions-EI_IE32038.0,12_KO13,30.htm",
      "https://interviewkickstart.com/blogs/interview-questions/comcast-interview-questions"
    ],
    "confidence": "med"
  },
  "Whatnot": {
    "loop_shape": "Recruiter screen -> Karat third-party screen (15m project chat + 45m coding, scripted) -> Virtual onsite: 3-4 rounds (live coding, system design, product sense, behavioral). ~35 days end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Karat + onsite live coding. LeetCode Medium-to-Hard. Hashmaps, arrays, strings, parsing, validation, graph traversal. Production-ready code under time pressure. Concise project explanation - leave time for code. Communicate when stuck.",
        "example_topics": [
          "hashmap-heavy problems",
          "parsing/validation",
          "graph traversal",
          "string manipulation"
        ]
      },
      {
        "type": "system_design",
        "notes": "Real-time / high-concurrency focus - matches their live-streaming auction product. SQL vs NoSQL trade-offs. Topics: live comments, bids, video streams, leaderboards.",
        "example_topics": [
          "live auction leaderboard",
          "real-time notifications",
          "live comments/chat",
          "Spotify music uploader",
          "bid system"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Non-coding 'Product Sense' round + a separate behavioral round. Product sense: user empathy, prioritization, success metrics. Behavioral: Low Ego, Impact Driven principles. Use the app before interviewing.",
        "example_topics": [
          "why Whatnot / product critique",
          "feature prioritization",
          "success metrics",
          "low-ego conflict story"
        ]
      }
    ],
    "role_notes": "Stack: Python (primary), Elixir (high-concurrency live systems), Go, Java/C++. Frontend: React/TS/Next.js. Infra: Kafka, Celery, Redis, Postgres, DynamoDB. The Product Sense round is unusual for SWE - prep by actually using Whatnot and forming opinions. Difficulty 3.2/5, 64% positive.",
    "sources": [
      "https://dataford.io/interview-guides/whatnot/software-engineer",
      "https://www.glassdoor.com/Interview/Whatnot-Software-Engineer-Interview-Questions-EI_IE5065998.0,7_KO8,25.htm",
      "https://www.jointaro.com/interviews/companies/whatnot/experiences/software-engineer-united-states-july-1-2025-accepted-offer-positive-119ad58e/"
    ],
    "confidence": "high"
  },
  "ResortPass": {
    "loop_shape": "Limited public data: Recruiter -> Tech coding round -> Full-stack engineering deep-dive (code review/feedback) -> Product sense + behavioral. ~3-4 rounds total.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Verified for Senior Frontend role: LeetCode-style problem (e.g., Decode String - '3[a2[c]]' -> 'accaccacc', classic stack problem). For backend, expect similar stack/string/parsing flavor.",
        "example_topics": [
          "Decode String (LC 394)",
          "stack-based parsing",
          "string manipulation"
        ]
      },
      {
        "type": "coding",
        "notes": "Code review / deep-dive: interviewer shows code snippets (React for frontend; likely Node/Rails/Python for backend) and asks for feedback. Tests code reading + judgment.",
        "example_topics": [
          "code review",
          "spot bugs / anti-patterns",
          "refactor discussion"
        ]
      },
      {
        "type": "system_design",
        "notes": "Role-pattern: marketplace product. Likely lightweight design conversation. Booking/inventory/availability is the obvious domain.",
        "example_topics": [
          "booking/reservation system",
          "availability calendar",
          "two-sided marketplace basics"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Product sense + experience deep dive. Small company - product passion and customer empathy matter.",
        "example_topics": [
          "why ResortPass",
          "product feedback",
          "past project ownership"
        ]
      }
    ],
    "role_notes": "Single confirmed data point (frontend role). Treat backend pattern as inferred. Small marketplace - your SDE2 is overqualified; lead with product passion + customer empathy. Code review round is distinctive - rehearse reading and critiquing code aloud.",
    "sources": [
      "https://discuss.frontendlead.com/t/resortpass-senior-frontend-engineer/3234",
      "https://job-boards.greenhouse.io/resortpass/jobs/5059472007"
    ],
    "confidence": "low"
  },
  "SeatGeek": {
    "loop_shape": "Recruiter screen -> 2 technical rounds -> 2 systems rounds -> Several values-focused interviews. 7+ rounds total at onsite stage. ~14 days end-to-end.",
    "rounds": [
      {
        "type": "coding",
        "notes": "2 technical rounds. Coding questions described as fair, interviewers friendly. iOS-specific phone screen: parse JSON and display it (real project, not pure LC). Backend likely similar practical flavor + DSA.",
        "example_topics": [
          "JSON parsing / API consumption",
          "data structures",
          "practical CRUD",
          "LC medium DSA"
        ]
      },
      {
        "type": "system_design",
        "notes": "2 systems rounds (notable - more than typical). Ticketing domain: event/inventory, pricing, search, payment.",
        "example_topics": [
          "ticket inventory system",
          "event search/discovery",
          "dynamic pricing",
          "payment + holds/reservations",
          "rate limiting"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Multiple values-focused interviews. Heavy weight on culture fit.",
        "example_topics": [
          "values alignment",
          "collaboration",
          "ownership",
          "why ticketing/SeatGeek"
        ]
      }
    ],
    "role_notes": "Multi-systems-round loop is distinctive - prep two angles (data-heavy + real-time) of design. Difficulty 2.9/5, 47% positive. Process is long (7+ rounds) but fast calendar (14 days avg). Ticketing domain = inventory/reservations/payments - all familiar from Amazon retail/marketplace patterns.",
    "sources": [
      "https://www.glassdoor.com/Interview/SeatGeek-Software-Engineer-Interview-Questions-EI_IE478188.0,8_KO9,26.htm",
      "https://prepfully.com/interview-questions/seatgeek/software-engineer",
      "https://www.teamblind.com/post/senior-ios-interviews-seatgeek-ubsmzvef"
    ],
    "confidence": "med"
  },
  "Airgoods": {
    "loop_shape": "YC-stage startup pattern: Recruiter/founder screen -> Tech screen (live coding or take-home) -> Onsite (~3 rounds: coding, system design, behavioral). In-person NYC. Founder/CTO involvement likely.",
    "rounds": [
      {
        "type": "coding",
        "notes": "YC startup pattern: practical live coding. LeetCode easy/medium or feature build. JD lists 'standard tech interviews including coding, system design, and behavioral'.",
        "example_topics": [
          "practical CRUD/feature",
          "string/array DSA",
          "API integration"
        ]
      },
      {
        "type": "take_home",
        "notes": "Role-pattern: small YC company often uses take-home for full-stack. Build a marketplace feature (order, inventory, etc).",
        "example_topics": [
          "mini marketplace feature",
          "order/inventory CRUD"
        ]
      },
      {
        "type": "system_design",
        "notes": "Wholesale marketplace domain. Inventory, ordering, supplier integration, search.",
        "example_topics": [
          "inventory/catalog system",
          "order pipeline",
          "two-sided marketplace",
          "supplier integrations"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Scrappy/customer-focused/in-person culture per JD. Founder fit matters.",
        "example_topics": [
          "why Airgoods/wholesale",
          "scrappy ownership story",
          "in-person collaboration"
        ]
      }
    ],
    "role_notes": "$7M YC seed-stage, ~Jan 2023 founded. No specific interview write-ups found. Pattern: in-person NYC, scrappy, customer-obsessed - your Amazon CO ('customer obsession') vocabulary maps directly. Stack inferred (likely TS/Node or Python/Rails + Postgres). Founder fit and willingness-to-build is the bar.",
    "sources": [
      "https://www.ycombinator.com/companies/airgoods/jobs/WOXhe0E-software-engineer-full-stack",
      "https://www.ycombinator.com/companies/airgoods/jobs/V9HCGgs-software-engineer-platform"
    ],
    "confidence": "low"
  },
  "Etsy": {
    "loop_shape": "Recruiter screen -> Tech phone screen -> Onsite loop (4-5 hrs, 4-5 rounds): coding, system design, pair programming, debugging, behavioral.",
    "rounds": [
      {
        "type": "coding",
        "notes": "Hands-on DSA on shared platform. Algorithms and data structures.",
        "example_topics": [
          "arrays/strings",
          "hash maps",
          "priority queues",
          "linked lists",
          "trees"
        ]
      },
      {
        "type": "debugging",
        "notes": "Distinctive Etsy round. Recent (Dec 2024) candidate report: given a Flask project, asked to resolve bugs in the code. Tests code-reading + practical debugging.",
        "example_topics": [
          "debug a Flask app",
          "bug-fix on existing codebase",
          "data structure fixes"
        ]
      },
      {
        "type": "coding",
        "notes": "Pair programming session - collaborative, often extends a simple problem into a more complex one iteratively.",
        "example_topics": [
          "iterative problem extension",
          "collaborative coding",
          "extend a function with new constraints"
        ]
      },
      {
        "type": "system_design",
        "notes": "Scalable / efficient systems discussion. E-commerce marketplace domain - search, listings, checkout, recommendations.",
        "example_topics": [
          "product search",
          "checkout/payment",
          "listing service",
          "seller dashboard",
          "recommendations"
        ]
      },
      {
        "type": "behavioral",
        "notes": "Past projects, teamwork, conflict, project management.",
        "example_topics": [
          "past project deep dive",
          "conflict resolution",
          "project management"
        ]
      }
    ],
    "role_notes": "Stack: PHP (legacy), Python, JavaScript, Scala. Etsy is famous for engineering blog/code-quality culture. Debug round and pair programming round are the two distinctive elements vs. standard FAANG - rehearse reading unfamiliar code (Flask/Python) and verbalizing while you debug.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/etsy-software-engineer",
      "https://www.glassdoor.com/Interview/Etsy-Software-Engineer-Interview-Questions-EI_IE42751.0,4_KO5,22.htm",
      "https://prepfully.com/interview-questions/etsy/software-engineer?page=2",
      "https://interviewkickstart.com/blogs/interview-questions/full-stack-interview-questions-etsy"
    ],
    "confidence": "high"
  },
  "Talkspace": {
    "loop_shape": "Recruiter screen -> Team lead technical chat -> Take-home (React, ~4hr OR larger 15-20hr exercise, 5 business days) -> Onsite/follow-up technical + behavioral. Heavy take-home weight; less LC-grind heavy.",
    "rounds": [
      {
        "type": "behavioral",
        "notes": "Recruiter 30-min call; candidates self-rank competencies 1-10. Team lead discussion on past projects."
      },
      {
        "type": "take_home",
        "notes": "Examples reported: build tic-tac-toe with suggested-move algorithm; build a web-based drawing app. Larger exercise (15-20hr) due in 5 business days. Frontend (React) leaning even for some backend-adjacent roles."
      },
      {
        "type": "coding",
        "notes": "Live walkthrough of take-home + extension. Standard JS/Python idioms; API/data-modeling questions over LeetCode tricks."
      },
      {
        "type": "system_design",
        "notes": "Light/inconsistent for IC SDE; expect HIPAA-aware questions on patient messaging / video session storage if role is backend-leaning."
      }
    ],
    "role_notes": "Mental-health teletherapy. Stack mix Node/React/Ruby. Take-home is the gating round. As ex-Amazon, the 15-20hr take-home is the main friction point \u2014 scope and deliver cleanly. HIPAA/PHI handling is implicit context.",
    "sources": [
      "https://www.glassdoor.com/Interview/Talkspace-Software-Engineer-Interview-Questions-EI_IE1284778.0,9_KO10,27.htm"
    ],
    "confidence": "low"
  },
  "Headway": {
    "loop_shape": "Recruiter screen -> Karat-administered technical screen (live coding, AI/LLM tool use allowed in some loops) -> Final loop: behavioral + technical depth + system design. ~2-3 weeks end-to-end. Very selective (~20-25% pass).",
    "rounds": [
      {
        "type": "coding",
        "notes": "Karat live coding. Reported topics: scheduling/calendar problems (e.g., 'find appointment that fits in shortest time block', 'find time to schedule an appointment given booked slots'). DS&A flavor: intervals, sorting, hash maps. APIs and data structures emphasized."
      },
      {
        "type": "system_design",
        "notes": "Final-loop component. Expect provider-availability / appointment-booking / insurance-claims pipeline designs. HIPAA-aware data flow."
      },
      {
        "type": "behavioral",
        "notes": "Mission alignment (mental healthcare access), cross-functional collab, ownership."
      },
      {
        "type": "api_design",
        "notes": "'Technical depth' round often centers on API/data-model design for therapist-patient matching or scheduling."
      }
    ],
    "role_notes": "Headway runs an insurance-billing platform for mental-health providers. Backend-heavy stack (Python/TypeScript). Karat screen is the major filter \u2014 interval/scheduling problems recur. As ex-Amazon, system design (provider directory, scheduling, claims) is your edge.",
    "sources": [
      "https://www.jointaro.com/interviews/companies/headway/experiences/software-engineer-united-states-september-24-2025-no-offer-positive-d2ce0ccd/",
      "https://www.jointaro.com/interviews/companies/headway/experiences/software-engineer-new-york-new-york-october-24-2024-no-offer-negative-341cb7e8/",
      "https://www.glassdoor.com/Interview/Headway-NY-Senior-Software-Engineer-Interview-Questions-EI_IE3019578.0,10_KO11,35.htm"
    ],
    "confidence": "med"
  },
  "Oscar Health": {
    "loop_shape": "Recruiter -> Tech phone screen (1-2 LC mediums) -> Onsite/virtual loop: 2 coding + 1 system design + 1 behavioral/experience. Data-engineer variant: 1 behavioral + 2 coding + 1 design.",
    "rounds": [
      {
        "type": "coding",
        "notes": "LeetCode-medium level. Reported: topological sort variant; graph traversal; arrays/strings. Not memorize-and-regurgitate \u2014 they probe reasoning."
      },
      {
        "type": "system_design",
        "notes": "Reported 'complex task scheduler with multi-level branching' \u2014 basically a DAG/job-orchestration system. Healthcare-claims / member-eligibility pipelines also fair game given the insurance domain. HIPAA + PHI handling commonly probed."
      },
      {
        "type": "behavioral",
        "notes": "Project deep-dive across multiple rounds \u2014 interviewers re-ask about projects from different angles."
      }
    ],
    "role_notes": "Health-insurance tech. Backend stack Python/Go + Kubernetes. System-design bar is real \u2014 they ask scheduler/DAG questions which map well to your Amazon experience. Don't skip a topo-sort/graph review.",
    "sources": [
      "https://www.glassdoor.com/Interview/Oscar-Health-Software-Engineer-Interview-Questions-EI_IE812257.0,12_KO13,30.htm",
      "https://www.interviewquery.com/interview-guides/oscar-health-software-engineer",
      "https://www.teamblind.com/post/oscar-health-system-design-interview-tip-zapnsdye"
    ],
    "confidence": "med"
  },
  "Maven Clinic": {
    "loop_shape": "Recruiter screen (30-45 min) -> 2 team-member technical interviews -> Take-home coding assignment -> Final manager interview. ~2 weeks end-to-end.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Reported example: ~3hr build of a small web service with ~3 endpoints for creating + validating scheduled user appointments. Stack hint: Flask + SQLAlchemy + SQLite. CRUD + validation logic + light data modeling."
      },
      {
        "type": "coding",
        "notes": "Live coding in technical interviews. Mix of LC-style + software-design discussion. Python-leaning."
      },
      {
        "type": "system_design",
        "notes": "Microservices architecture, containerization, distributed-systems concepts at senior level. Maternal/family-health domain context \u2014 care-journey orchestration, provider scheduling, eligibility."
      },
      {
        "type": "behavioral",
        "notes": "Mission alignment (women's + family health), cross-functional collab, manager-fit final round."
      }
    ],
    "role_notes": "Women's/family virtual care. Stack Python (Flask/FastAPI) + React + GCP. Take-home is appointments/scheduling-flavored \u2014 same domain as Headway/Talkspace. 5yr backend baseline; you're well-fit.",
    "sources": [
      "https://www.glassdoor.com/Interview/Maven-Clinic-Software-Engineer-Interview-Questions-EI_IE1057076.0,12_KO13,30.htm",
      "https://www.interviewquery.com/interview-guides/mavenclinic-software-engineer",
      "https://www.1point3acres.com/interview/company/mavenclinic"
    ],
    "confidence": "med"
  },
  "Commure": {
    "loop_shape": "Recruiter call -> Phone screen (React + Python topics) -> Technical loop: coding + system design + behavioral. Reports describe it as 'not LC-style \u2014 just query APIs.'",
    "rounds": [
      {
        "type": "api_design",
        "notes": "Heavy emphasis on REST vs GraphQL, RESTful API design, API security/auth. 'Query APIs' style \u2014 practical, not algorithmic puzzles."
      },
      {
        "type": "coding",
        "notes": "Light LC: linked list reversal, binary search, palindrome, basic graph. Python + Flask/Django expected. React state management for full-stack roles."
      },
      {
        "type": "system_design",
        "notes": "URL shortener, microservices for healthcare workflows, monolith-vs-microservices tradeoffs, caching. Healthcare-provider workflow automation context (EHR-adjacent)."
      },
      {
        "type": "behavioral",
        "notes": "Technical challenges, deadline prioritization, cross-functional collab, conflict resolution. Communication clarity weighted heavily."
      }
    ],
    "role_notes": "Healthcare operating system / AI workflow automation. Python/Flask/Django + React + AWS. Lower algorithmic bar than FAANG; higher API + integration bar. EHR/FHIR familiarity is a plus. Bar Raiser-style 'communication > correctness' framing.",
    "sources": [
      "https://dataford.io/interview-guides/commure/software-engineer",
      "https://www.glassdoor.com/Interview/Commure-Software-Engineer-Interview-Questions-EI_IE4174349.0,7_KO8,25.htm",
      "https://www.teamblind.com/company/Commure/posts/commure-interview"
    ],
    "confidence": "low"
  },
  "Ro": {
    "loop_shape": "Recruiter phone screen (~1hr) -> Hiring manager phone screen (~1hr) -> Take-home technical test -> Final onsite/virtual loop. ~9-27 days total.",
    "rounds": [
      {
        "type": "take_home",
        "notes": "Take-home is the main technical filter. Reports indicate backend/full-stack scoped projects (CRUD + light data modeling) \u2014 specifics scarce."
      },
      {
        "type": "coding",
        "notes": "Live walkthrough/extension of the take-home plus moderate-difficulty algorithmic questions. Stack: Python/Node + React + AWS."
      },
      {
        "type": "system_design",
        "notes": "Telehealth-flavored: pharmacy/prescription workflows, patient-intake pipelines, provider scheduling. HIPAA/PHI handling expected as context."
      },
      {
        "type": "behavioral",
        "notes": "Hiring manager call early \u2014 mission alignment (direct-to-consumer healthcare) + project deep-dive."
      }
    ],
    "role_notes": "Direct-to-consumer telehealth + pharmacy fulfillment. Backend stack Python + Node, AWS. Take-home gate. Limited public detail \u2014 treat questions as role-pattern (mid-tier health-tech) rather than verified.",
    "sources": [
      "https://www.interviewquery.com/interview-guides/ro-software-engineer",
      "https://www.glassdoor.com/Interview/Ro-Software-Engineer-Interview-Questions-EI_IE2170136.0,2_KO3,20.htm",
      "https://www.tryexponent.com/companies/ro"
    ],
    "confidence": "low"
  },
  "Dorsia": {
    "loop_shape": "ROLE-PATTERN INFERENCE (sparse public data). Expected: recruiter call -> hiring manager / tech lead chat -> 1-2 coding screens (live or take-home) -> onsite loop with founders/senior eng (system design + behavioral). Series-A/B startup pattern.",
    "rounds": [
      {
        "type": "coding",
        "notes": "INFERRED: practical full-stack problem (TypeScript/Node + React/Next.js) \u2014 likely a small booking/availability service or reservation-pricing snippet. Light-to-moderate algorithmic depth."
      },
      {
        "type": "system_design",
        "notes": "INFERRED: reservation inventory + dynamic-pricing system; member tier / minimum-spend tracking; partner (restaurant) admin tools. Real-time availability + concurrency-safe booking are the natural probes."
      },
      {
        "type": "behavioral",
        "notes": "INFERRED: ownership, founder-level urgency, hospitality-customer empathy. Member-app + partner-app product taste."
      },
      {
        "type": "take_home",
        "notes": "INFERRED (startup norm): small build covering reservation flow or dynamic-pricing calc."
      }
    ],
    "role_notes": "Member-only reservation platform with dynamic supply/demand pricing + minimum spend. ~$50M raised, Miami-based, fast-growing. Public interview data is essentially non-existent (1 Glassdoor entry, non-engineering). Treat as role-pattern only. Stack inference: TS/Node + Next.js + Postgres + Stripe.",
    "sources": [
      "https://job-boards.greenhouse.io/dorsia",
      "https://job-boards.greenhouse.io/dorsia/jobs/5059393007",
      "https://www.glassdoor.com/Interview/Dorsia-Interview-Questions-E1926212.htm"
    ],
    "confidence": "low"
  },
  "Hopper": {
    "loop_shape": "4-stage official: (1) Intro call -> (2) Competency screen (HackerRank / TripleByte / tech screen \u2014 $100 Carrot Cash on completion) -> (3) Interview loop: 3-5 interviewers @ 45-60 min within 10-day window (coding + system design + behavioral) -> (4) Bar Raiser (outside hiring group). ~3% intro-to-hire, ~20% loop-to-hire.",
    "rounds": [
      {
        "type": "coding",
        "notes": "HackerRank-style screen + 2-3 onsite coding rounds. Practical OOP problems emphasized over leetcode tricks. Scala-flavored (or JVM-language) for backend roles."
      },
      {
        "type": "system_design",
        "notes": "Distributed-systems heavy: flight-price prediction, fare-watch pipelines, booking inventory, cache invalidation, event streaming. GCP-context (BigQuery, PubSub, GKE)."
      },
      {
        "type": "behavioral",
        "notes": "15-20 min of behavioral baked into each technical round. First-principles reasoning probed heavily. Bar Raiser is a dedicated cultural/talent-bar round."
      },
      {
        "type": "debugging",
        "notes": "Some loops include a 'practical' round \u2014 debugging or extending an existing codebase snippet (Scala/JVM-flavored)."
      }
    ],
    "role_notes": "Travel/fintech. Backend = Scala on GCP, big data (Spark/BigQuery/PubSub). System design is the differentiator \u2014 high-throughput price-watch + booking-state machines. Bar Raiser is intentionally modeled on Amazon's, so your ex-Amazon background is direct prep. If you don't know Scala, expect to do the coding round in another JVM language or Python with reviewer permission.",
    "sources": [
      "https://hopper.com/interview-guide",
      "https://www.interviewquery.com/interview-guides/hopper-software-engineer",
      "https://www.glassdoor.com/Interview/Hopper-Senior-Software-Engineer-Interview-Questions-EI_IE1291846.0,6_KO7,31.htm"
    ],
    "confidence": "high"
  },
  "Hang": {
    "loop_shape": "ROLE-PATTERN INFERENCE (no public interview data found). Expected: recruiter chat -> tech screen (1 coding) -> small take-home OR pair-programming -> onsite loop (2-3 rounds: coding + system design + behavioral with founders). Small early-stage team.",
    "rounds": [
      {
        "type": "coding",
        "notes": "INFERRED: practical TypeScript/Python problem. Likely a tier/points-calculation or reward-redemption snippet. Light-to-moderate DS&A."
      },
      {
        "type": "system_design",
        "notes": "INFERRED: loyalty-points ledger (idempotency + double-entry), tier-promotion rules engine, NFT/membership issuance + on-chain event ingestion. Webhooks + retries + at-least-once semantics."
      },
      {
        "type": "take_home",
        "notes": "INFERRED (early-stage norm): small loyalty-program prototype \u2014 points accrual + tier logic + a couple of endpoints."
      },
      {
        "type": "behavioral",
        "notes": "INFERRED: founder-led, mission/product-taste questions about brand loyalty + consumer experience. Bias for ownership + scrappiness."
      }
    ],
    "role_notes": "Brand loyalty + memberships platform (NFT-backed earlier, broader loyalty now). Engineering team is small/tight-knit per their own description; team includes ex-Google/Amazon/Apple/Meta/Coinbase, so the bar is high despite startup size. Stack inference: TS/Node + React/Next.js + Postgres + crypto/web3 libs. Zero verified public interview reports \u2014 confidence is very low, treat strictly as pattern.",
    "sources": [
      "https://www.linkedin.com/company/hang-loyalty",
      "https://www.linkedin.com/company/hang-cx",
      "https://www.ziprecruiter.com/c/Hang/Job/Front-End-Software-Engineer-(React-NextJS)/-in-New-York,NY"
    ],
    "confidence": "low"
  }
};

if (typeof window !== 'undefined') window.INTERVIEW_QUESTIONS_2026 = INTERVIEW_QUESTIONS_2026;
if (typeof module !== 'undefined') module.exports = { INTERVIEW_QUESTIONS_2026 };
