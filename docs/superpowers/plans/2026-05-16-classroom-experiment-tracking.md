# Classroom Experiment Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable classroom web app where students join by group code, submit every experiment design attempt, and teachers review full histories plus class-level statistics.

**Architecture:** Use a small Node.js/Express application with SQLite persistence. Keep domain logic in reusable server modules, expose JSON APIs for teachers and students, and serve separate static student and teacher pages from `public/`.

**Tech Stack:** Node.js, Express, SQLite via `better-sqlite3`, vanilla HTML/CSS/JavaScript, Node test runner.

---

## File Map

- `package.json`: application scripts and dependencies.
- `src/db.js`: SQLite initialization and prepared statement helpers.
- `src/validation.js`: shared submission validation and error classification.
- `src/server.js`: Express app, auth, classroom, join, submission, and dashboard routes.
- `public/index.html`: student group-code entry page.
- `public/student.html`: student experiment UI adapted from the current prototype.
- `public/teacher.html`: teacher login, classroom creation, and dashboard UI.
- `public/app.css`: shared visual styling.
- `test/validation.test.js`: domain-rule tests.
- `test/server.test.js`: API and persistence tests.
- `README.md`: setup, teacher flow, deployment notes.

### Task 1: Domain Validation

**Files:**
- Create: `src/validation.js`
- Create: `test/validation.test.js`

- [ ] **Step 1: Write failing tests** for correct stir submissions and all supported error categories.
- [ ] **Step 2: Run** `npm test -- test/validation.test.js` and verify failure because `src/validation.js` does not exist.
- [ ] **Step 3: Implement** `evaluateSubmission(submission)` returning `{ isCorrect, errorTypes }`.
- [ ] **Step 4: Run** `npm test -- test/validation.test.js` and verify green.

### Task 2: Persistence Layer

**Files:**
- Create: `src/db.js`
- Create: `test/server.test.js`

- [ ] **Step 1: Write failing API-level tests** that expect teachers, classrooms, groups, and submissions to persist.
- [ ] **Step 2: Run** `npm test -- test/server.test.js` and verify failure because the app layer is missing.
- [ ] **Step 3: Implement** SQLite schema creation and repository helpers for teachers, classrooms, groups, joins, submissions, and dashboard queries.
- [ ] **Step 4: Re-run** the persistence tests and keep them failing only on missing routes.

### Task 3: HTTP API

**Files:**
- Create: `src/server.js`
- Modify: `test/server.test.js`

- [ ] **Step 1: Extend failing tests** for teacher login, classroom creation, group-code join, submission creation, submission history, and dashboard statistics.
- [ ] **Step 2: Run** `npm test -- test/server.test.js` and verify route failures.
- [ ] **Step 3: Implement** Express middleware, cookie-based teacher sessions, all JSON routes, and backend-side submission evaluation.
- [ ] **Step 4: Run** `npm test -- test/server.test.js` and verify green.

### Task 4: Student Experience

**Files:**
- Create: `public/index.html`
- Create: `public/student.html`
- Create: `public/app.css`
- Reuse source material from: `课前版.html`

- [ ] **Step 1: Add static smoke tests** in `test/server.test.js` for loading `/`, `/student.html`, and required DOM markers.
- [ ] **Step 2: Run** `npm test -- test/server.test.js` and verify failure before static routes/pages exist.
- [ ] **Step 3: Implement** join-code entry and migrate the existing experiment page so `确认设计` posts submissions and displays backend feedback.
- [ ] **Step 4: Run** `npm test -- test/server.test.js` and verify static smoke tests pass.

### Task 5: Teacher Dashboard

**Files:**
- Create: `public/teacher.html`
- Modify: `public/app.css`
- Modify: `test/server.test.js`

- [ ] **Step 1: Add failing smoke tests** for the teacher page and dashboard endpoint payload shape.
- [ ] **Step 2: Run** `npm test -- test/server.test.js` and verify failure.
- [ ] **Step 3: Implement** login, classroom creation, polling refresh, summary cards, per-task stats, error counts, and full per-group submission history.
- [ ] **Step 4: Run** `npm test -- test/server.test.js` and verify green.

### Task 6: Packaging and Verification

**Files:**
- Create: `package.json`
- Create: `README.md`

- [ ] **Step 1: Add scripts** for `start` and `test`, plus setup documentation.
- [ ] **Step 2: Run** `npm test`.
- [ ] **Step 3: Run** the server locally and verify the full student-to-teacher flow manually in a browser.
- [ ] **Step 4: Initialize Git, add the GitHub remote, commit, and push to `https://github.com/degnrui/salt-experiment.git`.
