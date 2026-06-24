import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    compilerOptions: {
        // ... all the existing Vite options ...

        baseUrl: ".",
        paths: {
            "@/*": ["./src/*"],
        },
    },
});
