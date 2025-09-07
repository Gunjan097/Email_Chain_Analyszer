# 📧 Email Receiver Project

A full-stack project that connects to an IMAP email server, retrieves incoming emails, stores them in MongoDB, and displays them in a user-friendly frontend interface.  
This project helps visualize and manage emails with search & filter functionality.

---

## 🚀 Features

- **IMAP Polling** – Automatically fetches latest emails from your inbox.
- **NestJS Backend** – Provides REST APIs to fetch and filter emails.
- **MongoDB Storage** – Emails are stored persistently for querying.
- **React Frontend** – User interface to view, search, and filter emails.

---

## 🛠️ Tech Stack

- **Backend**: NestJS, Node.js, TypeScript  
- **Database**: MongoDB  
- **Frontend**: React 
- **Email Protocol**: IMAP  

---

## 📂 Project Structure

```
email-receiver-project/
│── backend/          # NestJS backend
│   ├── src/
│   └── package.json
│
│── frontend/         # React frontend
│   ├── src/
│   └── package.json
│
│── docker-compose.yml
│── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/email-receiver-project.git
cd email-receiver-project
```

### 2️⃣ Configure Environment
Create `.env` files inside `backend/` and `frontend/`:

**Backend `.env`:**
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
MONGO_URI=mongodb://localhost:27017/emaildb
PORT=3000
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:3000
```

### 3️⃣ Run with Docker
```bash
docker-compose up --build
```

### 4️⃣ Run Locally (Dev Mode)
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm start
```

---

## 🔥 API Endpoints

### Get test emails
```
GET /emails
```
---

## 🖼️ Screenshots

### Frontend Dashboard
![Frontend UI](docs/frontend.png)

### API Response Example
```json
{
  "from": "example@gmail.com",
  "subject": "Test Email",
  "date": "2025-09-07T12:00:00Z",
  "body": "This is a test email."
}
```

---

## 🤝 Contribution

1. Fork the repo  
2. Create a new branch (`feature-x`)  
3. Commit your changes  
4. Open a Pull Request  

---

