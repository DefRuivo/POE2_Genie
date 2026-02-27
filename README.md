# POE2 Genie ⚔️
**Plan smarter builds for your hideout party.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.x-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%20API-orange)

**POE2 Genie** is an intelligent, AI-powered Path of Exile companion for building stronger characters. It combines Hideout Party profiles, Stash tracking, Checklist management, and an AI build strategist to turn your available resources into practical, personalized builds.

---

## ✨ Features

### 🧠 AI Build Strategist
*   **Intelligent Crafting**: Creates practical builds from what you *actually* have in your Stash.
*   **Party-Aware**: Respects Party restrictions, preferred archetypes, and setup time preferences.
*   **Cost-Aware Planning**: Supports budget tiers from cheap setups to mirror-level planning.
*   **Global Translation**: Instantly translate any build to your preferred language (English/Portuguese).

### 🏠 Connected Hideouts
*   **Party Sync**: Invite friends to your Hideout and manage shared context.
*   **Shared Management**: Everyone sees the same Stash and Checklist.
*   **Role Control**: Manage permissions with Party Leader and Party Member roles.

### 🛒 Checklist Workflow
*   **Seamless Flow**: Add missing Gear/Gems from builds directly to Checklist.
*   **Status Clarity**: Organize items by Pending and Completed tabs.
*   **Easy Sharing**: Copy filtered Checklist items for WhatsApp or text.

### 📦 Stash Tracking
*   **Track Inventory**: Keep your Stash visibility up to date.
*   **Paste Import**: Import Path of Exile item clipboard content directly into Stash.
*   **Smarter Suggestions**: AI prioritizes what you already have before suggesting new items.

---

## 🛠️ Tech Stack

Built with modern web technologies for performance and scale:

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
*   **Database**: [MariaDB](https://mariadb.org/) & [Prisma ORM](https://www.prisma.io/)
*   **AI Engine**: [Google Gemini API](https://deepmind.google/technologies/gemini/) (configurable models)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Authentication**: Custom JWT with secure password recovery flow.
*   **Infrastructure**: Docker & Docker Compose ready.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose (for the database)
*   Google Gemini API key

### Quick Start (Development)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/DefRuivo/POE2_Genie.git
    cd POE2_Genie
    ```

2.  **Set up environment**:
    ```bash
    cp .env-sample .env
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

## 🧭 Canonical Routes

*   `/hideouts`
*   `/party`
*   `/builds`
*   `/stash`
*   `/checklist`

---

## 🔒 Security Checks

Security and CI policy references:

*   [CI Security Checks](docs/ci-security-checks.md)
*   [Canonical Migration Guide](MIGRATION.md)

---

## 🤝 Contributing

We welcome contributions. Whether you're fixing a bug or adding a new build-planning feature, feel free to open a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
