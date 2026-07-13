# Blog post: the move to cognee — resume notes

Status: discussion stage. Memory pulled, angle NOT yet chosen. Pick up by deciding the 3 open questions at the bottom, then draft (use the `vintagetechie-voice` skill for the draft).

Parked title idea already in memory: **"I gave my AI a memory that remembers being built."**

---

## The story (synthesized from claude-mem + cognee, 2026-06-16/17)

**Real arc:** not "switched to cognee" — built a *second, deeper* memory layer.

- **Predecessor:** cognee replaced a fragile earlier experiment, **mempalace**. claude-mem was never dropped.
- **Two-tier architecture:**
  - **claude-mem** = live/fast layer. Auto-injects recent context at session start. Recency-ordered, gets current facts right.
  - **cognee** = deep knowledge graph. Full transcripts, cross-project, multi-hop. Lags — only ingests *after* a session ends.
  - `memory-router` skill routes recall to one or both.
- **Governing constraint:** Pro subscriptions, **no metered API keys** → everything fully local, zero per-token cost. Drives every hard choice (local inference, VRAM warm/sleep dance, accepting slowness).

**Setup:**
- cognee 1.1.2, Python 3.14, ECL pipeline (Extract → Cognify → Load). Graph traversal chosen over flat vectors for cross-project multi-hop recall.
- Inference started on **LAN laptop** (`192.168.1.34`, 8GB, qwen 7B) to spare the desktop GPU → **migrated to local desktop** (RTX 4070 SUPER 12GB, qwen2.5 **14B**-instruct, nomic-embed embedder). Killed the LAN-hop failure mode + preflight dependency.
- Wrapped as an **MCP server** (`/claude/cognee-memory/mcp_server.py`) so memory is a native tool, not a CLI call.
- `cognee-warm [dur]` / `cognee-sleep` scripts manage ~10GB VRAM so the desktop can still game.
- Full re-cognify at 14B: `DONE in 14.9m | processed=38 skipped=21 errors=0`.

**Best war story — ingestion reliability:**
- Old offset-save was a non-atomic full-file overwrite. A torn/interrupted write got swallowed as `{}` by `load_offsets` → **silently erased 5 of 7 vintagetechie sessions.**
- Fix: atomic merge-write — re-read on-disk state, `merged.update(o)`, write to per-PID temp file, `os.fsync`, then `os.replace` (atomic rename). Workers flock-serialized.
- Added **SessionStart catch-up sweep** (`cognee-catchup.sh`): compares each transcript line count vs recorded offset, re-ingests anything behind (orphans from a missed SessionEnd). Self-heals at both ends. Live-validated: found 1 behind, backfilled 174→255 in 87s.

**Honest unsolved problem — supersession / density bias:**
- cognee's graph is purely additive — no concept of a retracted/superseded fact.
- After host migration, recall STILL narrates the old laptop as inference host. Why: migration transcript says "laptop" 97× vs desktop 44×; graph traversal lands on the denser (stale) cluster. Frequency bias, not just timing.
- claude-mem gets it right (recency); cognee structurally can't.
- Both obvious fixes are bad: corrective note gets drowned (1 node vs 97-mention cluster); node pruning is destructive + cognee may not support clean deletion.
- Preferred fix (parked): delete the one offending session's dataset, re-ingest a condensed/corrected version where desktop dominates + laptop appears only as "(prior host, migrated away)."
- Same density mechanism makes `search_graph` (GRAPH_COMPLETION) drift to off-topic clusters → memory-router now has the **main model** author synthesized answers, never search_graph. (search_graph famously kept returning "replace claude-mem with mempalace" drift text for unrelated queries.)
- Model size was NOT the cause — 14B still drifted. Bottleneck is graph quality from cognify, not LLM size.

---

## Open decisions (answer these to resume)

1. **Angle / spine** — options floated:
   - (a) "Memory that remembers being built" — reflective/meta, the parked idea.
   - (b) Two-layer local memory, zero API cost — practical build log, self-hoster appeal.
   - (c) War stories: the bugs that ate my memory — lead with dropped-5-of-7 + supersession.
   - (d) The graph that won't forget the old host — supersession as the interesting unsolved problem.
   - (My lean: a hybrid of (a) framing + (c) concrete spine + (d) honest ending. Confirm in AM.)
2. **Depth** — show the code / concepts only / mixed (concept-led with snippets at the bug + fix).
3. **Supersession problem in or out** — feature it / footnote / save for follow-up.

## Next action on resume
Confirm 1–3 above → invoke `vintagetechie-voice` skill → draft. Site is Astro; check existing post format/frontmatter before writing the file.
