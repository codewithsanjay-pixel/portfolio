# Resume (source of truth)

Name: Sanjay Kandimalla
Location: Dallas, TX area
Contact: san.jay.kan.dim.lla@gmail.com | https://www.linkedin.com/in/sanjay-kandimalla/ | https://github.com/codewithsanjay-pixel

NOTE FOR CLAUDE CODE: This file is the only source of facts about me. Do not add anything that is not here. Items marked [CONFIRM] need my confirmation before use.

## Summary
- Backend engineer working mostly in Python, with 4+ years of experience delivering AI-driven solutions for enterprise environments, combining full stack development with hands-on AI engineering.
- Engineered production AI/LLM applications, including RAG pipelines, AI agents, and Model Context Protocol (MCP) integrations.
- Developed REST APIs connecting AI services to core enterprise systems, using Python (FastAPI, Flask) on the backend and React on the frontend.
- Applied prompt engineering to improve LLM output accuracy and reliability in production use cases.
- Managed SQL and NoSQL databases (PostgreSQL, MongoDB) to support AI application data, context, and retrieval requirements.
- Contributed ML components (feature engineering, model evaluation) to hybrid systems combining traditional ML with LLM-based reasoning.
- Followed disciplined engineering practices including Git version control, CI/CD, code review, and Agile delivery.

## Technical skills
- Backend: Python, FastAPI, Flask, Django REST Framework, REST API design and integration, microservices, asynchronous programming (asyncio)
- AI/LLM engineering: LLM integration, RAG, AI agents, agent orchestration, Model Context Protocol (MCP), prompt engineering, LangChain, LlamaIndex
- Machine learning: scikit-learn, PyTorch (working knowledge), Pandas, NumPy, model evaluation, feature engineering, statistical modeling
- LLM platforms/APIs: OpenAI API, Anthropic Claude API, Azure OpenAI Service, AWS Bedrock
- Vector/embeddings: pgvector, FAISS, Pinecone, Chroma, embedding models, semantic search
- Frontend: React, Redux, TypeScript, JavaScript (ES6+), HTML5, CSS3
- Databases: PostgreSQL, MySQL, SQL, NoSQL (MongoDB, DynamoDB), Redis
- Cloud and DevOps: AWS (Lambda, EC2, S3, Bedrock), Azure, Docker, Kubernetes, CI/CD (GitHub Actions, Jenkins)
- Tools and practices: Git, GitHub, Agile/Scrum, API documentation (OpenAPI/Swagger), Postman, unit testing, integration testing, code review

## Experience

### Software Development Engineer. American Airlines. Dallas, TX (Remote). February 2025 to present
- Delivered AI-driven solutions as a backend-focused full stack developer, building Python services with FastAPI to support enterprise operations, customer support, and internal automation platforms.
- Engineered AI/LLM applications end to end, integrating large language models (OpenAI, Azure OpenAI) into internal tools to automate business workflows.
- Built and optimized RAG pipelines connecting internal knowledge bases and document repositories to LLMs using vector databases (pgvector, FAISS), improving retrieval relevance and reducing hallucinated responses.
- Architected and deployed AI agents to automate multi-step operational workflows, handling task planning, tool calling, and orchestration across enterprise systems.
- Implemented MCP servers to standardize secure access between internal enterprise data sources and LLM-based applications, enabling reusable context across multiple AI tools.
- Applied prompt engineering techniques, including few-shot prompting, chain-of-thought structuring, and system prompt design, to improve LLM output accuracy and consistency in production.
- Developed React-based interfaces and dashboards for internal AI tooling, giving business users a way to interact with, monitor, and validate AI agent outputs.
- Integrated REST APIs connecting AI services to core enterprise systems, ensuring reliable, low-latency data exchange.
- Managed structured and unstructured data using PostgreSQL and NoSQL (MongoDB) to support AI application context, conversation state, and retrieval workflows.
- Incorporated ML techniques (feature engineering, model evaluation) into hybrid systems combining traditional ML models with LLM-based reasoning.
- Collaborated with data science, platform engineering, and product teams in an Agile/Scrum environment, using Git-based workflows and CI/CD pipelines for frequent, reliable deployments.
- Established internal engineering standards for AI application development, including MCP integration patterns and prompt versioning.
- Evaluated and selected embedding models and chunking strategies to improve semantic search accuracy across large, unstructured internal document sets.
- Monitored AI application performance in production using observability tools, identifying latency and accuracy issues in LLM responses and agent workflows.
- Secured AI integrations by implementing authentication, rate limiting, and access controls across MCP servers and REST API endpoints handling sensitive enterprise data.
- Authored technical documentation and internal guides for AI/LLM application patterns, supporting onboarding for engineers new to RAG and agent-based development.
- Optimized backend query performance across PostgreSQL and MongoDB data stores supporting high-traffic AI application endpoints.
- Presented AI solution designs and technical trade-offs to engineering leadership and product stakeholders, supporting decisions on tooling and architecture.

### Software Engineer. American Express. Hyderabad, India. June 2021 to December 2023
- Developed backend services and REST APIs using Python (Flask, FastAPI) supporting fraud detection, risk scoring, and customer analytics platforms handling high transaction volumes.
- Delivered full stack features using React and Python-based APIs for internal risk and compliance tools, working across frontend and backend layers.
- Modeled and maintained SQL (PostgreSQL, MySQL) and NoSQL (MongoDB) data structures supporting transactional and analytical workloads.
- Assembled data pipelines to integrate machine learning models (scikit-learn) into backend services, supporting real-time fraud scoring and risk classification.
- Supported early NLP-based tooling for customer support ticket classification, establishing technical groundwork for later LLM-based application work.
- Followed modern development practices including code review, unit testing, integration testing, and CI/CD deployment using Git and Jenkins.
- Partnered with data science teams to move statistical and ML models from prototype into production backend services.
- Refactored legacy Python services into modular, testable components, improving maintainability and reducing deployment issues.
- Automated recurring data validation and reporting tasks using Python scripts, reducing manual effort for the risk analytics team.
- Debugged and resolved production incidents across backend services, working directly with on-call and platform teams to restore service reliability.
- Documented API contracts and internal service specifications using OpenAPI/Swagger, improving cross-team integration and onboarding.
- Reviewed pull requests and provided feedback to peer engineers, contributing to consistent coding standards across the backend team.
- Coordinated with front-end engineers to define API contracts, ensuring smooth integration between React interfaces and backend services.

## Projects

### Enterprise Knowledge Assistant: RAG and agentic workflow with MCP integration
Architected an internal AI assistant that let employees query internal documentation, policies, and system data through one conversational interface. Implemented a RAG pipeline using pgvector for semantic retrieval over internal documents, paired with an AI agent layer that took follow-up actions (opening tickets, pulling live data) using tool calling. Constructed a custom MCP server to expose internal APIs and databases as standardized, secure context sources the agent could call, allowing other internal AI tools to reuse the same context layer without rebuilding integrations. Applied prompt engineering and evaluation methods to reduce irrelevant or incorrect responses. Delivered as a full stack application with a FastAPI backend and React frontend for employee use and admin monitoring.

Confirmed: employer work at American Airlines. On the site and in the chat, describe it in general terms only (type of problem, my role, technologies). No internal system names, data or numbers. No repo link.

## Detail from me
My own answers about my real work, added 2026-10-08. Tags:
- [PUBLIC-GENERAL]: may be used on the site and in the chat, in general terms.
- [INTERVIEW-ONLY]: for interviews only. Never on the site or in the chat. They are not kept in this file.

An item that also carries [CONFIRM] is not published until I confirm it, whatever its tag.

### Retrieval (American Airlines)
- [PUBLIC-GENERAL] Retrieval used a bi-encoder step to find candidates, then an off-the-shelf cross-encoder to re-rank them. I did not build the re-ranker.

### Ownership (American Airlines)
- [PUBLIC-GENERAL] I own the architecture and delivery of the internal AI tooling I work on at American Airlines. (Confirmed by me 2026-10-09.)

### MCP server security (American Airlines)
- [PUBLIC-GENERAL] Every request to the MCP server carried a token from the enterprise single sign-on, and the server verified it on each request. The server kept no session state.
- [PUBLIC-GENERAL] The MCP server connected to the database with a read-only role. The application logic already prevented writes, but I wanted that enforced at the database level too, not just trusted in code. (Confirmed by me 2026-10-09.)

### Citation checking (American Airlines)
- [PUBLIC-GENERAL] Before an answer went back to the user, the server checked that every source the agent cited was real and that the content matched what was in the document. A model can make up citations with confidence, so I did not leave that check to the model. (Confirmed by me 2026-10-09.)

### Engineering standards (American Airlines)
- [PUBLIC-GENERAL] I wrote an enum-based input-validation fix myself. It was one of the patterns below. It stopped a caller from passing an arbitrary string into a field that should accept only a fixed set of values. The tool now accepts only the values it was built for and rejects everything else on the server, before anything else runs. (Confirmed by me 2026-10-09.)
- [PUBLIC-GENERAL] Several patterns I documented became the internal engineering standard (see Experience): tool input schemas, where to enforce access control, and prompt versioning.

### Enterprise Knowledge Assistant stack
- [PUBLIC-GENERAL] The backend was Python with FastAPI. The vector store was PostgreSQL with pgvector, inside the PostgreSQL we already ran, so there was no separate vector database to operate. (Confirmed by me 2026-10-09.)

### Design decisions (American Airlines)
- [PUBLIC-GENERAL] Chunking: I started with fixed-size chunks, which sometimes split a clause in the middle of a sentence. I moved to splitting on document structure, headings and paragraph breaks, with size limits to keep chunks manageable. Results on my test set improved. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Embedding model: I chose it by comparing candidates on a sample of real queries from the system, not by benchmark scores. What decided it was how well each model handled the vocabulary in the documents. (Confirmed by me 2026-10-19. Model names stay out of public text.)
- [PUBLIC-GENERAL] Too much context: retrieving too many passages diluted the context. I fixed it by keeping fewer passages after re-ranking. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Vocabulary gap: employees asked questions informally, while the policy documents were written formally. I fixed it by expanding the query before embedding it. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Access control: I enforced access in each tool, not in the prompt. Before a query ran, the tool worked out who the caller was from their single sign-on token and limited what it could return. The model never received data the caller was not allowed to see. This was part of the design from the start, not added later. (Confirmed by me 2026-10-19.)

### Outcomes (American Airlines)
- [PUBLIC-GENERAL] Adoption: the business team chose to expand the assistant from one document set to several because they trusted it, not because it was required. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Answer quality: the retrieval and evaluation work reduced wrong answers until they stopped being a standing issue the business team raised in reviews. No figures are published. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Time saved: employees found answers through the assistant instead of searching shared drives or asking colleagues. I did not run a formal time study. The feedback from the operations team was consistent on this. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Reuse: other internal AI tools used the same MCP server instead of building their own integrations to the same systems. That was one of the reasons I designed the MCP layer as a shared piece. (Confirmed by me 2026-10-19.)

### Cloud (American Airlines)
- [PUBLIC-GENERAL] The AI integrations ran on AWS. I used Lambda for serverless functions and S3 for the documents that fed the retrieval pipeline, and the deployment ran on EC2. I also used Azure OpenAI Service for language model integration. (Confirmed by me 2026-10-19.)
- [PUBLIC-GENERAL] Platform engineering owned the AWS environment. My work used these services at the application layer: I configured how the AI services connected to and used them. I did not provision or manage the underlying infrastructure. (Confirmed by me 2026-10-19.)

### Enterprise Knowledge Assistant rollout
- [PUBLIC-GENERAL] The assistant grew from one document set to several over the following months after the initial rollout, as the business team's trust grew. (Wording chosen by me 2026-10-09.)

## Education
- M.S., Applied Statistics and Data Science, University of Texas at Arlington. January 2024 to December 2025 (graduated December 2025). CGPA: 3.9.
- Studied full time from January 2024, then joined American Airlines in February 2025 while finishing the degree.

## Decisions about what is public (answered 2026-10-08)
1. Public projects: the Enterprise Knowledge Assistant and both roles, all described in general terms only. No internal system names, data or numbers for American Airlines or American Express.
2. Numbers: say "4+ years" (professional experience) or "since 2021". Never "5+ years" or "five years", for the total or for any single tool (decided 2026-10-09). The M.S. and CGPA 3.9 may be stated. No other numbers. Describe results in words.
3. Timeline: January 2024 to January 2025 was full-time study for the M.S. at UT Arlington.
