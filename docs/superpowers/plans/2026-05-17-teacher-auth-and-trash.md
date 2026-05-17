# Teacher Auth And Trash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add teacher registration, per-teacher data isolation, soft deletion, trash recovery, and 5-day cleanup for courses.

**Architecture:** Extend the existing SQLite schema with classroom soft-delete metadata, add auth and trash endpoints to Express, enforce teacher ownership on every classroom query, and update the teacher SPA with Chinese registration and trash-management views.

**Tech Stack:** Node.js, Express, SQLite, vanilla HTML/CSS/JavaScript, Node test runner.

---

### Task 1: Auth And Ownership
- Add failing tests for registration, duplicate usernames, and cross-teacher classroom isolation.
- Implement registration and ownership-aware classroom queries.
- Verify server tests pass.

### Task 2: Trash Lifecycle
- Add failing tests for soft delete, blocked joins, restore, and cleanup behavior.
- Implement `deleted_at`, trash listing, restore, and cleanup logic.
- Verify server tests pass.

### Task 3: Teacher UI
- Update smoke tests for Chinese auth and trash UI markers.
- Add registration toggle, delete controls, and trash view to teacher page.
- Verify all tests and manually inspect page behavior.

### Task 4: Release
- Update README.
- Commit, push, and deploy latest code to the ECS server.
