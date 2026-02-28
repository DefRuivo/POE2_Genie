import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ["var(--font-cinzel)", "serif"],
                body: ["var(--font-source-sans-3)", "system-ui", "sans-serif"],
            },
            colors: {
                poe: {
                    bg0: "var(--poe-bg-0)",
                    bg1: "var(--poe-bg-1)",
                    surface1: "var(--poe-surface-1)",
                    surface2: "var(--poe-surface-2)",
                    border: "var(--poe-border)",
                    borderStrong: "var(--poe-border-strong)",
                    text1: "var(--poe-text-1)",
                    text2: "var(--poe-text-2)",
                    gold: "var(--poe-accent-gold)",
                    bronze: "var(--poe-accent-bronze)",
                    crimson: "var(--poe-accent-crimson)",
                    arcane: "var(--poe-accent-arcane)",
                    focus: "var(--poe-focus)",
                    sectionParty: "var(--poe-section-party)",
                    sectionChecklist: "var(--poe-section-checklist)",
                    sectionBuilds: "var(--poe-section-builds)",
                    sectionStash: "var(--poe-section-stash)",
                    sectionHideouts: "var(--poe-section-hideouts)",
                    sectionSettings: "var(--poe-section-settings)",
                    success: "var(--poe-success)",
                    warning: "var(--poe-warning)",
                    danger: "var(--poe-danger)",
                    info: "var(--poe-info)",
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
