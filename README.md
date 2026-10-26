Community Volunteering and Event Management Platform

This is a minimal NGO Management System (frontend + backend) example using:
- Backend: Node.js + Express + MySQL
- Frontend: React

Features:
- Navbar with Home, About Us, Events, Login, Register
- Role-based login/register (Admin, NGO, Volunteer/Donor)
- Admin can only login via "Login as Admin" (no register)
- Dashboards per role with recognition/badges, feedback/reports
- Volunteer/Donor dashboard includes donation and volunteering actions
- Simple rule-based chatbot with clickable suggestions

Setup used (Windows PowerShell):

1. MySQL-

sql-
cd C:\NGO
mysql> -u root -p < sql\create_ngo_db.sql


2. Backend-


cd C:\NGO\backend
npm install
node seeder.js
node index.js

3. Frontend-


cd C:\NGO\frontend
npm install
npm start


Default backend runs on `http://localhost:4000` and frontend `http://localhost:3000`.

Demo admin user (created by `seeder.js`):

- Email: `admin@ngo.local`
- Password: `adminpass`

Results-
<img width="1879" height="896" alt="Screenshot 2025-12-08 193118" src="https://github.com/user-attachments/assets/05f55e39-e9b8-471c-aa73-3aeb25c65325" />

<img width="1893" height="907" alt="Screenshot 2025-12-08 193852" src="https://github.com/user-attachments/assets/40bfa0fa-620a-49d5-8324-d48cbfdcfb6c" />

<img width="1898" height="910" alt="Screenshot 2025-12-06 203904" src="https://github.com/user-attachments/assets/c6185ca7-5285-4b25-9d0f-94ab515de7e3" />

<img width="1896" height="909" alt="Screenshot 2025-12-06 203705" src="https://github.com/user-attachments/assets/dc92a38f-670f-4282-bb33-9104223844b8" />

<img width="1903" height="908" alt="Screenshot 2025-12-06 203733" src="https://github.com/user-attachments/assets/234ead51-4015-40ce-bdf6-ee7ff88aa54d" />


