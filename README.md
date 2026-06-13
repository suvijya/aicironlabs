# AuraFinance AI — Financial Intelligence Dashboard

AuraFinance AI is a premium, client-side financial intelligence dashboard built using Next.js 14+ App Router, Tailwind CSS, Framer Motion, and Recharts. The application features a custom, high-fidelity lavender AI theme inspired by the **POF_AI** chat interface, complete with a 3D robot mascot, chat history sidebar, and inline metadata analytics.

---

## 🚀 Key Features

AuraFinance AI is divided into 5 interactive workspaces:

| Workspace | Description |
| :--- | :--- |
| **💬 Ask AI** | Chat interface with a 3D mascot hero, quick-action chips, prompt templates, markdown table/formatting rendering, copy-to-clipboard actions, and raw JSON logs. |
| **📋 Audit History** | Real-time searchable audit logs tracking query metrics. Allows re-submitting previous prompts back into the live chat input. |
| **📦 Batch Testing** | Drag-and-drop JSON importer to simulate processing lists of queries. Includes export controls for JSON and CSV download. |
| **📊 Analytics & Metrics** | Interactive charts (Recharts) detailing average response latency, quality score distributions, and system performance. |
| **⚙️ Configuration** | Customization controls for system prompts, response delay simulator (500ms - 4000ms), font scaling, and light/dark theme toggle. |

---

## 🛠️ Technology Stack

* **Core Framework**: Next.js 14+ (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v3
* **Animations**: Framer Motion
* **Visualizations**: Recharts
* **State Management**: React Context + `useReducer`
* **Storage**: Browser `localStorage` (automatic configuration & log syncing)

---

## 🎨 Theme & Design System

The layout is inspired by the **POF_AI** design guidelines, showcasing a lavender pastel gradient and a modern, high-contrast typography scheme:

* **Background Gradients**: Dynamic radial lavender light gradient (`hsl(248°)` to `hsl(260°)`) shifting into deep dark gray in dark mode.
* **Mascot Illustration**: Glowing 3D render of a futuristic robot assistant mascot in the center of the empty state screen.
* **Sidebar Layout**: A clean white navigation layout containing:
  * A gradient **"New Chat"** button.
  * Tab navigation with custom icons.
  * A **Chat History** list section.
  * A purple gradient **"Upgrade Your Plan"** CTA card at the bottom.
* **Chat Bubbles**: Distinct speech bubbles (User message: gradient violet; AI message: clean white card with action buttons).
* **High Contrast Text**: Responsive classes (`text-gray-700 dark:text-zinc-300`) applied to markdown paragraphs, tables, lists, and form fields to guarantee readability in light mode.

---

## ⚙️ Architecture

### 1. State Management (`src/context/DashboardContext.tsx`)
A centralized store manages the global state:
```typescript
interface DashboardState {
  activeTab: "ask" | "history" | "batch" | "metrics" | "config";
  sidebarOpen: boolean;
  currentQuestion: string; // Used to re-queue questions from history
  config: DashboardConfig; // fontSize, delayMs, qualityScore, systemPrompt, theme, etc.
  history: HistoryItem[];
  metrics: DashboardMetrics;
  batchState: BatchState;
}
```

### 2. Simulated NLP Engine (`src/utils/mockAi.ts`)
A rule-based generator returns responses customized by the active **Agent Persona**:
* **Financial Analyst**: Evaluates efficiency metrics and asset rotation.
* **Equity Research**: Focuses on competitive moats and target price calculations.
* **Investment Banking**: Details EV/EBITDA multiples and debt covenants.
* **Conservative Review**: Emphasizes safety margins and risk parameters.
* **Academic Professor**: Provides detailed calculations and formulas.

---

## 🏁 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

1. Navigate to the project directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev -- -p 3002
   ```

4. Open [http://localhost:3002](http://localhost:3002) in your browser to view the application.

### Building for Production

To create an optimized production build of the static application:
```bash
npm run build
```

The output will be compiled into the `.next` directory.
