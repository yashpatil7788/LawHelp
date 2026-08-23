
# LawHelp - AI-Powered Legal Assistant

**LawHelp** is a one-stop legal solution designed to simplify the legal process for individuals, professionals, and communities. The platform integrates AI for legal guidance, document understanding, lawyer discovery, and case monitoring.

## 🚀 Local Preview
Run the frontend locally at `http://localhost:5173`.

---

## 🧠 Features

- 💬 **AI Chatbot Legal Assistant** – Conversational AI (powered by Gemini) to answer legal queries in simple language.
- 📄 **Document Analyzer** – Upload legal documents and receive summarized explanations in your local language.
- 🧑‍💼 **Smart Lawyer Search** – Find lawyers based on practice area, location, experience, and gender using Leaflet, OpenStreetMap, and Geoapify.
- 🗂 **Legal Document Repository** – Explore a collection of commonly used legal documents.
- 🧾 **User Dashboard** – Personalized space for users to manage chats, uploads, and lawyer interactions.
- 🏗 **Future Roadmap** – Document generation, real-time lawyer chat, virtual court guidance, and more.

---

## 🛠 Tech Stack

| Frontend | Backend | AI/ML | Storage/Auth | External APIs |
|---------|--------|--------|--------------|----------------|
| React 18 + Vite | Flask | Gemini API | Supabase Auth | Geoapify |
| Tailwind CSS | Python services | LangChain | Supabase PostgreSQL | OpenStreetMap |
| Leaflet + React Leaflet | Gunicorn | Pinecone | Supabase Storage | Google APIs |

---

## 📁 Folder Structure
```
root/
├── frontend/         # React frontend with Vite, Tailwind CSS, and Leaflet
├── ML/               # Flask AI services and machine learning scripts
├── supabase/         # PostgreSQL schema, RLS, and Storage policies
├── public/           # Production frontend build output
└── README.md

```

---

## ⚙️ Local Setup Instructions

Create `frontend/.env.local` with your Supabase project URL and publishable key, then run the SQL in `supabase/schema.sql` from the Supabase SQL Editor. Enable Email authentication in Supabase. For Google sign-in, enable the Google provider and add `http://localhost:5173` as a redirect URL.

Follow these simple steps to set up the project locally:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/lawhelp.git

# 2. Navigate into the cloned directory
cd lawhelp

# 3. Start the AI Document Analyser (ML service 1)
cd ML/AI_DOC_ANALYSER
python app.py

# 4. In a new terminal/tab, start the LawBot (ML service 2)
cd ML/CHATBOT/law
python app.py

# 5. In another terminal/tab, start the frontend
cd lawhelp/frontend
npm install
npm run dev

```

🌐 The app will now be running on `http://localhost:5173` (or another port if 5173 is in use).

---

## 📦 Requirements

- Supabase Project (Auth, PostgreSQL tables, Storage enabled)
- API Key for Gemini (Gemini Pro / Gemini 1.5)
- Pinecone vector database API Key
- Geoapify API Key

---

## 🌟 Contribution

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 🔐 License

Distributed under the MIT License. See `LICENSE` for more information.

---


## 📎 Links

- 🔗 [GitHub Repository](https://github.com/yashpatil7788/lawhelp)
- 📽 [Demo Video (3 mins)]()
- 🌐 [Live MVP]()
