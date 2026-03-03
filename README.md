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
/pulse config --set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
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

| Flag | Description | Example |
|------|-------------|---------|
| `-b, --brief <text>` | Brief text inline | `-b "Launch announcement for our new video API"` |
| `-f, --brief-file <path>` | Brief from a local file | `-f ./briefs/launch.md` |
| `--coda-doc <docId>` | Fetch brief from a Coda document | `--coda-doc WEq7xzXY5I` |
| `--coda-page <pageId>` | Specific Coda page for the brief | `--coda-page "Launch Brief"` |
| `-p, --platforms <list>` | Comma-separated platforms | `-p x,linkedin,reddit` |
| `-m, --model <id>` | AI model override | `-m anthropic:claude-sonnet-4-20250514` |
| `--key-points <text>` | Additional key points | `--key-points "Free tier available, 10x faster"` |
| `--demo-url <url>` | Demo video URL to reference | `--demo-url https://youtu.be/abc123` |
| `--system-prompt <text>` | Custom system prompt | `--system-prompt "Write in a casual, developer-friendly tone"` |
| `-d, --date <iso>` | Schedule date in ISO 8601 (UTC) | `-d 2026-03-10T10:00:00Z` |
| `-t, --type <type>` | Post type | `-t schedule`, `-t now`, or `-t draft` |

### `/pulse generate` — Generate Posts

Generate without scheduling. Save to file with `--output`.

| Flag | Description | Example |
|------|-------------|---------|
| `-b, --brief <text>` | Brief text inline | `-b "We just shipped real-time video search"` |
| `-f, --brief-file <path>` | Brief from a local file | `-f ./brief.md` |
| `--coda-doc <docId>` | Fetch brief from Coda | `--coda-doc WEq7xzXY5I` |
| `--coda-page <pageId>` | Coda page ID or name | `--coda-page "Product Brief"` |
| `-p, --platforms <list>` | Platforms to generate for | `-p x,linkedin` |
| `-m, --model <id>` | AI model override | `-m openai:gpt-4o` |
| `-o, --output <path>` | Save results to JSON file | `-o ./generated-posts.json` |

### `/pulse schedule` — Schedule Posts

Schedule from a previously generated JSON file.

| Flag | Description | Example |
|------|-------------|---------|
| `-i, --input <path>` | JSON file from `generate --output` | `-i ./generated-posts.json` |
| `-d, --date <iso>` | Schedule date in ISO 8601 (UTC) | `-d 2026-03-10T14:30:00Z` |
| `-t, --type <type>` | Post type | `-t schedule`, `-t now`, or `-t draft` |

### `/pulse coda list` — List Coda Documents

| Flag | Description | Example |
|------|-------------|---------|
| `-q, --query <search>` | Filter docs by name | `-q "videodb"` |

### `/pulse coda fetch [docId]` — Fetch Coda Page

| Flag | Description | Example |
|------|-------------|---------|
| `[docId]` | Coda document ID (optional, interactive if omitted) | `WEq7xzXY5I` |
| `-p, --page <pageId>` | Page ID or name | `-p "Launch Brief"` |
| `-o, --output <path>` | Save content to file | `-o ./brief.md` |

### `/pulse integrations` — List Connected Accounts

Lists all social media accounts connected in Postiz (ID, platform, name, status). No flags needed.

### `/pulse config` — Configure API Keys

| Flag | Description | Example |
|------|-------------|---------|
| `--set <KEY=VALUE>` | Set a config value | `--set POSTIZ_API_KEY=abc123...` |

**Keys:** `POSTIZ_API_KEY`, `POSTIZ_API_URL`, `CODA_API_KEY`, `AI_MODEL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`

---

## Supported Platforms

| Platform | Features |
|----------|----------|
| **X (Twitter)** | Thread generation (hook + replies), reply permission settings |
| **LinkedIn** | Professional posts with self-comment, company page support |
| **Reddit** | Subreddit targeting, AI-suggested titles/flairs, post type selection |

## AI Providers

Supports [Vercel AI SDK](https://sdk.vercel.ai/) providers — set via `AI_MODEL`:

| Provider | Example Model ID |
|----------|-----------------|
| Anthropic | `anthropic:claude-sonnet-4-20250514` |
| OpenAI | `openai:gpt-4o` |
| Google | `google:gemini-2.0-flash` |
