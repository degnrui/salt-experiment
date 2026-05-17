# Teacher Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple teacher dashboard with a login-gated course workspace, modal course creation, and task-grouped per-group classroom detail views.

**Architecture:** Extend the existing Express/SQLite schema with a simulation field on classrooms, enrich dashboard payloads with per-group error summaries, and rebuild `public/teacher.html` as a multi-view single page. Keep student submission payloads unchanged while deriving red-highlight metadata on the teacher client from existing validation results.

**Tech Stack:** Node.js, Express, SQLite, vanilla HTML/CSS/JavaScript, Node test runner.

---

### Task 1: Course Metadata API

**Files:**
- Modify: `src/db.js`
- Modify: `src/server.js`
- Modify: `test/server.test.js`

- [ ] Add failing tests for `simulationType`, `simulationLabel`, and `groupCount` in classroom create/list responses.
- [ ] Run `npm test -- test/server.test.js` and verify the new assertions fail.
- [ ] Add `simulation_type` migration/default handling and return normalized classroom fields.
- [ ] Run `npm test -- test/server.test.js` and verify green.

### Task 2: Dashboard Group Statistics

**Files:**
- Modify: `src/server.js`
- Modify: `test/server.test.js`

- [ ] Add failing tests proving dashboard groups include per-task error counts.
- [ ] Run `npm test -- test/server.test.js` and verify failure.
- [ ] Compute `errorStatsByTask` for each group and include it in the dashboard response.
- [ ] Run the server tests and verify green.

### Task 3: Teacher Workspace UI

**Files:**
- Modify: `public/teacher.html`
- Modify: `public/app.css`
- Modify: `test/server.test.js`

- [ ] Add static smoke assertions for course-space markers, modal create form, and detail containers.
- [ ] Run `npm test -- test/server.test.js` and verify failure.
- [ ] Rebuild the teacher page into login, workspace, modal, and course-detail views.
- [ ] Render classroom cards, grouped task sections, Chinese labels, expandable group panels, and inline red field highlighting.
- [ ] Run tests and manually inspect the teacher page locally.

### Task 4: Documentation and Demo Cleanup

**Files:**
- Modify: `README.md`
- Keep: `teacher-demo.html`

- [ ] Update README to describe the new teacher workflow.
- [ ] Run `npm test`.
- [ ] Commit spec, demo, implementation, and docs.
- [ ] Push `main` to GitHub.
