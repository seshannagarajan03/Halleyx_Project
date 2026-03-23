# 🚀 FlowPilot  
### Rule-Driven Workflow Automation Platform

FlowPilot is a full-stack workflow automation platform developed for the **Halleyx Full Stack Engineer Challenge**. It enables users to design, execute, and monitor dynamic business workflows using configurable steps and rule-based routing.

The system simulates real-world approval workflows such as expense approvals and leave requests with full execution tracking, approval control, and audit logging.

---

## 📌 Project Overview

FlowPilot automates manual business processes by:
- defining workflows dynamically  
- configuring steps and conditional rules  
- executing workflows using structured JSON inputs  
- pausing execution for approvals  
- resuming or retrying workflows  
- maintaining complete execution logs and audit history  

---

## ✨ Key Features

- JWT-based authentication  
- Workflow, Step, Rule CRUD  
- Rule engine with priority & DEFAULT fallback  
- Workflow execution engine  
- Approval pause/resume  
- Retry & cancel execution  
- Execution logs & audit history  
- Search, filter, pagination  
- Pre-seeded demo workflows  

---

## ⚙️ Tech Stack

Frontend: React, Vite, React Query, Redux Toolkit, Axios  
Backend: Node.js, Express, MongoDB, Mongoose, Socket.io, Winston  

---

## ▶️ Setup Instructions

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

## 🔐 Demo Credentials

Admin: admin@flowpilot.app / password123  
Manager: manager@flowpilot.app / password123  

---

## 🎬 Demo Video

./Flowpilot Project Demo.mp4

---

## 👨‍💻 Author

Seshan Nagarajan
