# FlowPilot

FlowPilot is a rule-driven workflow automation platform built for the Halleyx Full Stack Engineer challenge. It lets users create workflows, define steps and rules, execute workflows from JSON payloads, pause for approvals, resume or retry failed flows, and inspect execution logs in real time.

## Core features
- Workflow CRUD with pagination, search, and versioning
- Step CRUD and rule CRUD
- Rule evaluation with priority ordering and `DEFAULT` fallback
- Execution engine supporting task, approval, and notification steps
- Resume pending approvals, retry failed executions, and cancel active executions
- Execution history and audit log view
- JWT authentication with role-based access control
- Seeded demo users and workflows for reviewer testing

## Tech stack
- **Frontend:** React, Vite, React Query, Redux Toolkit, Axios, Socket.io Client
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, Winston
- **Testing:** Jest unit tests for the rule engine and validation logic

## Project structure
```text
flowpilot/
├── backend/
├── frontend/
├── Dockerfile
├── README.md
└── SUBMISSION_CHECKLIST.md
```

## Setup
### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
node seed.js
npm run dev
```

### 2) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Demo credentials
- **Admin:** `admin@flowpilot.app` / `password123`
- **Manager:** `manager@flowpilot.app` / `password123`

## Sample workflows
### Expense Approval
Required payload fields:
- `employee_name`
- `employee_email`
- `department`
- `expense_type`
- `amount`
- `country`
- `priority`
- `submitted_at`

Flow logic:
- if `amount > 100`, manager approval is required
- otherwise the workflow finishes after notification

### Leave Request Approval
Required payload fields:
- `employee_name`
- `employee_email`
- `department`
- `leave_type`
- `leave_days`
- `country`
- `priority`
- `submitted_at`

Flow logic:
- if `leave_days > 3`, manager approval is required
- otherwise HR notification completes the workflow

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/workflows`
- `POST /api/workflows`
- `GET /api/workflows/:id`
- `PUT /api/workflows/:id`
- `DELETE /api/workflows/:id`
- `GET /api/workflows/:workflow_id/steps`
- `POST /api/workflows/:workflow_id/steps`
- `PUT /api/steps/:id`
- `DELETE /api/steps/:id`
- `GET /api/steps/:step_id/rules`
- `POST /api/steps/:step_id/rules`
- `PUT /api/rules/:id`
- `DELETE /api/rules/:id`
- `POST /api/workflows/:workflow_id/execute`
- `GET /api/executions`
- `GET /api/executions/:id`
- `POST /api/executions/:id/resume`
- `POST /api/executions/:id/retry`
- `POST /api/executions/:id/cancel`

## Manual demo flow
1. Log in with the seeded admin account.
2. Open **Workflow Library**.
3. Create a workflow or edit an existing one.
4. Add steps and rules.
5. Open **Execute** for a workflow and start an execution with valid payload values.
6. Resume approval when the workflow pauses.
7. Open **Execution History** and inspect the logs.

## Notes for evaluation
- Updating a workflow creates a **new version** and deactivates the previous one.
- Rules are validated before save.
- Invalid rule evaluation errors are logged and `DEFAULT` fallback is used when configured.
- Deletion is blocked for workflows that already have execution history.

## Submission hygiene
This cleaned package intentionally excludes:
- `.env` files with secrets
- `node_modules`
- runtime log files
