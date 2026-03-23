#  FlowPilot  
### Rule-Driven Workflow Automation Platform

FlowPilot is a full-stack workflow automation platform developed for the Halleyx Full Stack Engineer Challenge. It enables users to design, execute, and monitor dynamic business workflows using configurable steps and rule-based routing.

The system simulates real-world approval workflows such as expense approvals and leave requests with full execution tracking, approval control, and audit logging.

---

##  Project Overview

FlowPilot is designed to automate manual business processes by:
- defining workflows dynamically  
- configuring steps and conditional rules  
- executing workflows using structured JSON inputs  
- pausing execution for approvals  
- resuming or retrying workflows  
- maintaining complete execution logs and audit history  

---

##  Key Features

- JWT-based authentication with role-based access  
- Workflow CRUD (Create, Read, Update, Delete)  
- Step CRUD and Rule CRUD  
- Rule engine with priority ordering and DEFAULT fallback  
- Workflow execution engine  
- Approval pause and resume  
- Retry failed executions  
- Cancel active executions  
- Execution logs and audit history  
- Search, filter, pagination  
- Pre-seeded demo workflows and users  

---

##  Tech Stack

### Frontend
- React  
- Vite  
- React Query  
- Redux Toolkit  
- Axios  
- Socket.io Client  

### Backend
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  
- Socket.io  
- Winston Logger  

---

##  System Architecture

Frontend (React)  
↓  
Backend (Node.js + Express)  
↓  
MongoDB Database  

---

##  Project Structure

flowpilot/
├── backend/
├── frontend/
├── Dockerfile
└── README.md

---

##  Setup Instructions

### Backend

cd backend  
cp .env.example .env  
npm install  
node seed.js  
npm run dev  

### Frontend

cd frontend  
cp .env.example .env  
npm install  
npm run dev  

---

##  Demo Credentials

Admin  
admin@flowpilot.app / password123  

Manager  
manager@flowpilot.app / password123  

---

##  Sample Workflows

### Expense Approval

Required Fields:
- employee_name  
- employee_email  
- department  
- expense_type  
- amount  
- country  
- priority  
- submitted_at  

Logic:
- amount > 100 → approval  
- DEFAULT → notification  

---

### Leave Request Approval

Required Fields:
- employee_name  
- employee_email  
- department  
- leave_type  
- leave_days  
- country  
- priority  
- submitted_at  

Logic:
- leave_days > 3 → approval  
- DEFAULT → notification  

---

##  Execution Flow

1. Start workflow  
2. Create execution  
3. Evaluate rules  
4. Route to next step  
5. Pause on approval  
6. Resume after approval  
7. Trigger notification  
8. Complete execution  
9. Store logs in audit history  

---

##  API Overview

POST /api/auth/register  
POST /api/auth/login  

GET /api/workflows  
POST /api/workflows  
GET /api/workflows/:id  
PUT /api/workflows/:id  
DELETE /api/workflows/:id  

GET /api/workflows/:workflow_id/steps  
POST /api/workflows/:workflow_id/steps  

PUT /api/steps/:id  
DELETE /api/steps/:id  

GET /api/steps/:step_id/rules  
POST /api/steps/:step_id/rules  

PUT /api/rules/:id  
DELETE /api/rules/:id  

POST /api/workflows/:workflow_id/execute  
GET /api/executions  
GET /api/executions/:id  

POST /api/executions/:id/resume  
POST /api/executions/:id/retry  
POST /api/executions/:id/cancel  

---

##  Demo Video

[Watch Demo](./Flowpilot Project Demo.mp4)

---

##  Notes for Evaluation

- Updating a workflow creates a new version  
- Previous versions are deactivated  
- Rules are validated before save  
- DEFAULT rule used as fallback  
- Deletion blocked for workflows with execution history  

---

##  Submission Hygiene

This repository excludes:
- .env files  
- node_modules  
- runtime logs  

---

##  Future Enhancements

- Email/SMS notifications  
- Drag-and-drop workflow builder  
- Role-based access control  
- SLA tracking  
- Analytics dashboard  
- Multi-tenant support  

---

##  Author

Seshan Nagarajan  
