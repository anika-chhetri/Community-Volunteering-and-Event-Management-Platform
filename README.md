NGO Management System

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

