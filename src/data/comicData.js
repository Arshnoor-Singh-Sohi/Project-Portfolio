// ============================================================
// comicData.js — all content for the "DATA STORM #001" portfolio.
// Edit this file to update copy; no component changes needed.
// ============================================================

/* ---------- ORIGIN STORY (vertical comic strip) ----------
   Ordered oldest → newest. The entry with `commandCenter: true`
   renders as the glowing Blueprint Command Center.            */
export const ISSUES = [
  {
    issue: 'ISSUE #0',
    title: 'The Origin',
    org: 'Punjab Technical University',
    period: '2020 — 2024',
    bubble: 'Every hero needs a foundation arc.',
    body:
      'B.Tech in Computer Science & Engineering. Four years of algorithms, systems and late-night builds forge the core power set: Java, C, Python and an obsession with how things work under the hood.',
    tags: ['B.Tech CSE', 'Java', 'C', 'Python'],
  },
  {
    issue: 'ISSUE #1',
    title: 'Crossing the Border',
    org: 'University of Windsor — Master of Applied Computing (AI)',
    period: '2024 — 2025',
    bubble: 'New city. New powers. AI specialization unlocked.',
    body:
      'Neural Networks & Deep Learning (96/100), Topics in Applied AI (98/100). Wins 1st place at the NLP & LLM Workshop and builds a 30,000-line modular RAG research system on the side.',
    tags: ['AI Specialization', 'Deep Learning', 'RAG', 'NLP Workshop Winner'],
  },
  {
    issue: 'ISSUE #2',
    title: 'The Vision Arc',
    org: 'MealLens — AI/ML Engineer',
    period: 'May — Sep 2025',
    bubble: 'Teaching machines to see food. Literally.',
    body:
      'Engineers an end-to-end computer vision pipeline for automated food recognition — benchmarking 11+ YOLO variants, cutting false positives from 73% to 0% with food-specific optimization, and shipping it behind FastAPI services in Docker.',
    tags: ['YOLOv8–v10', 'SAM2', 'PyTorch', 'FastAPI', 'Docker'],
  },
  {
    issue: 'ISSUE #3',
    title: 'The Data Storm',
    org: 'FGF Brands — Data Scientist Co-op',
    period: 'Sep 2025 — Present',
    commandCenter: true,
    bubble: 'Current mission: industrial-grade AI for 13 bakeries.',
    body:
      'Builds production LLM systems on Azure Databricks for North American manufacturing: an MCP gateway unifying factory data behind one endpoint, LLM pipelines that write plant downtime reports, deterministic hallucination validators that fact-check every number, and multi-agent LangGraph systems that route questions across SQL and documents.',
    tags: [
      'Azure Databricks', 'MCP Protocol', 'LangGraph', 'LangChain',
      'OAuth M2M', 'Genie NL-to-SQL', 'Vector Search', 'MongoDB Atlas',
    ],
    // Mini systems shown inside the Command Center console
    consoles: [
      { code: 'SYS-01', name: 'InsightAgent', status: 'IN PRODUCTION', desc: 'LLM downtime summaries + hallucination validator' },
      { code: 'SYS-02', name: 'CerebroMCP',  status: 'IN PRODUCTION', desc: 'Unified MCP gateway over Databricks AI services' },
      { code: 'SYS-03', name: 'HeyCerebro',  status: 'ARCHITECTED',   desc: 'Multi-agent RAG + 6-layer guardrail design' },
    ],
  },
];

/* ---------- PROJECT PANES (the Rogue Gallery) ----------
   `schematic` defines the SVG blueprint on the card back:
   nodes are positioned on a 100×60 grid; edges connect by id. */
export const PROJECTS = [
  {
    id: 'insightagent',
    code: 'CASE FILE 01',
    name: 'InsightAgent',
    tagline: 'The pipeline that fact-checks its own AI.',
    story:
      'An end-to-end LLM pipeline on Databricks that writes manufacturing downtime reports for 13 plants — then a deterministic validator cross-checks every number against source SQL, catching 20 classified hallucination failure modes before a human ever reads them.',
    badges: ['Databricks', 'gpt-oss-120b', 'LLM-as-Judge', 'MongoDB Atlas', 'Python'],
    accent: 'crimson',
    schematic: {
      nodes: [
        { id: 'dbx',  x: 10, y: 30, label: 'Databricks SQL' },
        { id: 'llm',  x: 38, y: 12, label: 'LLM Generator' },
        { id: 'val',  x: 38, y: 48, label: 'GT Validator' },
        { id: 'fix',  x: 66, y: 30, label: 'Merge + Fix' },
        { id: 'mongo',x: 90, y: 30, label: 'MongoDB' },
      ],
      edges: [
        ['dbx', 'llm'], ['dbx', 'val'], ['llm', 'fix'], ['val', 'fix'], ['fix', 'mongo'],
      ],
    },
  },
  {
    id: 'cerebromcp',
    code: 'CASE FILE 02',
    name: 'CerebroMCP',
    tagline: 'One gateway to rule the factory data.',
    story:
      'A production FastAPI gateway exposing all Databricks AI services — Genie, SQL, functions — behind a single authenticated MCP endpoint. Refactored from monolith to a Strategy + Registry architecture with 10 tools across 4 backends, and demoed live to company VPs.',
    badges: ['FastAPI', 'MCP Protocol', 'OAuth M2M', 'Strategy Pattern', 'Streamlit'],
    accent: 'gold',
    schematic: {
      nodes: [
        { id: 'agents', x: 10, y: 30, label: 'Agents / Devs' },
        { id: 'gw',     x: 40, y: 30, label: 'MCP Gateway' },
        { id: 'genie',  x: 72, y: 8,  label: 'Genie' },
        { id: 'sql',    x: 78, y: 30, label: 'SQL' },
        { id: 'fn',     x: 72, y: 52, label: 'UC Functions' },
      ],
      edges: [['agents', 'gw'], ['gw', 'genie'], ['gw', 'sql'], ['gw', 'fn']],
    },
  },
  {
    id: 'heycerebro',
    code: 'CASE FILE 03',
    name: 'HeyCerebro Multi-Agent RAG',
    tagline: 'Supervisor. Genie. RAG. Synthesis.',
    story:
      'A LangGraph multi-agent system routing factory questions between Genie (NL-to-SQL) and a hybrid BM25 + Vector Search + Cohere-reranked RAG pipeline — plus an architected 6-layer guardrail design mapping manufacturing failure modes to output validators.',
    badges: ['LangGraph', 'Vector Search', 'BM25 + RRF', 'Cohere Rerank', 'Azure OpenAI'],
    accent: 'blue',
    schematic: {
      nodes: [
        { id: 'q',    x: 8,  y: 30, label: 'Query' },
        { id: 'sup',  x: 32, y: 30, label: 'Supervisor' },
        { id: 'gen',  x: 58, y: 10, label: 'Genie Node' },
        { id: 'rag',  x: 58, y: 50, label: 'RAG Node' },
        { id: 'fin',  x: 84, y: 30, label: 'Finalizer' },
      ],
      edges: [['q', 'sup'], ['sup', 'gen'], ['sup', 'rag'], ['gen', 'fin'], ['rag', 'fin']],
    },
  },
  {
    id: 'genie-bench',
    code: 'CASE FILE 04',
    name: 'Genie NL-to-SQL Stress Test',
    tagline: '320 questions. Zero mercy.',
    story:
      'A rigorous evaluation of Databricks Genie over a 15-table shift-report schema: a 320-question test bank across 19 categories with hand-written ground-truth SQL, surfacing 17.7s mean latency, non-deterministic SQL generation, and 5 silent data-integrity traps in the schema itself.',
    badges: ['Databricks Genie', 'SQL', 'Benchmarking', 'Data Modeling'],
    accent: 'crimson',
    schematic: {
      nodes: [
        { id: 'bank', x: 10, y: 12, label: '320-Q Bank' },
        { id: 'genie',x: 40, y: 30, label: 'Genie Space' },
        { id: 'gt',   x: 10, y: 48, label: 'Ground Truth SQL' },
        { id: 'cmp',  x: 70, y: 30, label: 'Compare' },
        { id: 'rep',  x: 92, y: 30, label: 'Report' },
      ],
      edges: [['bank', 'genie'], ['genie', 'cmp'], ['gt', 'cmp'], ['cmp', 'rep']],
    },
  },
  {
    id: 'cv-pipeline',
    code: 'CASE FILE 05',
    name: 'Conveyor Vision Pipeline',
    tagline: 'Real-time SKU detection on the line.',
    story:
      'An end-to-end industrial CV pipeline: frame extraction from production footage, masking, SAM-assisted annotation, augmentation from ~50 to 800+ samples with recalculated bounding boxes, COCO conversion, and YOLOX-Nano transfer learning with FP16 training.',
    badges: ['YOLOX-Nano', 'SAM', 'OpenCV', 'COCO', 'PyTorch'],
    accent: 'gold',
    schematic: {
      nodes: [
        { id: 'mp4', x: 8,  y: 30, label: 'MP4 Frames' },
        { id: 'mask',x: 30, y: 30, label: 'Mask' },
        { id: 'ann', x: 50, y: 12, label: 'SAM + VIA' },
        { id: 'aug', x: 50, y: 48, label: 'Augment ×16' },
        { id: 'coco',x: 72, y: 30, label: 'COCO Split' },
        { id: 'yolo',x: 92, y: 30, label: 'YOLOX' },
      ],
      edges: [['mp4','mask'],['mask','ann'],['ann','aug'],['aug','coco'],['coco','yolo']],
    },
  },
  {
    id: 'adv-rag',
    code: 'CASE FILE 06',
    name: 'Advanced RAG System',
    tagline: '70 experiments. One retrieval lab.',
    story:
      'A modular RAG research platform with 6 chunking strategies and 5 embedding backends — 0.91 Precision@4 across 70 controlled experiments, hybrid dense + sparse retrieval, and a live Streamlit lab supporting 20+ concurrent users.',
    badges: ['LangChain', 'FAISS', 'BM25', 'Streamlit', 'HuggingFace'],
    accent: 'blue',
    schematic: {
      nodes: [
        { id: 'docs', x: 8,  y: 30, label: 'Docs' },
        { id: 'chunk',x: 30, y: 30, label: 'Chunkers ×6' },
        { id: 'dense',x: 54, y: 12, label: 'FAISS' },
        { id: 'sparse',x: 54, y: 48, label: 'BM25' },
        { id: 'fuse', x: 76, y: 30, label: 'Hybrid Fuse' },
        { id: 'ans',  x: 94, y: 30, label: 'Answer' },
      ],
      edges: [['docs','chunk'],['chunk','dense'],['chunk','sparse'],['dense','fuse'],['sparse','fuse'],['fuse','ans']],
    },
  },
];

/* ---------- TECHNICAL ARSENAL (vaults) ---------- */
export const VAULTS = [
  {
    vault: 'VAULT A',
    name: 'AI & LLM Systems',
    skills: [
      'LangGraph', 'LangChain', 'RAG Pipelines', 'MCP Protocol',
      'Prompt Engineering', 'LLM-as-Judge', 'Hallucination Detection',
      'Multi-Agent Systems', 'Vector Search', 'Hugging Face',
    ],
  },
  {
    vault: 'VAULT B',
    name: 'Data Engineering Arsenal',
    skills: [
      'Azure Databricks', 'Unity Catalog', 'Delta Lake', 'Spark SQL',
      'Databricks Genie', 'MongoDB Atlas', 'MySQL', 'FAISS', 'ETL Pipelines',
    ],
  },
  {
    vault: 'VAULT C',
    name: 'Core Languages & Frameworks',
    skills: [
      'Python', 'Java', 'TypeScript', 'SQL', 'C++',
      'PyTorch', 'FastAPI', 'React', 'Node.js', 'OpenCV',
    ],
  },
  {
    vault: 'VAULT D',
    name: 'Automation Overlords',
    skills: [
      'Azure DevOps', 'Docker', 'CI/CD', 'OAuth 2.0 (M2M)',
      'Git', 'Streamlit', 'REST APIs', 'Linux',
    ],
  },
];

export const CONTACT = {
  name: 'Arshnoor Singh Sohi',
  title: 'Data Engineering & AI Systems Architect',
  email: 'sohi21@uwindsor.ca',
  github: 'https://github.com/Arshnoor-Singh-Sohi',
  linkedin: 'https://www.linkedin.com/in/arshnoorsinghsohi/',
};
