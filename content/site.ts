// Real site copy. Source: docs/CONTENT.md, which is checked against docs/RESUME.md.
// Only approved text lives here. Anything still waiting for confirmation in CONTENT.md
// (proof points, Notes, skill tags, the resume PDF)
// is left out until approved. Build and tests fail on markers.
import type { TimelineEntry } from "@/components/timeline";
import type { SkillGroup } from "@/lib/skills";
import type { NavLink } from "@/lib/nav";
import type { EvalRow } from "@/components/eval-table";

export const person = {
  name: "Sanjay Kandimalla",
  eyebrow: "Backend engineer, Dallas area",
  headline: "I build AI agents and retrieval systems for enterprise teams.",
  subline:
    "Backend engineer working with Python, RAG, MCP and the systems around them: APIs, databases and access control.",
  description: "Backend engineer building retrieval systems, AI agents and secure integrations.",
};

// Approved by the owner on 2026-10-09 (docs/CONTENT.md, About).
export const about = [
  "I am a backend engineer with 4+ years of experience, working mostly in Python, and most of my recent work is AI engineering. At American Airlines I own the architecture and delivery of internal AI tooling: RAG pipelines, AI agents and MCP integrations. Before that I worked at American Express on fraud detection and risk scoring services, where I learned what production means with high transaction volumes and real-time scoring.",
  "I care most about problems where getting it wrong has a real cost. Access control that is enforced at the data layer, not only in a prompt. Retrieval that holds up as the document index grows. Evaluation that tells you something is broken before users do.",
  "I have also had a technical conversation with a professional at AWS about MCP security patterns and sub-agent identity.",
  "This site is a small example of the same habits. The chat answers only from my resume and project text. It reads the database through a read-only role, and the server checks that every source it cites is real. I wrote the evals before the chat.",
];

export const links = {
  email: "san.jay.kan.dim.lla@gmail.com",
  linkedin: "https://www.linkedin.com/in/sanjay-kandimalla/",
  github: "https://github.com/codewithsanjay-pixel",
};

export const nav: readonly NavLink[] = [
  { href: "/#focus", label: "Focus" },
  { href: "/#experience", label: "Experience" },
  { href: "/#skills", label: "Skills" },
  { href: "/#projects", label: "Projects" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
  { href: "/how-its-built", label: "How it's built" },
  { href: "/trust", label: "Trust" },
  { href: "/mcp", label: "MCP" },
];

export const focus = [
  {
    title: "Retrieval (RAG)",
    body: "I build retrieval pipelines over internal documents with pgvector and FAISS, and I choose embedding models and chunking strategies to improve search quality. The goal is more relevant retrieval and fewer made-up answers.",
  },
  {
    title: "Agents and tool use",
    body: "I build agents that plan multi-step work and call tools across enterprise systems. I also build the React dashboards people use to monitor and check what the agent did.",
  },
  {
    title: "Secure integrations",
    body: "I connect language models to internal data through MCP servers and REST APIs. I add authentication, rate limiting and access controls to the servers and endpoints that handle sensitive data.",
  },
] as const;

export const timeline: readonly TimelineEntry[] = [
  {
    id: "aa",
    dates: "February 2025 to present",
    title: "Software Development Engineer",
    org: "American Airlines. Dallas, TX (remote).",
    summary: "Backend-focused full stack work on AI tools for operations, customer support and internal automation.",
    groups: [
      {
        label: "AI systems",
        items: [
          "Built Python services with FastAPI and integrated language models (OpenAI, Azure OpenAI) into internal tools to automate business workflows.",
          "Built RAG pipelines over internal knowledge bases with pgvector and FAISS, and evaluated embedding models and chunking strategies to improve search.",
          "Built agents for multi-step workflows: task planning, tool calling and orchestration.",
          "Used ML techniques (feature engineering, model evaluation) in systems that combine traditional ML models with LLM-based reasoning.",
          "Used few-shot prompting, chain-of-thought structuring and system prompt design to make answers more accurate and consistent.",
        ],
      },
      {
        label: "Integrations and security",
        items: [
          "Built MCP servers to standardize secure access to internal data sources, so several AI tools could reuse the same context.",
          "Added authentication, rate limiting and access controls to MCP servers and REST API endpoints that handle sensitive data.",
          "Connected AI services to core enterprise systems through REST APIs.",
        ],
      },
      {
        label: "Data and operations",
        items: [
          "Used PostgreSQL and MongoDB for application context, conversation state and retrieval, and tuned query performance.",
          "Monitored AI applications in production to find latency and accuracy problems in responses and agent workflows.",
          "Built React interfaces and dashboards so business users could monitor and check agent output.",
        ],
      },
      {
        label: "Team and standards",
        items: [
          "Set internal standards for MCP integration patterns and prompt versioning.",
          "Wrote guides for engineers new to RAG and agent development.",
          "Presented designs and trade-offs to engineering leadership and product.",
          "Worked with data science, platform and product teams in Agile/Scrum, with Git and CI/CD.",
        ],
      },
    ],
  },
  {
    id: "ms",
    dates: "January 2024 to December 2025",
    title: "M.S., Applied Statistics and Data Science",
    org: "University of Texas at Arlington.",
    summary: "Full-time study from January 2024. Joined American Airlines in February 2025 while finishing the degree. CGPA 3.9.",
  },
  {
    id: "amex",
    dates: "June 2021 to December 2023",
    title: "Software Engineer",
    org: "American Express. Hyderabad, India.",
    summary: "Backend services and APIs for fraud detection, risk scoring and customer analytics.",
    groups: [
      {
        label: "Services and data",
        items: [
          "Built backend services and REST APIs with Flask and FastAPI.",
          "Modeled and maintained SQL (PostgreSQL, MySQL) and MongoDB data structures.",
          "Built full stack features with React and Python APIs for internal risk and compliance tools.",
        ],
      },
      {
        label: "Machine learning in production",
        items: [
          "Built data pipelines that brought scikit-learn models into backend services for real-time fraud scoring and risk classification.",
          "Worked with data science teams to move models from prototype into production.",
          "Supported early NLP tooling that classified customer support tickets.",
        ],
      },
      {
        label: "Engineering practice",
        items: [
          "Refactored legacy Python services into modular, testable components.",
          "Automated recurring data validation and reporting with Python scripts.",
          "Debugged production incidents with on-call and platform teams.",
          "Documented API contracts with OpenAPI/Swagger and reviewed pull requests.",
          "Followed code review, unit and integration testing, and CI/CD with Git and Jenkins.",
        ],
      },
    ],
  },
];

// Skill names only. "Where used" tags wait for approval in CONTENT.md.
export const skillGroups: readonly SkillGroup[] = [
  { name: "Backend", skills: ["Python", "FastAPI", "Flask", "Django REST Framework", "REST API design and integration", "Microservices", "asyncio"].map((name) => ({ name })) },
  { name: "AI and LLM engineering", skills: ["LLM integration", "RAG", "AI agents", "Agent orchestration", "MCP", "Prompt engineering", "LangChain", "LlamaIndex"].map((name) => ({ name })) },
  { name: "Machine learning", skills: ["scikit-learn", "PyTorch (working knowledge)", "Pandas", "NumPy", "Model evaluation", "Feature engineering", "Statistical modeling"].map((name) => ({ name })) },
  { name: "LLM platforms and APIs", skills: ["OpenAI API", "Azure OpenAI Service", "Anthropic Claude API", "AWS Bedrock"].map((name) => ({ name })) },
  { name: "Vectors and search", skills: ["pgvector", "FAISS", "Pinecone", "Chroma", "Embedding models", "Semantic search"].map((name) => ({ name })) },
  { name: "Frontend", skills: ["React", "Redux", "TypeScript", "JavaScript", "HTML", "CSS"].map((name) => ({ name })) },
  { name: "Databases", skills: ["PostgreSQL", "MySQL", "MongoDB", "DynamoDB", "Redis", "SQL"].map((name) => ({ name })) },
  { name: "Cloud and DevOps", skills: ["AWS (Lambda, EC2, S3, Bedrock)", "Azure", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions"].map((name) => ({ name })) },
  { name: "Practices", skills: ["Git", "GitHub", "Agile/Scrum", "OpenAPI/Swagger", "Postman", "Unit and integration testing", "Code review"].map((name) => ({ name })) },
];

export const eka = {
  slug: "enterprise-knowledge-assistant",
  title: "Enterprise Knowledge Assistant",
  label: "American Airlines. Employer work, described in general terms.",
  cardSummary:
    "One place for employees to ask about internal documentation, policies and system data: retrieval with pgvector, an agent layer for follow-up actions, and a custom MCP server.",
  problem: "Employees needed one place to ask questions about internal documentation, policies and system data.",
  parts: [
    { label: "Retrieval", value: "A retrieval pipeline over internal documents using pgvector." },
    {
      label: "Agent layer",
      value: "An agent that could take follow-up actions, such as opening tickets and pulling live data, through tool calling.",
    },
    {
      label: "MCP server",
      value: "A custom MCP server that exposed internal APIs and databases as standard, secure context sources, so other internal AI tools could reuse them.",
    },
    { label: "Frontend", value: "A React frontend for employees and admin monitoring." },
  ],
  owned: "Architecture and implementation, a FastAPI backend and a React frontend for employees and admin monitoring.",
  quality: "I used prompt engineering and evaluation methods to reduce irrelevant or incorrect answers.",
  stack: ["Python", "FastAPI", "React", "PostgreSQL with pgvector", "MCP"],
  leavesOut: "This was employer work, so internal names, data, screenshots and numbers stay private.",
};

export const roleProjects = [
  {
    title: "AI tools for enterprise operations",
    meta: "American Airlines. February 2025 to present.",
    summary:
      "Built Python services and AI features for operations, customer support and internal automation; RAG pipelines over internal knowledge bases; agents that automate multi-step workflows; MCP servers for secure access to internal data; React dashboards to monitor and check agent output. Also set internal standards for MCP integration patterns and prompt versioning.",
    href: "/#aa",
  },
  {
    title: "Fraud and risk backend services",
    meta: "American Express. June 2021 to December 2023.",
    summary:
      "Built backend services and APIs for fraud detection, risk scoring and analytics; connected machine learning models to real-time scoring; worked with data science teams to move models from prototype to production.",
    href: "/#amex",
  },
] as const;

export const chat = {
  title: "Ask about my work",
  hint: "Answers come only from my resume and project text, with sources shown.",
  logLabel: "Conversation",
  startersLabel: "Try one:",
  inputLabel: "Your question",
  placeholder: "Ask a question about my work",
  ask: "Ask",
  pending: "Looking through my resume...",
  sourcesLabel: "Sources:",
  fallbackError: "Something went wrong. Please try again later.",
  // The only messages the route sends (app/api/chat/route.ts, docs/CONTENT.md).
  errors: [
    "Please send a question of up to 500 characters.",
    "Too many questions. Please try again later.",
    "The assistant is not available right now. Please try again later.",
    "Something went wrong. Please try again later.",
  ],
  // The route returns this exact text for every refusal (lib/chat/types.ts REFUSAL_MESSAGE).
  refusal: "I can only answer questions about my work. Try asking about my projects, skills or background.",
  starters: [
    "What have you built with RAG?",
    "How have you secured AI integrations?",
    "Where have you used MCP?",
    "What is your background?",
  ],
};

// Written at step 11. Every file listed under a section exists in the repository, and
// the eval table and the dependency statement are checked against the repository by
// tests/how-its-built.test.ts, so this page cannot quietly drift from the code.
export const repoUrl = "https://github.com/codewithsanjay-pixel/portfolio";
export const repoBranch = "main";

export type BuiltSection = {
  title: string;
  paragraphs: string[];
  points?: string[];
  ordered?: boolean;
  after?: string[];
  table?: { caption: string; rows: EvalRow[]; note: string };
  files: string[];
};

export const howItsBuilt: { intro: string; dataNote: string; sections: BuiltSection[] } = {
  intro:
    "This page describes what is actually in this site's code. Each section ends with the files behind it, so you can check what I say.",
  dataNote:
    "When the chat assistant is live, visitor questions and the resume text retrieved to answer them are sent to OpenAI, which creates the search embeddings and writes the answers.",
  sections: [
    {
      title: "What this site is and what it is not",
      paragraphs: [
        "This is my portfolio. It has a home page, a page about the Enterprise Knowledge Assistant, this page, a page on trust and limits, a read-only MCP page, and a chat that answers questions about my work. The chat reads only my resume, including its project descriptions.",
        "It is not a general chatbot. There are no accounts, no comments, no content system and no stored conversations.",
      ],
      files: ["docs/SPEC.md", "docs/RESUME.md", "content/site.ts"],
    },
    {
      title: "Stack",
      paragraphs: [],
      points: [
        "Next.js (App Router) with TypeScript, built to run on Vercel.",
        "Postgres with pgvector on Neon, for retrieval.",
        "Upstash Redis, for rate limits.",
        "OpenAI for both the embeddings and the answers. Each sits behind one small file, so a provider can be swapped without touching the rest.",
        "Vitest for tests, plus a separate eval run for the chat.",
        "Few dependencies on purpose. The runtime packages are Next.js, React and Neon's database client.",
      ],
      files: [
        "package.json",
        "lib/embed.ts",
        "lib/llm.ts",
        "lib/db.ts",
        "lib/ratelimit.ts",
        "docs/adr/002-stack.md",
        "docs/adr/007-openai-provider.md",
      ],
    },
    {
      title: "How the chat answers a question",
      paragraphs: [
        "Every question goes through the same steps, in this order. If a step from the input check onward fails, the visitor gets one fixed refusal message and no sources. Rate limits, malformed requests and outages show a short error message instead.",
      ],
      ordered: true,
      points: [
        "Rate limit. A limit per visitor per minute and per day, and a daily limit for the whole site. If the rate-limit service cannot be reached, the chat shows an unavailable message instead of running unchecked.",
        "Input check. One field, up to 500 characters, no hidden characters, and no questions that try to script the answer.",
        "Retrieval. The question is turned into an embedding, and the closest chunks of my resume are read from the database.",
        "Scope check. If even the closest chunk is not similar enough, the question is refused without calling the model.",
        "Answer. The model sees only those chunks, and must return an answer plus the ids of the chunks it used.",
        "Citation check. The server checks that every cited id is real and was one of the retrieved chunks.",
        "Output checks. The answer must not add numbers or capitalized names that the cited text does not contain, must not link anywhere except my own profiles, and must not contain private words.",
      ],
      after: [
        "The visitor gets the answer and the names of the sections it came from, never the raw retrieved text.",
        "Every answer and every refusal also carries a request trace: the result and timing of each step. For an answered question it lists the retrieved section names with similarity scores. A refusal shows which step stopped, with every check after the model counted as one step, and no scores.",
      ],
      files: [
        "app/api/chat/route.ts",
        "lib/chat/answer.ts",
        "lib/chat/prompt.ts",
        "lib/retrieve.ts",
        "lib/ratelimit.ts",
        "docs/adr/008-scope-check-by-retrieval.md",
      ],
    },
    {
      title: "Security choices",
      paragraphs: [],
      points: [
        "Read-only database role. The chat connects as a role that can only read the chunks table, so even a tricked model cannot change or delete anything.",
        "A strict Content-Security-Policy with a new nonce on every request, so only this site's own scripts and styles run. The usual headers are set too: no framing, no content-type guessing, HTTPS only.",
        "Secrets live only in server-side environment variables. The example file lists names only, and the build fails if a secret value shows up in the built output.",
        "Input limits and rate limits on the chat route. Visitor addresses are hashed before they are used as rate-limit keys.",
        "No stored conversations. By default only the event, counts, timing and error reasons are logged, not the question.",
        "The system prompt is not treated as the security boundary. The limits that matter are the corpus, the read-only role, the citation check, the output checks and the rate limits.",
        "A dependency audit runs as part of the full check before each commit.",
      ],
      files: [
        "docs/DB.md",
        "lib/security/csp.mjs",
        "lib/security/headers.mjs",
        "proxy.ts",
        "scripts/check-built-output.mjs",
        "scripts/check-csp.mjs",
        ".env.example",
        "lib/chat/log.ts",
        "docs/adr/009-csp-per-request-nonces.md",
      ],
    },
    {
      title: "Evals",
      paragraphs: [
        "I wrote the eval sets before the chat. The eval command runs every case against the real chat and fails on any unsafe result or any answer it should have given but did not.",
      ],
      table: {
        caption: "Chat eval results, last full run on 9 October 2026",
        note: "The sets are small and I wrote them. A pass means the cases I thought of pass, not that nothing can go wrong.",
        rows: [
          { set: "Golden", tests: "Real questions about my resume. Each must be answered, cite the right source and mention the expected term.", cases: 20, passed: 20 },
          { set: "Scope", tests: "Off-topic questions and questions the chat must not answer. All must be refused.", cases: 10, passed: 10 },
          { set: "Injection", tests: "Attempts to print the prompt, change the rules or pull out private details. All must be refused.", cases: 10, passed: 10 },
          { set: "Extra", tests: "Mixed questions, yes or no probes, encoded text, planted false claims and wording checks.", cases: 31, passed: 31 },
        ],
      },
      files: [
        "evals/README.md",
        "evals/grade.ts",
        "evals/golden.json",
        "evals/scope.json",
        "evals/injection.json",
        "evals/extra.json",
        "docs/adr/006-eval-sets.md",
      ],
    },
    {
      title: "How I used Claude Code",
      paragraphs: [],
      points: [
        "Claude Code wrote most of the code and the tests.",
        "I set the rules and the spec, supplied and approved every fact about me, and decided what stays private.",
        "Changes to the locked spec were proposed first and recorded as decisions after I approved them.",
        "Each change had to pass lint, type checks, tests, the build, the security header check and a dependency audit before it was committed.",
        "Two review helpers, one for facts and one for security, were run before each phase was closed, and their findings were fixed.",
        "I checked the pages and the chat by hand in a browser.",
      ],
      files: [
        "CLAUDE.md",
        "docs/SPEC.md",
        ".claude/agents/consistency-auditor.md",
        ".claude/agents/security-reviewer.md",
        "docs/adr/000-pre-scaffold-commits.md",
      ],
    },
    {
      title: "What is simple on purpose",
      paragraphs: [],
      points: [
        "No accounts, comments or content system, so there is little to attack.",
        "One language-model provider and one embedding provider, each behind one small file.",
        "No separate vector database. pgvector lives in the same Postgres as everything else.",
        "Expand and collapse use the browser's own details element. The skills filter is a small script, and the page still works without it.",
        "No animation libraries, carousels or tabs.",
      ],
      files: ["docs/SPEC.md", "docs/adr/002-stack.md", "package.json", "components/skills-explorer.tsx"],
    },
    {
      title: "Known limits",
      paragraphs: [],
      points: [
        "A language model can still get things wrong. The checks catch invented sources, numbers, capitalized names and links, but they cannot prove that every sentence is a fair summary of its source.",
        "Model answers are not perfectly repeatable. One golden question was wrongly refused in one run and passed on the rerun.",
        "The scope check compares meaning, so an off-topic question that happens to sit close to my resume text can still reach the model. The model's own refusal and the output checks handle those.",
        "Rate limits can turn away a real visitor who asks many questions.",
        "The chat depends on three outside services: OpenAI, Neon and Upstash. If one is down, it shows an error message instead of answering.",
        "There are no automated browser tests. I checked the pages and the chat by hand.",
        "The chat answers about my work only. It does not know how this site is built. This page is for that.",
      ],
      files: ["docs/adr/008-scope-check-by-retrieval.md", "lib/chat/answer.ts", "evals/README.md"],
    },
  ],
};

export const footer = "Sanjay Kandimalla.";

export const notFound = {
  title: "Page not found",
  body: "There is no page at this address.",
  home: "Back to home",
};

// Page /trust (ADR 014). Copy is in docs/CONTENT.md. Numbers in {braces} are filled in
// from the eval table above and the repository when the page renders, never typed here.
export const trustPage = {
  title: "Trust and limits",
  intro:
    "This page says what the chat assistant is, what keeps it inside that, and what it does not do. Each control points to the file that enforces it, so you can check it.",
  whatTitle: "What the assistant is",
  what: [
    "Read-only. It reads my resume text and returns an answer. Nothing it does changes that text, and it has no tools that act.",
    "Stateless. Each question is handled on its own. The page sends only the question, and the server keeps no conversation.",
    "One model call per question, after a search of my resume. There is no loop, no planning and no second agent.",
    "No memory, by design. It cannot recall an earlier question, and nothing a visitor says changes what it knows.",
    "Resume only. It answers from my resume and project text, names the sections it used, and gives one fixed refusal for everything else.",
  ],
  controlsTitle: "What enforces that, and where",
  controlsIntro:
    "A prompt can be talked around, so these limits are in code, in the database and in the build. Each file name opens the code on GitHub.",
  controlsColumns: { control: "Control", does: "What it does", where: "Where it lives" },
  controls: [
    {
      control: "Read-only database role",
      does: "The chat connects as a database role that can only read the chunks table, so even a tricked model cannot change or delete anything.",
      files: ["docs/DB.md", "lib/db.ts"],
    },
    {
      control: "Corpus allow-list",
      does: "Only my resume file can be loaded into the corpus. A retrieved row is dropped unless its id and content hash match the current resume text.",
      files: ["lib/corpus/sources.ts", "lib/retrieve.ts"],
    },
    {
      control: "Server-side citation check",
      does: "The server checks that every source the model cites was one of the passages retrieved for this question. If not, the answer is replaced by the refusal.",
      files: ["lib/chat/answer.ts"],
    },
    {
      control: "Output guards",
      does: "An answer is blocked if it links anywhere except my own profiles, contains private words, or adds numbers or capitalized names that the cited text does not contain.",
      files: ["lib/chat/answer.ts", "lib/chat/handler.ts", "lib/safety/forbidden.mjs"],
    },
    {
      control: "Rate limits",
      does: "A limit per visitor per minute and per day, and a daily limit for the whole site. If the limiter cannot be reached, the chat does not run.",
      files: ["lib/ratelimit.ts", "app/api/chat/route.ts"],
    },
    {
      control: "Content-Security-Policy nonce",
      does: "Every page request gets a new nonce and a policy that does not allow inline scripts without it.",
      files: ["proxy.ts", "lib/security/csp.mjs"],
    },
    {
      control: "Build-time secret scan",
      does: "After each build, the output is searched for the values of the server-side secrets and for wording that must not ship. The build fails if any is found.",
      files: ["scripts/check-built-output.mjs"],
    },
  ],
  notTitle: "What it does not do",
  not: [
    "It does not write. The database role it uses can only read. Per request, the site writes only rate-limit counters keyed by a hash of the visitor's address, and a log line with the event, counts and timing.",
    "It has no tools that act. The model returns text and a list of source ids. It cannot browse, run code or send anything.",
    "It has no memory. The app does not store questions, so earlier ones cannot affect later answers. By default the server logs no question text.",
    "It does not use several agents or hand work between models.",
    "This page lists no planned features. It describes only what is in the code now.",
  ],
  evalsTitle: "What the evals cover",
  evalsSummary: "{caption}: {passed} of {total} cases passed, in {sets} sets.",
  evalsSet: "{set}, {cases} cases. {tests}",
  evalsMore: "The full table and the files behind it are on the How it's built page. The injection set is the one you can try below.",
  breakIt: {
    title: "Try to break it",
    intro:
      "These are the questions from the public injection eval set. Each one tries to make the chat reveal its instructions, change its rules or show text it should not. The eval expects every one to be refused. Click a question to send it to the live chat and see what happens.",
    limitNote:
      "These questions use the same limits as the chat: a small number per minute and per day for each visitor, and a daily limit for the whole site. Running them uses up your share. If a limit is reached you will see an error message instead of a result.",
    hiddenNote:
      "Showing {shown} of the {total} questions in the public injection set. The rest use wording this site never prints. The eval run still includes them.",
    storeNote: "This panel stores nothing. It sends only the question text, one at a time.",
    listLabel: "Injection questions",
    expectedLabel: "Expected",
    expected: { refuse: "refuse", answer: "answer" },
    actualLabel: "Actual",
    actual: { refused: "refused", answered: "answered", error: "no result" },
    matches: "Matches the eval.",
    differs: "Does not match the eval.",
    send: "Send",
    sending: "Sending...",
  },
};

// The hero strip. Values are computed when the page renders (app/(site)/page.tsx).
export const proofStrip = {
  label: "Checkable facts about this site",
  evals: "eval cases across four public sets",
  deps: "runtime dependencies, kept small so there is less to audit",
  secrets: "Build fails if a secret reaches the browser",
  secretsLabel: "Checked on every build",
};
