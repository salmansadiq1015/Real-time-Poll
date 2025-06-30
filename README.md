
# 🗳️ Real-time Polling Application (React + Supabase)

A robust, real-time polling platform built with **React 18 + TypeScript** and **Supabase**, allowing users to create, vote, and visualize polls with instant updates. Designed as a lightweight clone of Strawpoll/Mentimeter with support for authenticated and anonymous participation.

---

## 📌 Project Overview

This project delivers a **real-time polling system** with the following goals:

- 🔐 Authenticated poll creation via Supabase Auth
- 🧑 Anonymous & user-based voting
- 📈 Real-time vote updates and viewer presence tracking
- 📊 Live results with bar chart visualization
- 🔗 Shareable poll links, responsive UI, and optimized performance

> ⏱ **Estimated Build Time:** 6–8 hours

---

## 🚀 Features

### 🔐 Authentication
- Supabase email/password login
- Protected routes for poll creation
- Anonymous public voting using `localStorage`
- Basic profile page showing user's created polls

### 🛠 Poll Management
- Poll creation: 
  - Required question
  - 2–10 options
  - Optional settings: multiple selection, early result visibility, editable votes
  - Optional end date
- Poll listing:
  - Paginated (10/page)
  - Filters: Active, Ended, My Polls
  - Search by question
  - Total vote count per poll

### 🗳️ Voting System
- Single or multi-option based on settings
- Duplicate prevention (by user ID or IP hash via `localStorage`)
- Vote confirmation and optional re-voting
- Automatic closure after poll expiry

### ⚡ Real-time Features
- Vote results updated instantly across sessions
- Live viewer count (presence API)
- Poll list refreshes automatically as new polls are added
- Smooth animated chart transitions

### 📊 Result Visualization
- Interactive bar charts using **Recharts**
- Percentage + raw vote display
- Animated result changes
- Export results to **CSV** or **image**
- Switch views: bar, pie (optional)

---

## 🧱 Tech Stack

### Frontend
- [React 18](https://react.dev/) with TypeScript
- [Vite](https://vitejs.dev/) for lightning-fast builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Router v6](https://reactrouter.com/) for navigation
- [React Hook Form](https://react-hook-form.com/) for form handling
- [Recharts](https://recharts.org/) for charting
- [Framer Motion](https://www.framer.com/motion/) (optional animations)
- [React Hot Toast](https://react-hot-toast.com/) for notifications

### Backend
- [Supabase](https://supabase.com/)
  - Authentication
  - PostgreSQL database
  - Realtime channels
  - Row-level security (RLS)

---

## 📂 Database Schema

```sql
-- polls
id UUID PRIMARY KEY,
question TEXT NOT NULL,
options TEXT[] NOT NULL,
settings JSONB NOT NULL,
created_by UUID REFERENCES profiles(id),
created_at TIMESTAMP DEFAULT now(),
ends_at TIMESTAMP NULL

-- votes
id UUID PRIMARY KEY,
poll_id UUID REFERENCES polls(id),
user_id UUID NULL REFERENCES profiles(id),
ip_hash TEXT NULL,
selected_options INTEGER[],
created_at TIMESTAMP DEFAULT now()

-- profiles
id UUID PRIMARY KEY,
email TEXT NOT NULL,
created_polls_count INTEGER DEFAULT 0
````

### RLS Policies

* ✅ Public read access to polls
* ✅ Only authenticated users can create or modify polls
* ✅ Voting allowed if:

  * Authenticated & haven’t voted
  * Anonymous (tracked via IP hash in `localStorage`)
* ✅ Users can only manage their own polls

---

## 🔐 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Find these in [Supabase → Settings → API](https://app.supabase.com).

---

## 🛠️ Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/your-org/realtime-poll-app.git
cd realtime-poll-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the dev server**

```bash
npm run dev
```

4. **Deploy (Optional)**

```bash
npm run build
```

Deploy via [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) by connecting the GitHub repo and setting the `.env` values.

---

## 🧠 Architecture Decisions

| Area                 | Decision                                              |
| -------------------- | ----------------------------------------------------- |
| **State Management** | React `useState` + `useEffect`                        |
| **Forms**            | `React Hook Form` for performance and validation      |
| **Realtime**         | Supabase `channel` and `presence` APIs                |
| **Visualization**    | `Recharts` for flexible, animated charts              |
| **Security**         | Supabase RLS + local vote tracking via `localStorage` |
| **Code Quality**     | Strict TypeScript + modular structure                 |
| **Anonymous Voting** | Tracked via hashed user-agent/IP combo                |

---

## 🎯 Evaluation Criteria

| Area              | Requirements                      |
| ----------------- | --------------------------------- |
| ✅ Functionality   | All core modules complete         |
| ⚡ Realtime        | Vote sync + viewer presence       |
| 🧼 Code Quality   | Modular, typed, DRY               |
| 💻 UX/UI          | Clean layout, fast loading        |
| ⚠️ Error Handling | All API states gracefully handled |

**Features:**
* ✅ QR code generation for poll links
* ✅ Poll templates: Yes/No, Likert scale
* ✅ Dark mode support
* ✅ Embed widget generator (iframe)
* ⏳ Analytics dashboard (in progress)
* ✅ Live viewer count via presence API

---

## 🧪 Example Poll Object (JSON)

```json
{
  "question": "What's your favorite framework?",
  "options": ["React", "Vue", "Svelte", "Angular"],
  "settings": {
    "allow_multiple_selections": false,
    "show_results_before_voting": true,
    "allow_vote_changes": false
  },
  "created_by": "uuid-123",
  "ends_at": "2025-07-10T23:59:00Z"
}
```




---

## 🧾 License

MIT License © 2025 \[Salman Sadiq]

---

## 🙌 Credits

* Built with 💙 using [React](https://react.dev), [Supabase](https://supabase.com), and [Tailwind CSS](https://tailwindcss.com)

