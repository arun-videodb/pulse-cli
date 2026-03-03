---
name: pulse
description: Generate and schedule social media posts to X, LinkedIn, and Reddit. Fetches briefs from Coda, generates platform-native content with AI, and schedules via Postiz.
allowed-tools: Bash(npx tsx *)
---

# Pulse — Social Media Post Generator & Scheduler

Generate and schedule social media posts via Postiz. All commands run from the plugin directory.

**Plugin directory:** Find the installed plugin path and `cd` into it before running commands.

---

## Commands

### Full Pipeline (Fetch → Generate → Review → Schedule)
```bash
npx tsx src/index.ts run
```

Flags (all optional — prompts interactively when omitted):

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

---

### Generate Posts (without scheduling)
```bash
npx tsx src/index.ts generate \
  --brief "Product brief" \
  --platforms x,linkedin,reddit \
  --output posts.json
```

### Schedule Posts (from generated JSON)
```bash
npx tsx src/index.ts schedule \
  --input posts.json \
  --date 2026-03-10T10:00:00Z \
  --type schedule
```

### Coda Documents
```bash
# List docs
npx tsx src/index.ts coda list [--query "search"]

# Fetch page content
npx tsx src/index.ts coda fetch <docId> [--page <pageId>] [--output brief.md]
```

### Postiz Integrations
```bash
npx tsx src/index.ts integrations
```

### Configuration
```bash
npx tsx src/index.ts config --set KEY=VALUE
```

Keys: `POSTIZ_API_KEY`, `CODA_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AI_MODEL`, `POSTIZ_API_URL`

---

## Workflow

1. **Fetch brief** — from Coda doc, inline text, or file
2. **System prompt** — default or custom from Coda
3. **Select platforms** — from connected Postiz integrations
4. **Generate** — AI creates platform-specific posts
5. **Review** — accept, edit, regenerate, or skip each post
6. **Platform settings** — subreddit/title for Reddit, reply permissions for X
7. **Schedule** — post now, schedule for later, or save as draft
