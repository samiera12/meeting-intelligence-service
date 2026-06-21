# AI Approach

This document explains how meeting analysis is generated, how grounding is enforced, and what the known limitations are.

## Provider & Model

- **Provider:** Google Gemini
- **Model:** `gemini-2.5-flash`
- **Endpoint:** `generateContent` via the Gemini REST API
- **Generation config:** `temperature: 0.2` (low, to favor consistent/factual extraction over creative variation), `responseMimeType: 'application/json'` (forces the model to return structurally valid JSON rather than free text wrapped in markdown)

## Prompt Design

The prompt is built in two parts, sent together as a single user message:

1. **Rules block** — explicit, numbered constraints placed *before* the transcript, so the model's first instructions are about behavior, not content:
   - Only use information explicitly stated in the transcript
   - Every item must include at least one citation referencing an exact `[timestamp]`
   - If no evidence exists for a claim, omit it entirely rather than guessing
   - Return only valid JSON — no prose, no markdown fences

2. **Transcript block** — the full transcript, reformatted as `[timestamp] Speaker: text` lines, so each line is unambiguously tied to a citable timestamp the model can reference.

3. **Output schema** — an exact JSON shape is given in the prompt (`summary`, `actionItems`, `decisions`, `followUps`, each an array of `{ text/task, citations: [{ timestamp }] }`), so the model has a concrete template to fill rather than inventing its own structure.

This ordering (rules → schema → transcript → final reminder) was chosen because instruction-following models generally weight instructions placed close to the actual task more heavily — the final line of the prompt repeats the core constraint ("cite only timestamps that appear above") immediately before generation.

## Citation Strategy

Every generated item — summary point, action item, decision, or follow-up — must carry a `citations` array of `{ timestamp }` objects referencing the transcript. This satisfies the assignment's grounding requirement directly: nothing is presented to the user without a traceable source line.

Citations are surfaced at every layer:
- Stored in `meeting_analyses` (JSONB columns: `summary`, `action_items`, `decisions`, `follow_ups`)
- Copied onto the corresponding `action_items` row when an action item is auto-created from analysis, so the citation travels with the item even after the original analysis record is updated

## Hallucination Prevention

Three layers of defense:

**1. Prompt-level constraints.** The system rules explicitly forbid inventing attendees, action items, decisions, or outcomes, and instruct the model to omit anything it cannot support with a citation.

**2. Low temperature.** `temperature: 0.2` reduces the model's tendency toward creative embellishment, favoring the most likely (and typically most literal) interpretation of the transcript.

**3. Citation validation (automated, post-generation).** This is the most important safeguard, because it doesn't rely on the model's compliance — it's enforced in code regardless of what the model returns:

```typescript
const validTimestamps = new Set(transcript.map((t) => t.timestamp));

const validateCitations = (items) =>
  items.map((item) => ({
    ...item,
    citations: item.citations.filter((c) => validTimestamps.has(c.timestamp)),
  }));
```

Every citation timestamp returned by the model is checked against the actual set of timestamps present in the submitted transcript. Any citation pointing to a timestamp that doesn't exist in the transcript is silently dropped (and logged as a warning) before the analysis is saved. This means even if the model fabricates a timestamp, that fabricated citation never reaches the stored data — though the surrounding text claim itself is not independently re-verified, this is the known limitation below.

## Output Validation Strategy

- The raw model response is stripped of markdown code fences (defensive — `responseMimeType: json` should prevent this, but the strip is kept as a safety net) before `JSON.parse`.
- If parsing fails, the request fails cleanly with a `503 AI_PARSE_ERROR` rather than saving malformed data.
- If the Gemini API call itself fails (rate limit, network, invalid key), the request fails with `503 AI_SERVICE_ERROR` — the meeting record itself is untouched, so a failed analysis attempt never corrupts existing data.

## Known Limitations

- **Citation timestamp validation, not full claim verification.** The system confirms every cited timestamp genuinely exists in the transcript, but does not run a second-pass semantic check confirming the *prose* of each summary/decision/action item is a fully accurate paraphrase of that specific line. The prompt's explicit grounding rules are the primary defense against this; the timestamp check is a hard, automated backstop against outright timestamp fabrication.
- **No test database.** Tests run against the same Postgres instance as development, by design for this assignment's scope. Production deployments would isolate test data.
- **No retry/backoff on Gemini API failures.** A single failed call surfaces immediately as an error rather than retrying — acceptable for this assignment, but a production system would add exponential backoff for transient failures (e.g. rate limits).
- **Single-pass analysis.** Each call to `/analyze` re-runs the full transcript through the model; there's no incremental/streaming analysis for very long transcripts (token limits on `gemini-2.5-flash` are generous — 1M input tokens — so this wasn't a practical concern at this scale).
