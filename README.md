# SupportBridge — Frontend

A React 18 frontend for the SupportBridge portal, built for the Spritle Software developer task.

---

## Tech Stack

- **React 18** with React Router v6
- **Axios** for API calls
- **Context API** for auth and toast state

---

## Project Structure

```
frontend/
└── src/
    ├── pages/
    │   ├── AuthPage.jsx          # Login / Signup
    │   ├── Dashboard.jsx         # Home dashboard
    │   ├── TicketsPage.jsx       # Ticket list with search/filter
    │   ├── TicketDetail.jsx      # Ticket detail + conversation thread
    │   ├── IntegrationsPage.jsx  # Connect Freshdesk & HubSpot
    │   └── WebhooksPage.jsx      # Webhook logs viewer
    ├── context/
    │   ├── AuthContext.jsx       # JWT auth state
    │   └── ToastContext.jsx      # Toast notifications
    ├── components/
    │   └── Sidebar.jsx           # Navigation sidebar
    └── utils/
        └── api.js                # Axios instance with base URL + interceptors
```

---

## Setup Instructions

### Prerequisites

- Node.js >= 18
- Backend server running at `http://localhost:5000`

### 1. Navigate to frontend folder

```bash
cd spritle-portal/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

> If you're using the proxy setting in `package.json`, this file is optional.

### 4. Start the development server

```bash
npm start
```

App runs at: `http://localhost:3000`

---

## Pages Overview

| Page | Route | Description |
|---|---|---|
| Auth | `/` | Login and Signup |
| Dashboard | `/dashboard` | Overview after login |
| Tickets | `/tickets` | List of Freshdesk tickets with search, filter, pagination |
| Ticket Detail | `/tickets/:id` | Full ticket info + conversation thread + HubSpot CRM panel |
| Integrations | `/integrations` | Connect / disconnect Freshdesk (API key) and HubSpot (OAuth) |
| Webhooks | `/webhooks` | Live webhook log viewer with payload inspector |

---

## Sample User Credentials

```
Email:    demo@example.com
Password: demo123
```

> After login, go to **Integrations** to connect your Freshdesk and HubSpot accounts.

---

## Build for Production

```bash
npm run build
```

Deploy the `build/` folder to **Vercel** or **Netlify**.

> Add a `_redirects` file in the `public/` folder for React Router to work on Netlify:
> ```
> /* /index.html 200
> ```

---

## License

Built for Spritle Software evaluation. Private & Confidential.