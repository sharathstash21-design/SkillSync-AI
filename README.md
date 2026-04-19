🦁 SkillSync AI | Enterprise Learning & Task ERP
Built for the Google Gen AI Academy APAC 2026

SkillSync AI is a professional workforce management tool designed for digital agencies (like NUERA). It bridges the gap between AI Strategy and Human Execution by using Gemini 3 Flash to generate personalized, high-density work plans.

🏗️ Technical Architecture
I implemented a Decoupled Headless Architecture to ensure high performance and scalability:

AI Engine: Google Gemini 3 Flash (JSON mode) for structured task generation.

Cloud Backend: Google Apps Script acting as an API Bridge (RESTful endpoints).

Database: Google Sheets used as a relational database for Task Tracking and Identity Management.

Frontend: Mobile-responsive UI built with Tailwind CSS, hosted on GitHub Pages.

Monitoring: Desktop Assistant built in Google Antigravity using Python.

🌟 Exclusive "Scientist" Features
1. Self-Healing Database (Scientist.gs)
The system features an automated environment setup. On the first execution, the script detects the spreadsheet state and auto-configures headers, formatting, and protections.

2. Antigravity Desktop Monitor (assistant.py)
A custom Python tool that pings the Google Cloud API every few seconds to provide agency owners with a real-time progress bar of the entire workforce's completion rate.

3. Decoupled Identity Bridge
Unlike standard Apps Script apps, SkillSync AI uses a custom Fetch-based bridge to allow a GitHub-hosted website to securely read and write to Google Sheets.

🔗 Project Ecosystem
Live Preview: https://sharathstash21-design.github.io/SkillSync-AI/

Backend API: [PASTE_YOUR_APPS_SCRIPT_EXEC_LINK_HERE]

Database (View Only): https://docs.google.com/spreadsheets/d/1NnsRW4WuKNObuZ3ZK-hqjmA3Z2iRLUMmuTHa5VPxXT8/edit?gid=130902396#gid=130902396
