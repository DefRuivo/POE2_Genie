# Dinner? | Smart Culinary Assistant

A world-class AI-powered culinary engine designed to combat decision fatigue and food waste while ensuring absolute safety for dietary restrictions.

## Features
- **Intelligent Recipe Generation:** Uses Gemini 3 Pro to create safe recipes based on your pantry.
- **Safety Auditor:** Explains exactly why ingredients were chosen or excluded.
- **Image Generation:** Visualizes your future meal with professional AI photography.
- **MySQL Integration:** Ready for production-scale data persistence using Prisma ORM.
- **Multi-lingual Support:** English and Portuguese.

## How to Run

1.  **Environment Setup**: 
    - `GEMINI_API_KEY`: Your Google Gemini API key.
    - `DATABASE_URL`: Your MySQL connection string (e.g., `mysql://user:password@localhost:3306/dinnerdb`).

2.  **Database Migration**:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Installation**:
    ```bash
    npm install
    ```

4.  **Development**:
    ```bash
    npm run dev
    ```

## Architecture: Transition to MySQL

The application has been upgraded to support a centralized MySQL database.

1.  **ORM (Prisma)**: We use Prisma to manage the database schema and migrations. The schema is defined in `prisma/schema.prisma`.
2.  **API Layer**: The `storageService.ts` now acts as a client for a backend API. You must implement the corresponding API endpoints (e.g., in Next.js `app/api/` or an Express server) to handle the database operations using Prisma.
3.  **Data Types**: Complex fields like ingredient lists and dietary restrictions are stored as `JSON` columns for flexibility while maintaining structured data.

## Complexity & Prep Time
You can now customize your culinary experience:
- **Difficulty**: Easy, Intermediate, Advanced.
- **Prep Time**: Quick (< 30 min) or Plenty of Time.
