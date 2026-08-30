# RoninPLEX v2.1.0 — Security, Reliability & Operations

## 1. Security Principles

- Never commit API keys or credentials.
- Never expose secrets in logs.
- Treat provider content as untrusted external input.
- Validate URLs and external inputs at appropriate trust boundaries.
- Keep embedded/iframe permissions minimal.
- Preserve sandboxing where it is required for provider compatibility.
- Do not weaken security controls solely to make a provider work.

## 2. Data Safety

Before destructive commands or migrations:

1. identify the target;
2. determine whether the operation is reversible;
3. obtain explicit user confirmation for irreversible deletion;
4. preserve backups or recovery paths when appropriate.

The accidental-data-loss-prevention skill should be treated as a mandatory guardrail.

## 3. Reliability

Playback must be resilient to:

- transient network failures;
- provider timeouts;
- missing metadata;
- invalid episode mappings;
- unavailable streams;
- blocked embeds.

The application should recover without requiring a full process restart when feasible.

## 4. Performance

Measure before/after for significant performance work.

Watch:

- startup time;
- initial content readiness;
- memory use;
- playback stability;
- unnecessary rerenders;
- network request volume;
- image loading;
- long-running sessions.

## 5. Diagnostics

Logs should make provider/playback failures actionable without exposing credentials.

Useful fields include:

- media type;
- provider;
- operation;
- failure category;
- retry count;
- player mode.

## 6. Release Risk

Highest-risk v2.1.0 areas:

1. anime provider/player controls;
2. player abstraction changes;
3. iframe/embed behavior;
4. fullscreen/PiP state transitions;
5. settings migration;
6. broad UI component changes.

These areas require extra regression coverage.
