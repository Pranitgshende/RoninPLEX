# RoninPLEX v2.1.0 — GSD Import & Planning Guide

## Purpose

This document tells GSD how to replace the historical v2.0.0 product planning state with the v2.1.0 source of truth while preserving the current codebase map.

## Source-of-Truth Order

1. Current RoninPLEX codebase
2. This v2.1.0 document pack
3. Existing codebase analysis in `.planning/codebase/`
4. Historical v2.0.0 PRD only for context
5. New GSD-generated roadmap/phase plans

If historical v2.0.0 content conflicts with v2.1.0 requirements, v2.1.0 wins.

## Required GSD Actions

1. Ingest the v2.1.0 PRD.
2. Reconcile requirements and architectural decisions.
3. Regenerate the roadmap around v2.1.0.
4. Preserve useful codebase mapping documents.
5. Recalculate dependencies and phase success criteria.
6. Verify that deferred v2.1.1 work is not pulled into v2.1.0.
7. Only then begin phase discussion/planning.

## Planning Constraints

- Do not start implementation merely because the old roadmap has a ready phase.
- Do not perform a broad rewrite without a v2.1.0 requirement.
- Do not merge multiple user profiles into v2.1.0.
- Do not expand core settings into the full advanced customization roadmap.
- Do not replace provider-specific playback paths with a universal abstraction unless verification proves it safe.

## Recommended Phase Shape

The exact phase count should be determined by GSD after ingesting the new documents, but the logical dependency chain is:

1. architecture/reliability foundations;
2. playback and anime capabilities;
3. discovery/detail and UI system;
4. core settings/customization;
5. verification/release hardening.

GSD may combine or split these based on the actual codebase.

## Verification Expectations

Every phase should have:

- explicit requirements;
- measurable success criteria;
- implementation scope;
- verification commands/flows;
- rollback considerations;
- dependency notes.

## Handoff

After importing this pack, run the GSD ingestion/reconciliation flow and inspect the regenerated dashboard before allowing implementation.
