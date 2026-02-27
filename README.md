
# POE2 Genie ⚔️
**Plan smarter builds for your hideout party.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-orange)

**POE2 Genie** is an intelligent, AI-powered Path of Exile companion for building stronger characters. It combines hideout party profiles, stash tracking, build items, and an AI build strategist to turn your available resources into practical, personalized builds.

---

## ✨ Features

### 🧠 AI Build Strategist
*   **Intelligent Crafting**: Creates practical builds from what you *actually* have in your stash.
*   **Party-Aware**: Respects party restrictions, preferred archetypes, and setup time preferences.
*   **Theorycrafter Mode**: Supports advanced and technical build planning.
*   **Global Translation**: Instantly translate any build into your preferred language (English/Portuguese).

### 🏠 Connected Hideouts
*   **Party Sync**: Invite friends to your hideout and manage shared context.
*   **Shared Management**: Everyone sees the same stash and build items.
*   **Role Control**: Manage permissions with Party Leader and Party Member roles.

### 🛒 Build Items Workflow
*   **Seamless Flow**: Add missing gear/gems from builds directly to Build Items.
*   **Smart Filtering**: Organize items by manual entries or linked builds.
*   **Easy Sharing**: Copy your filtered list to share via WhatsApp or text.

### 📦 Stash Tracking
*   **Track Inventory**: Keep your stash visibility up to date.
*   **Smarter Suggestions**: AI prioritizes what you already have before suggesting new items.

---

## 🛠️ Tech Stack

Built with modern web technologies for performance and scale:

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
*   **Database**: [MariaDB](https://mariadb.org/) & [Prisma ORM](https://www.prisma.io/)
*   **AI Engine**: [Google Gemini 1.5](https://deepmind.google/technologies/gemini/) (Pro & Flash)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Authentication**: Custom JWT with secure password recovery flow.
*   **Infrastructure**: Docker & Docker Compose ready.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose (for the database)
*   Google Gemini API Key

### Quick Start (Development)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/DefRuivo/POE2_Genie.git
    cd POE2_Genie
    ```

2.  **Set up environment**:
    ```bash
    cp .env.example .env
    # Edit .env with your GEMINI_API_KEY and database credentials
    ```

3.  **Start the database**:
    ```bash
    docker compose up -d
    ```

4.  **Install dependencies & push schema**:
    ```bash
    pnpm install
    pnpm db:push
    ```

5.  **Run the app**:
    ```bash
    pnpm dev
    ```

Visit `http://localhost:3000` to start crafting builds.

---

## 🤝 Contributing

We welcome contributions. Whether you're fixing a bug or adding a new build-planning feature, feel free to open a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
