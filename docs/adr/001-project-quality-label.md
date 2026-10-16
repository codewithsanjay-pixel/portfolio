# ADR 001: "Quality" instead of "Result" when there is no stated outcome

Date: 2026-10-08
Status: accepted

## Context
SPEC.md says each project shows: problem, what I built, what I owned, result. For the Enterprise Knowledge Assistant, the resume describes a method (prompt engineering and evaluation to reduce irrelevant or incorrect answers), not a measured outcome. No outcome numbers are approved. A "Result" label would suggest more than the resume supports.

## Decision
When a project has no confirmed outcome, its fourth item is labelled "Quality" and describes how answer quality was checked or improved. "Result" is used only when the resume states an actual outcome.

## Consequences
The spec's fourth project item is either "Result" or "Quality", depending on what the resume supports. The consistency-auditor should treat both labels as valid.
