// file: tailwind.config.ts
import type { Config } from "tailwindcss";

/**
 * This config is minimal and v4.1-compliant.
 * We define all our custom colors/theming as CSS variables in `app/globals.css`,
 * so we don't need to extend the `theme` object here.
 * We only need this file to:
 * 1. Tell Tailwind where to find our class names (content glob).
 * 2. Register the `tailwindcss-animate` plugin for ShadCN.
 * 3. Set up ShadCN's container and darkMode preferences.
 */
const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "", // This is the default, but good to be explicit for ShadCN
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        // Our custom --primary and --secondary colors are
        // defined in `app/globals.css` and used by ShadCN,
        // so no `extend` block is needed here. This is the
        // modern, v4-compatible approach.
    },
    plugins: [
        require("tailwindcss-animate"), // Required for ShadCN
    ],
};

export default config;