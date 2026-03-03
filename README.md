# pulse-cli

Generate and schedule social media posts to **X**, **LinkedIn**, and **Reddit**. Fetches briefs from **Coda**, generates platform-native content with **AI**, and schedules via **Postiz**.

```
Coda (brief) → AI (generate) → Review (edit/regenerate) → Postiz (schedule)
```

## Install as Claude Code Skill

### 1. Add the marketplace

```
/plugin marketplace add arun-videodb/pulse-cli
```

### 2. Install the plugin

```
/plugin install pulse@arun-videodb-pulse-cli
```

### 3. Configure API keys (one-time)

```
/pulse config --set POSTIZ_API_KEY=your-key
/pulse config --set CODA_API_KEY=your-key
/pulse config --set ANTHROPIC_API_KEY=your-key
/pulse config --set AI_MODEL=anthropic:claude-sonnet-4-20250514
```

### 4. Use it

```
/pulse run
```

---

## Available Options

### `/pulse run` — Full Pipeline

Interactive workflow: fetch brief → generate posts → review → schedule.

| Flag | Description |
|------|-------------|
| `-b, --brief <text>` | Brief text inline |
| `-f, --brief-file <path>` | Brief from a local file |
| `--coda-doc <docId>` | Fetch brief from a Coda document |
| `--coda-page <pageId>` | Specific Coda page for the brief |
| `-p, --platforms <list>` | Comma-separated: `x,linkedin,reddit` |
| `-m, --model <id>` | AI model (e.g. `anthropic:claude-sonnet-4-20250514`) |
| `--key-points <text>` | Additional key points |
| `--demo-url <url>` | Demo video URL |
| `--system-prompt <text>` | Custom system prompt |
| `-d, --date <iso>` | Schedule date (ISO 8601) |
| `-t, --type <type>` | `schedule`, `now`, or `draft` |

### `/pulse generate` — Generate Posts

Generate without scheduling. Save to file with `--output`.

| Flag | Description |
|------|-------------|
| `-b, --brief <text>` | Brief text inline |
| `-f, --brief-file <path>` | Brief from a local file |
| `--coda-doc <docId>` | Fetch brief from Coda |
| `--coda-page <pageId>` | Coda page ID |
| `-p, --platforms <list>` | Platforms to generate for |
| `-m, --model <id>` | AI model override |
| `-o, --output <path>` | Save results to JSON |

### `/pulse schedule` — Schedule Posts

Schedule from a previously generated JSON file.

| Flag | Description |
|------|-------------|
| `-i, --input <path>` | JSON file from `generate --output` |
| `-d, --date <iso>` | Schedule date (ISO 8601) |
| `-t, --type <type>` | `schedule`, `now`, or `draft` |

### `/pulse coda list` — List Coda Documents

| Flag | Description |
|------|-------------|
| `-q, --query <search>` | Filter docs by name |

### `/pulse coda fetch [docId]` — Fetch Coda Page

| Flag | Description |
|------|-------------|
| `-p, --page <pageId>` | Page ID or name |
| `-o, --output <path>` | Save content to file |

### `/pulse integrations` — List Connected Accounts

Lists all social media accounts connected in Postiz (ID, platform, name, status).

### `/pulse config` — Configure API Keys

| Flag | Description |
|------|-------------|
| `--set <KEY=VALUE>` | Set a config value |

**Keys:** `POSTIZ_API_KEY`, `POSTIZ_API_URL`, `CODA_API_KEY`, `AI_MODEL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`

---

## Supported Platforms

| Platform | Features |
|----------|----------|
| **X (Twitter)** | Thread generation (hook + replies), reply permission settings |
| **LinkedIn** | Professional posts with self-comment, company page support |
| **Reddit** | Subreddit targeting, AI-suggested titles/flairs, post type selection |

## AI Providers

Supports [Vercel AI SDK](https://sdk.vercel.ai/) providers — OpenAI, Anthropic (Claude), and Google (Gemini).
