# pulse-cli

CLI tool for generating and scheduling social media posts. Connects to **Coda** for briefs and system prompts, uses **AI** (Claude/OpenAI/Gemini) to generate platform-native content, and schedules via **Postiz** to X, LinkedIn, and Reddit.

## Workflow

```
Coda (brief) → AI (generate) → Review (edit/regenerate) → Postiz (schedule)
```

## Use as a Claude Code Skill

pulse-cli can be used as a [Claude Code custom skill](https://docs.anthropic.com/en/docs/claude-code/skills), allowing you to invoke it directly from Claude Code with slash commands like `/pulse-run`, `/pulse-generate`, etc.

### Quick Setup

1. **Clone into your project's `.claude/skills/` directory** (or any location Claude Code discovers skills from):

```bash
# Project-level skill (available in this project)
mkdir -p .claude/skills
git clone git@github.com:arun-videodb/pulse-cli.git .claude/skills/pulse-cli
cd .claude/skills/pulse-cli && npm install && cd -

# Or personal skill (available in all your projects)
mkdir -p ~/.claude/skills
git clone git@github.com:arun-videodb/pulse-cli.git ~/.claude/skills/pulse-cli
cd ~/.claude/skills/pulse-cli && npm install && cd -
```

2. **Create the skill file** at `.claude/skills/pulse-cli/SKILL.md`:

```yaml
---
name: pulse
description: Generate and schedule social media posts to X, LinkedIn, and Reddit.
  Fetches briefs from Coda, generates platform-native content with AI, and schedules
  via Postiz. Use when the user wants to create, generate, or schedule social posts.
allowed-tools: Bash(npx tsx *)
---

# Pulse CLI — Social Media Post Generator & Scheduler

You have access to the pulse-cli tool for generating and scheduling social media posts.

## Available Commands

Run all commands from the pulse-cli skill directory.

### Full Pipeline (interactive)
`npx tsx src/index.ts run`

### Individual Commands
- **Configure:** `npx tsx src/index.ts config --set KEY=VALUE`
- **List Coda docs:** `npx tsx src/index.ts coda list [--query "search"]`
- **Fetch Coda page:** `npx tsx src/index.ts coda fetch <docId> [--page <pageId>]`
- **List integrations:** `npx tsx src/index.ts integrations`
- **Generate posts:** `npx tsx src/index.ts generate --brief "..." --platforms x,linkedin,reddit`
- **Schedule posts:** `npx tsx src/index.ts schedule --input posts.json --date <ISO-date>`

### Non-Interactive Usage (for Claude)
When running commands on behalf of the user, prefer non-interactive flags:

```bash
# Generate with all flags (no prompts)
npx tsx src/index.ts generate \
  --brief "Product brief text here" \
  --platforms x,linkedin,reddit \
  --model anthropic:claude-sonnet-4-20250514 \
  --output /tmp/pulse-posts.json

# Schedule from generated file
npx tsx src/index.ts schedule \
  --input /tmp/pulse-posts.json \
  --date 2026-03-10T10:00:00Z \
  --type schedule
```

### Coda Integration
Fetch briefs and system prompts from Coda documents:
```bash
# List available docs
npx tsx src/index.ts coda list

# Fetch a specific page as markdown
npx tsx src/index.ts coda fetch <docId> --page "Brief" --output /tmp/brief.md
```

## Workflow
1. Fetch brief from Coda (or user provides inline)
2. Generate platform-specific posts with AI
3. Show posts to user for review
4. Collect platform settings (subreddit, reply permissions, etc.)
5. Schedule via Postiz
```

3. **Configure API keys** (one-time):

```bash
cd .claude/skills/pulse-cli
npx tsx src/index.ts config --set POSTIZ_API_KEY=your-key
npx tsx src/index.ts config --set CODA_API_KEY=your-key
npx tsx src/index.ts config --set ANTHROPIC_API_KEY=your-key
npx tsx src/index.ts config --set AI_MODEL=anthropic:claude-sonnet-4-20250514
```

### Usage in Claude Code

Once configured, invoke from any Claude Code session:

```
/pulse generate posts for our new API launch, post on X and LinkedIn
/pulse schedule the generated posts for tomorrow at 10am UTC
/pulse fetch the brief from our VideoDB GTM coda doc and generate posts
```

Claude will use the skill instructions to run the appropriate pulse-cli commands, show you the generated posts for review, and handle scheduling.

### Sub-Skills (Optional)

For more granular slash commands, create separate skill files:

**`.claude/skills/pulse-generate/SKILL.md`**
```yaml
---
name: pulse-generate
description: Generate social media posts from a brief using AI
allowed-tools: Bash(npx tsx *)
---
Run `npx tsx <path-to-pulse-cli>/src/index.ts generate $ARGUMENTS`
Show the generated posts to the user for review.
```

**`.claude/skills/pulse-coda/SKILL.md`**
```yaml
---
name: pulse-coda
description: Browse and fetch content from Coda documents
allowed-tools: Bash(npx tsx *)
---
Run `npx tsx <path-to-pulse-cli>/src/index.ts coda $ARGUMENTS`
Display the results to the user.
```

---

## Installation (Standalone)

```bash
git clone git@github.com:arun-videodb/pulse-cli.git
cd pulse-cli
npm install
```

## Configuration

Set up your API keys:

```bash
# Interactive setup
npx tsx src/index.ts config

# Or set individually
npx tsx src/index.ts config --set POSTIZ_API_KEY=your-key
npx tsx src/index.ts config --set CODA_API_KEY=your-key
npx tsx src/index.ts config --set ANTHROPIC_API_KEY=your-key
npx tsx src/index.ts config --set AI_MODEL=anthropic:claude-sonnet-4-20250514
```

Keys are saved to `~/.pulse-cli/config.json`. You can also use a `.env` file in the project root (env vars take precedence over the config file).

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTIZ_API_KEY` | Postiz API key (from Postiz Settings) | — |
| `POSTIZ_API_URL` | Postiz API base URL | `https://api.postiz.com/public/v1` |
| `CODA_API_KEY` | Coda API token | — |
| `AI_MODEL` | AI model in `provider:model` format | `openai:gpt-4o` |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | — |

## Commands

### `pulse-cli run` — Full Pipeline

The main command. Walks through the entire workflow interactively:

1. **Fetch brief** — from Coda document, inline text, or file
2. **System prompt** — use default or fetch custom prompt from Coda
3. **Select platforms** — pick from connected Postiz integrations
4. **Generate** — AI creates platform-specific posts in parallel
5. **Review** — accept, edit, regenerate, or skip each post
6. **Platform settings** — subreddit name/title for Reddit, reply permissions for X, etc.
7. **Schedule** — post now, schedule for later, or save as draft

```bash
# Interactive mode
npx tsx src/index.ts run

# With flags
npx tsx src/index.ts run \
  --brief "Launch announcement for our new API" \
  --platforms x,linkedin,reddit \
  --date 2026-03-10T10:00:00Z
```

### `pulse-cli generate` — Generate Posts

Generate posts without scheduling. Useful for review or saving to a file.

```bash
# Interactive
npx tsx src/index.ts generate

# With flags
npx tsx src/index.ts generate \
  --brief "Product launch brief here" \
  --platforms x,linkedin,reddit \
  --output posts.json

# From Coda document
npx tsx src/index.ts generate \
  --coda-doc WEq7xzXY5I \
  --coda-page "Launch Brief" \
  --platforms x,linkedin
```

**Options:**

| Flag | Description |
|------|-------------|
| `-b, --brief <text>` | Brief text inline |
| `-f, --brief-file <path>` | Brief from a local file |
| `--coda-doc <docId>` | Fetch brief from a Coda document |
| `--coda-page <pageId>` | Specific page within the Coda doc |
| `-p, --platforms <list>` | Comma-separated: `x,linkedin,reddit` |
| `-m, --model <id>` | AI model override (e.g. `anthropic:claude-sonnet-4-20250514`) |
| `--key-points <text>` | Additional key points for generation |
| `--demo-url <url>` | Demo video URL to include |
| `--system-prompt <text>` | Custom system prompt |
| `-o, --output <path>` | Save generated posts to JSON |

### `pulse-cli schedule` — Schedule Posts

Schedule previously generated posts from a JSON file.

```bash
npx tsx src/index.ts schedule \
  --input posts.json \
  --date 2026-03-10T10:00:00Z \
  --type schedule
```

**Options:**

| Flag | Description |
|------|-------------|
| `-i, --input <path>` | JSON file from `generate --output` |
| `-d, --date <iso>` | Schedule date (ISO 8601) |
| `-t, --type <type>` | `schedule`, `now`, or `draft` |

### `pulse-cli coda` — Coda Documents

```bash
# List all docs
npx tsx src/index.ts coda list

# Search docs
npx tsx src/index.ts coda list --query "videodb"

# Fetch page content (interactive page selection)
npx tsx src/index.ts coda fetch WEq7xzXY5I

# Fetch specific page
npx tsx src/index.ts coda fetch WEq7xzXY5I --page "Launch Brief"

# Save to file
npx tsx src/index.ts coda fetch WEq7xzXY5I --page "Brief" --output brief.md
```

### `pulse-cli integrations` — Connected Accounts

List all social media accounts connected in Postiz.

```bash
npx tsx src/index.ts integrations
```

Output:

```
  ID                            Platform          Name                Status
  ─────────────────────────────────────────────────────────────────────────
  cmm8uppxe000cl80y2r5wzumj     x                 Arun                active
  cmlswioso03z4r00ymzmuvbnt     linkedin          Test gtm            active
  cmlswd31s03yor00yq93y072x     reddit            New-Reference-570   active
```

### `pulse-cli config` — API Keys

```bash
# Interactive setup (prompts for each key)
npx tsx src/index.ts config

# Set a single value
npx tsx src/index.ts config --set POSTIZ_API_KEY=your-key
```

## Project Structure

```
src/
  index.ts                    # CLI entry point (Commander)
  commands/
    config.ts                 # API key setup
    coda.ts                   # Coda list/fetch commands
    integrations.ts           # List Postiz integrations
    generate.ts               # AI post generation
    schedule.ts               # Postiz scheduling
    run.ts                    # Full pipeline orchestrator
  lib/
    config.ts                 # ~/.pulse-cli/config.json management
    env.ts                    # dotenv + config file loading
    ui.ts                     # Terminal output helpers (chalk/ora)
    coda/
      client.ts               # Coda API client
    ai/
      provider.ts             # Vercel AI SDK provider registry
      prompts.ts              # Platform-specific prompt templates
      generate-posts.ts       # Multi-platform AI generation
      types.ts                # Post content types
      content-helpers.ts      # HTML/text conversion utilities
    postiz/
      client.ts               # Postiz API client
      platform-settings.ts    # Platform-specific settings builder
```

## Supported Platforms

| Platform | Features |
|----------|----------|
| **X (Twitter)** | Thread generation (hook + replies), reply permission settings |
| **LinkedIn** | Professional posts with optional self-comment, company page support |
| **Reddit** | Subreddit targeting, AI-suggested titles/flairs, post type selection |

## AI Generation

Posts are generated using platform-specific prompts that produce native content for each platform:

- **X**: JSON thread format with hook tweet + supporting replies
- **LinkedIn**: Professional tone with self-comment support
- **Reddit**: Community-focused, non-promotional tone with title/subreddit/flair suggestions

Supports multiple AI providers via the [Vercel AI SDK](https://sdk.vercel.ai/):
- OpenAI (GPT-4o, etc.)
- Anthropic (Claude Sonnet, Opus, etc.)
- Google (Gemini)

## Tech Stack

- **TypeScript** + **Node.js** (ESM)
- **Commander.js** — CLI framework
- **@inquirer/prompts** — Interactive terminal prompts
- **Vercel AI SDK** — Multi-provider AI generation
- **chalk** / **ora** — Terminal styling and spinners
- **Postiz API** — Social media scheduling
- **Coda API** — Document/brief fetching
