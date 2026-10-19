# Draft site copy

Rules: every sentence must be supported by docs/RESUME.md. [CONFIRM] means I must confirm it first. Do not add numbers I have not approved. Plain words, no hype.

Page structure follows docs/adr/004-expanded-site-structure.md (proposed). Sections below are in page order.

## Page metadata
Title: Sanjay Kandimalla
Description: Backend engineer building retrieval systems, AI agents and secure integrations.

## Home
Eyebrow: Backend engineer, Dallas area
Headline: I build AI agents and retrieval systems for enterprise teams.
Subline: Backend engineer working with Python, RAG, MCP and the systems around them: APIs, databases and access control.
Proof points (resume facts only, no other numbers) [CONFIRM: approve this wording]:
- Building production backend systems since 2021.
- RAG pipelines, AI agents and MCP servers in production.
- M.S. in Applied Statistics and Data Science, UT Arlington (CGPA 3.9).
Links: Resume (PDF), GitHub, LinkedIn.
[CONFIRM: provide the resume PDF. It must match RESUME.md, including "4+ years" and never "5+ years" (decided 2026-10-09).]

Chat panel sits next to the intro (see "Chat assistant" below).

## Focus
1. Retrieval (RAG)
I build retrieval pipelines over internal documents with pgvector and FAISS, and I choose embedding models and chunking strategies to improve search quality. The goal is more relevant retrieval and fewer made-up answers.
2. Agents and tool use
I build agents that plan multi-step work and call tools across enterprise systems. I also build the React dashboards people use to monitor and check what the agent did.
3. Secure integrations
I connect language models to internal data through MCP servers and REST APIs. I add authentication, rate limiting and access controls to the servers and endpoints that handle sensitive data.

## Experience (timeline, each entry expands)
Newest first. Collapsed view shows title, employer, place and dates plus the one-line summary. Expanded view shows the grouped detail. General terms only for both employers.

### Software Development Engineer. American Airlines. Dallas, TX (remote). February 2025 to present.
Summary: Backend-focused full stack work on AI tools for operations, customer support and internal automation.
Detail:
- AI systems
  - Built Python services with FastAPI and integrated language models (OpenAI, Azure OpenAI) into internal tools to automate business workflows.
  - Built RAG pipelines over internal knowledge bases with pgvector and FAISS, and evaluated embedding models and chunking strategies to improve search.
  - Built agents for multi-step workflows: task planning, tool calling and orchestration.
  - Used ML techniques (feature engineering, model evaluation) in systems that combine traditional ML models with LLM-based reasoning.
  - Used few-shot prompting, chain-of-thought structuring and system prompt design to make answers more accurate and consistent.
- Integrations and security
  - Built MCP servers to standardize secure access to internal data sources, so several AI tools could reuse the same context.
  - Added authentication, rate limiting and access controls to MCP servers and REST API endpoints that handle sensitive data.
  - Connected AI services to core enterprise systems through REST APIs.
- Data and operations
  - Used PostgreSQL and MongoDB for application context, conversation state and retrieval, and tuned query performance.
  - Monitored AI applications in production to find latency and accuracy problems in responses and agent workflows.
  - Built React interfaces and dashboards so business users could monitor and check agent output.
- Team and standards
  - Set internal standards for MCP integration patterns and prompt versioning.
  - Wrote guides for engineers new to RAG and agent development.
  - Presented designs and trade-offs to engineering leadership and product.
  - Worked with data science, platform and product teams in Agile/Scrum, with Git and CI/CD.

### M.S., Applied Statistics and Data Science. University of Texas at Arlington. January 2024 to December 2025.
Summary: Full-time study from January 2024. Joined American Airlines in February 2025 while finishing the degree. CGPA 3.9.

### Software Engineer. American Express. Hyderabad, India. June 2021 to December 2023.
Summary: Backend services and APIs for fraud detection, risk scoring and customer analytics.
Detail:
- Services and data
  - Built backend services and REST APIs with Flask and FastAPI.
  - Modeled and maintained SQL (PostgreSQL, MySQL) and MongoDB data structures.
  - Built full stack features with React and Python APIs for internal risk and compliance tools.
- Machine learning in production
  - Built data pipelines that brought scikit-learn models into backend services for real-time fraud scoring and risk classification.
  - Worked with data science teams to move models from prototype into production.
  - Supported early NLP tooling that classified customer support tickets.
- Engineering practice
  - Refactored legacy Python services into modular, testable components.
  - Automated recurring data validation and reporting with Python scripts.
  - Debugged production incidents with on-call and platform teams.
  - Documented API contracts with OpenAPI/Swagger and reviewed pull requests.
  - Followed code review, unit and integration testing, and CI/CD with Git and Jenkins.

## Skills (grouped, filterable)
Filter chips: All, plus one per group. Each skill shows where the resume shows it in use: AA (American Airlines role), Amex (American Express role), EKA (Enterprise Knowledge Assistant). Skills with no tag are listed in the resume's skills section without a matching role bullet; they are shown plainly, not hidden.
[CONFIRM: check the "where used" tags. I derived them from the resume bullets. EKA tags for Python and PostgreSQL are inferred: the project used FastAPI and pgvector, which run on them.]
Group names are lightly shortened from the resume's skills section; the skills themselves are unchanged.
Legend: AA: American Airlines role. Amex: American Express role. EKA: Enterprise Knowledge Assistant. Skills without a tag are listed but not tied to a specific role or project.

- Backend: Python (AA, Amex, EKA), FastAPI (AA, Amex, EKA), Flask (Amex), Django REST Framework, REST API design and integration (AA, Amex), microservices, asyncio
- AI and LLM engineering: LLM integration (AA), RAG (AA, EKA), AI agents (AA, EKA), agent orchestration (AA), MCP (AA, EKA), prompt engineering (AA, EKA), LangChain, LlamaIndex
- Machine learning: scikit-learn (Amex), PyTorch (working knowledge), Pandas, NumPy, model evaluation (AA), feature engineering (AA), statistical modeling
- LLM platforms and APIs: OpenAI API (AA), Azure OpenAI Service (AA), Anthropic Claude API, AWS Bedrock
- Vectors and search: pgvector (AA, EKA), FAISS (AA), Pinecone, Chroma, embedding models (AA), semantic search (AA, EKA)
- Frontend: React (AA, Amex, EKA), Redux, TypeScript, JavaScript, HTML, CSS
- Databases: PostgreSQL (AA, Amex, EKA), MySQL (Amex), MongoDB (AA, Amex), DynamoDB, Redis, SQL (AA, Amex)
- Cloud and DevOps: AWS (Lambda, EC2, S3, Bedrock), Azure, Docker, Kubernetes, CI/CD (AA, Amex), Jenkins (Amex), GitHub Actions
- Practices: Git (AA, Amex), GitHub, Agile/Scrum (AA), OpenAPI/Swagger (Amex), Postman, unit and integration testing (Amex), code review (Amex)

## Projects
Projects page lists three cards. The Enterprise Knowledge Assistant card links to its own page. The two role cards link to their timeline entries.

### Enterprise Knowledge Assistant (own page)
Employer work at American Airlines (confirmed). General terms only: no internal system names, data or numbers. No repo link.
Label (card and page): American Airlines. Employer work, described in general terms.
Card summary: One place for employees to ask about internal documentation, policies and system data: retrieval with pgvector, an agent layer for follow-up actions, and a custom MCP server.
Problem: Employees needed one place to ask questions about internal documentation, policies and system data.
What I built: a retrieval pipeline over internal documents using pgvector, an agent layer that could take follow-up actions such as opening tickets and pulling live data, and a custom MCP server that exposed internal APIs and databases as standard, secure context sources so other internal AI tools could reuse them.
What I owned: architecture and implementation, a FastAPI backend and a React frontend for employees and admin monitoring.
Quality: I used prompt engineering and evaluation methods to reduce irrelevant or incorrect answers.
Stack: Python, FastAPI, React, PostgreSQL with pgvector, MCP.
What this page leaves out: This was employer work, so internal names, data, screenshots and numbers stay private.

Expanded page sections (each one only restates the lines above in more structured form; nothing new is added):
1. The problem
2. How it fits together: four labelled parts, plus a simple diagram of them. The diagram shows component types only, no internal systems.
   - Retrieval: A retrieval pipeline over internal documents using pgvector.
   - Agent layer: An agent that could take follow-up actions, such as opening tickets and pulling live data, through tool calling.
   - MCP server: A custom MCP server that exposed internal APIs and databases as standard, secure context sources, so other internal AI tools could reuse them.
   - Frontend: A React frontend for employees and admin monitoring.
3. What I owned
4. Answer quality
5. Stack
6. What this page leaves out
[CONFIRM: anything more you can say about this project in general terms. Without it, the page stays as short as the text above.]

### AI tools for enterprise operations (American Airlines)
Keep general (confirmed): problem types, my role and technologies only. No system names, data or numbers.
Built Python services and AI features for operations, customer support and internal automation; RAG pipelines over internal knowledge bases; agents that automate multi-step workflows; MCP servers for secure access to internal data; React dashboards to monitor and check agent output.
Also set internal standards for MCP integration patterns and prompt versioning.

### Fraud and risk backend services (American Express)
Keep general (confirmed): problem types, my role and technologies only. No system names, data or numbers.
Built backend services and APIs for fraud detection, risk scoring and analytics; connected machine learning models to real-time scoring; worked with data science teams to move models from prototype to production.

## Notes (how I think)
Short pieces, a few sentences each. These are opinions, so every one needs your approval or rewrite. Each topic comes from work in the resume. None are shown until approved.

### Chunking is a design decision
[CONFIRM: my opinion, approve or rewrite]
When retrieval returns the wrong passages, a better prompt rarely saves the answer. That is why I treat chunking and the choice of embedding model as real design decisions and evaluate them on their own.

### People need to see what an agent did
[CONFIRM: my opinion, approve or rewrite]
An agent that takes actions should leave a record a person can read. That is why I build screens where users can watch and check agent output. Without that, it is hard to trust an agent with real work.

### A prompt change is a behavior change
[CONFIRM: my opinion, approve or rewrite]
Changing a prompt can change behavior as much as changing code. I set standards for prompt versioning for that reason.

### Why I set MCP standards
[CONFIRM: my opinion, approve or rewrite]
When each AI tool writes its own connector to the same data, the connectors drift apart, each with its own access rules. A shared MCP server gives every tool the same context and the same rules.

### AI endpoints still need ordinary API security
[CONFIRM: my opinion, approve or rewrite]
An endpoint that calls a language model is still an endpoint. It needs authentication, rate limits and access control like any other API, and often more, because each call costs money and the input is free text.

## About
Approved by me 2026-10-09. Live on the site.

I am a backend engineer with 4+ years of experience, working mostly in Python, and most of my recent work is AI engineering. At American Airlines I own the architecture and delivery of internal AI tooling: RAG pipelines, AI agents and MCP integrations. Before that I worked at American Express on fraud detection and risk scoring services, where I learned what production means with high transaction volumes and real-time scoring.

I care most about problems where getting it wrong has a real cost. Access control that is enforced at the data layer, not only in a prompt. Retrieval that holds up as the document index grows. Evaluation that tells you something is broken before users do.

This site is a small example of the same habits. The chat answers only from my resume and project text. It reads the database through a read-only role, and the server checks that every source it cites is real. I wrote the evals before the chat.

## Footer
Sanjay Kandimalla.

## Page not found (404)
Title: Page not found
Body: There is no page at this address.
Link: Back to home

## Interface labels (no facts)
Skip to content. Details. Read more. See role details. Back to projects. Back to home. All. Filter skills by group. Theme. Light theme. Dark theme. Switch to light theme. Switch to dark theme.

## Contact
Email: san.jay.kan.dim.lla@gmail.com. LinkedIn: https://www.linkedin.com/in/sanjay-kandimalla/. GitHub: https://github.com/codewithsanjay-pixel.

## Chat assistant: panel text
Title: Ask about my work
Hint: Answers come only from my resume and project text, with sources shown. (Shown since step 8: the chat cites its sources.)
Starter label: Try one:
Conversation area label (for screen readers): Conversation
Input label (for screen readers): Your question
Input placeholder: Ask a question about my work
Send button: Ask
While waiting: Looking through my resume...
Above citations: Sources:
Character count: "{count} of 500"
Network or unexpected error: Something went wrong. Please try again later.

## Chat assistant: starter questions
- What have you built with RAG?
- How have you secured AI integrations?
- Where have you used MCP?
- What is your background?

## Chat assistant: error messages
- Bad input: Please send a question of up to 500 characters.
- Rate limited: Too many questions. Please try again later.
- Service down: The assistant is not available right now. Please try again later.
- Anything else: Something went wrong. Please try again later.

## Chat assistant: citation labels
Each citation shows the last part of its resume heading, cut at the first colon. For example "Retrieval (American Airlines)", "Enterprise Knowledge Assistant", or "Software Development Engineer. American Airlines. Dallas, TX (Remote). February 2025 to present". The text of the cited lines is not shown.

## Chat assistant: refusal message
I can only answer questions about my work. Try asking about my projects, skills or background.
(Changed 2026-10-09: "and this site" dropped, because the chat only knows the resume. At step 11, adding the How it's built text to the chat's sources will be proposed.)

## How it's built (own page, written at step 11)
Approved by me 2026-10-09 (defaults chosen). Numbered sections; each ends with links to the files in the GitHub repo that back it. Only things that exist are described. Section 6 was drafted from what actually happened and approved as written.

Intro: This page describes what is actually in this site's code. Each section ends with the files behind it, so you can check what I say.
Data note (ADR 007): When the chat assistant is live, visitor questions and the resume text retrieved to answer them are sent to OpenAI, which creates the search embeddings and writes the answers.

### 1. What this site is and what it is not
This is my portfolio. It has a home page, a page about the Enterprise Knowledge Assistant, this page, a page on trust and limits, a read-only MCP page, and a chat that answers questions about my work. The chat reads only my resume, including its project descriptions.

It is not a general chatbot. There are no accounts, no comments, no content system and no stored conversations.

Files: docs/SPEC.md, docs/RESUME.md, content/site.ts

### 2. Stack
- Next.js (App Router) with TypeScript, built to run on Vercel.
- Postgres with pgvector on Neon, for retrieval.
- Upstash Redis, for rate limits.
- OpenAI for both the embeddings and the answers. Each sits behind one small file, so a provider can be swapped without touching the rest.
- Vitest for tests, plus a separate eval run for the chat.
- Few dependencies on purpose. The runtime packages are Next.js, React and Neon's database client.

Files: package.json, lib/embed.ts, lib/llm.ts, lib/db.ts, lib/ratelimit.ts, docs/adr/002-stack.md, docs/adr/007-openai-provider.md

### 3. How the chat answers a question
Every question goes through the same steps, in this order. If a step from the input check onward fails, the visitor gets one fixed refusal message and no sources. Rate limits, malformed requests and outages show a short error message instead.

1. Rate limit. A limit per visitor per minute and per day, and a daily limit for the whole site. If the rate-limit service cannot be reached, the chat shows an unavailable message instead of running unchecked.
2. Input check. One field, up to 500 characters, no hidden characters, and no questions that try to script the answer.
3. Retrieval. The question is turned into an embedding, and the closest chunks of my resume are read from the database.
4. Scope check. If even the closest chunk is not similar enough, the question is refused without calling the model.
5. Answer. The model sees only those chunks, and must return an answer plus the ids of the chunks it used.
6. Citation check. The server checks that every cited id is real and was one of the retrieved chunks.
7. Output checks. The answer must not add numbers or capitalized names that the cited text does not contain, must not link anywhere except my own profiles, and must not contain private words.

The visitor gets the answer and the names of the sections it came from, never the raw retrieved text.

Every answer and every refusal also carries a request trace: the result and timing of each step. For an answered question it lists the retrieved section names with similarity scores. A refusal shows which step stopped, with every check after the model counted as one step, and no scores.

Files: app/api/chat/route.ts, lib/chat/answer.ts, lib/chat/prompt.ts, lib/retrieve.ts, lib/ratelimit.ts, docs/adr/008-scope-check-by-retrieval.md

### 4. Security choices
- Read-only database role. The chat connects as a role that can only read the chunks table, so even a tricked model cannot change or delete anything.
- A strict Content-Security-Policy with a new nonce on every request, so only this site's own scripts and styles run. The usual headers are set too: no framing, no content-type guessing, HTTPS only.
- Secrets live only in server-side environment variables. The example file lists names only, and the build fails if a secret value shows up in the built output.
- Input limits and rate limits on the chat route. Visitor addresses are hashed before they are used as rate-limit keys.
- No stored conversations. By default only the event, counts, timing and error reasons are logged, not the question.
- The system prompt is not treated as the security boundary. The limits that matter are the corpus, the read-only role, the citation check, the output checks and the rate limits.
- A dependency audit runs as part of the full check before each commit.

Files: docs/DB.md, lib/security/csp.mjs, lib/security/headers.mjs, proxy.ts, scripts/check-built-output.mjs, scripts/check-csp.mjs, .env.example, lib/chat/log.ts, docs/adr/009-csp-per-request-nonces.md

### 5. Evals
I wrote the eval sets before the chat. The eval command runs every case against the real chat and fails on any unsafe result or any answer it should have given but did not.

Table (Chat eval results, last full run on 19 October 2026):
- Golden: Real questions about my resume. Each must be answered, cite the right source and mention the expected term. 20 of 20.
- Scope: Off-topic questions and questions the chat must not answer. All must be refused. 10 of 10.
- Injection: Attempts to print the prompt, change the rules or pull out private details. All must be refused. 10 of 10.
- Extra: Mixed questions, yes or no probes, encoded text, planted false claims and wording checks. 31 of 31.
The sets are small and I wrote them. A pass means the cases I thought of pass, not that nothing can go wrong.

Files: evals/README.md, evals/grade.ts, evals/golden.json, evals/scope.json, evals/injection.json, evals/extra.json, docs/adr/006-eval-sets.md

### 6. How I used Claude Code
- Claude Code wrote most of the code and the tests.
- I set the rules and the spec, supplied and approved every fact about me, and decided what stays private.
- Changes to the locked spec were proposed first and recorded as decisions after I approved them.
- Each change had to pass lint, type checks, tests, the build, the security header check and a dependency audit before it was committed.
- Two review helpers, one for facts and one for security, were run before each phase was closed, and their findings were fixed.
- I checked the pages and the chat by hand in a browser.

Files: CLAUDE.md, docs/SPEC.md, .claude/agents/consistency-auditor.md, .claude/agents/security-reviewer.md, docs/adr/000-pre-scaffold-commits.md

### 7. What is simple on purpose
- No accounts, comments or content system, so there is little to attack.
- One language-model provider and one embedding provider, each behind one small file.
- No separate vector database. pgvector lives in the same Postgres as everything else.
- Expand and collapse use the browser's own details element. The skills filter is a small script, and the page still works without it.
- No animation libraries, carousels or tabs.

Files: docs/SPEC.md, docs/adr/002-stack.md, package.json, components/skills-explorer.tsx

### 8. Known limits
- A language model can still get things wrong. The checks catch invented sources, numbers, capitalized names and links, but they cannot prove that every sentence is a fair summary of its source.
- Model answers are not perfectly repeatable. One golden question was wrongly refused in one run and passed on the rerun.
- The scope check compares meaning, so an off-topic question that happens to sit close to my resume text can still reach the model. The model's own refusal and the output checks handle those.
- Rate limits can turn away a real visitor who asks many questions.
- The chat depends on three outside services: OpenAI, Neon and Upstash. If one is down, it shows an error message instead of answering.
- There are no automated browser tests. I checked the pages and the chat by hand.
- The chat answers about my work only. It does not know how this site is built. This page is for that.

Files: docs/adr/008-scope-check-by-retrieval.md, lib/chat/answer.ts, evals/README.md

## Navigation (ADR 014)
Header links, in order: Focus, Experience, Skills, Projects, About, Contact, How it's built, Trust, MCP. Trust goes to /trust. MCP goes to /mcp (copy below). Command palette: "Go to How the chat works", "Go to Trust and limits" and "Go to MCP".

## Hero facts strip (ADR 014)
Three small tiles under the GitHub and LinkedIn buttons. The numbers are computed when the page renders: the eval case total from the table on the How it's built page, and the runtime dependency count from package.json. Nothing is typed in.
Group label (for screen readers): Checkable facts about this site
- Tile 1, links to /how-its-built: "{total}", then: eval cases across four public sets
- Tile 2, links to package.json on GitHub: "{count}", then: runtime dependencies, kept small so there is less to audit
- Tile 3, links to scripts/check-built-output.mjs on GitHub: Build fails if a secret reaches the browser, then: Checked on every build

## Trust and limits (own page, /trust, ADR 014)
Every statement is backed by a file in the repository. Numbers in {braces} are computed when the page renders: from the eval table above, and from the public injection eval file. File lists in the controls table are checked by a test (each file exists and is tracked by git).

Title: Trust and limits
Intro: This page says what the chat assistant is, what keeps it inside that, and what it does not do. Each control points to the file that enforces it, so you can check it.

### 1. What the assistant is
- Read-only. It reads my resume text and returns an answer. Nothing it does changes that text, and it has no tools that act.
- Stateless. Each question is handled on its own. The page sends only the question, and the server keeps no conversation.
- One model call per question, after a search of my resume. There is no loop, no planning and no second agent.
- No memory, by design. It cannot recall an earlier question, and nothing a visitor says changes what it knows.
- Resume only. It answers from my resume and project text, names the sections it used, and gives one fixed refusal for everything else.

### 2. What enforces that, and where
Intro: A prompt can be talked around, so these limits are in code, in the database and in the build. Each file name opens the code on GitHub.
Table columns: Control, What it does, Where it lives
- Read-only database role: The chat connects as a database role that can only read the chunks table, so even a tricked model cannot change or delete anything. Files: docs/DB.md, db/schema.sql, lib/db.ts
- Corpus allow-list: Only my resume file can be loaded into the corpus. A retrieved row is dropped unless its id and content hash match the current resume text. Files: lib/corpus/sources.ts, lib/retrieve.ts
- Server-side citation check: The server checks that every source the model cites was one of the passages retrieved for this question. If not, the answer is replaced by the refusal. Files: lib/chat/answer.ts
- Output guards: An answer is blocked if it links anywhere except my own profiles, contains private words, or adds numbers or capitalized names that the cited text does not contain. Files: lib/chat/answer.ts, lib/safety/forbidden.mjs
- Rate limits: A limit per visitor per minute and per day, and a daily limit for the whole site. If the limiter cannot be reached, the chat does not run. Files: lib/ratelimit.ts, app/api/chat/route.ts
- Content-Security-Policy nonce: Every page request gets a new nonce and a policy that does not allow inline scripts without it. Files: proxy.ts, lib/security/csp.mjs
- Build-time secret scan: After each build, the output is searched for the values of the server-side secrets and for wording that must not ship. The build fails if any is found. Files: scripts/check-built-output.mjs

### 3. What it does not do
- It does not write. The database role it uses can only read. Per request, the site writes only rate-limit counters keyed by a hash of the visitor's address, and a log line with the event, counts and timing.
- It has no tools that act. The model returns text and a list of source ids. It cannot browse, run code or send anything.
- It has no memory. The app does not store questions, so earlier ones cannot affect later answers. By default the server logs no question text.
- It does not use several agents or hand work between models.
- This page lists no planned features. It describes only what is in the code now.

### 4. What the evals cover
Counts come from the table on the How it's built page, never typed here.
Summary: {caption}: {passed} of {total} cases passed, in {sets} sets.
Each set: {set}, {cases} cases. {tests}
Closing note (the sentence in the table note on How it's built is repeated here): The sets are small and I wrote them. A pass means the cases I thought of pass, not that nothing can go wrong.
Link line: The full table and the files behind it are on the How it's built page. The injection set is the one you can try below.

### 5. Try to break it
Title: Try to break it
Intro: These are the questions from the public injection eval set. Each one tries to make the chat reveal its instructions, change its rules or show text it should not. The eval expects every one to be refused. Click a question to send it to the live chat and see what happens.
Limit note: These questions use the same limits as the chat: a small number per minute and per day for each visitor, and a daily limit for the whole site. Running them uses up your share. If a limit is reached you will see an error message instead of a result.
Left-out note (only if a question is left out): Showing {shown} of the {total} questions in the public injection set. The rest use wording this site never prints. The eval run still includes them.
Store note: This panel stores nothing. It sends only the question text, one at a time.
Labels: Injection questions. Expected. refuse. answer. Actual. refused. answered. no result. Matches the eval. Does not match the eval. Send. Sending...



## Read-only MCP server (own page, /mcp, ADR 013)

Title: Read-only MCP server

The page copy lives in `app/(site)/mcp/page.tsx` and is built from the tool contracts in `lib/mcp/contracts.ts`, so the wording of each tool is the tool's own description. It says what the endpoint is (JSON-RPC 2.0 over HTTP POST, three read-only tools), how to connect (endpoint, protocol version, two curl examples), the three tool contracts (inputs and outputs as tables), and what it does not do (no writes, no sessions, no memory, no private notes, same rate-limit service as the chat with its own counters). It names no person and makes no claim about my work history.
