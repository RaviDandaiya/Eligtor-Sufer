import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
    const config = {
        // Use environment variable for base, default to root for Vercel
        // Set VITE_BASE_PATH=/Eligtor-Sufer/ for GitHub Pages
        // Use environment variable for base, default to relative for CrazyGames/static hosting
        base: process.env.VITE_BASE_PATH || './',
        build: {
            outDir: 'dist',
        }
    }

    if (command === 'serve') {
        // During development, always use root base
        config.base = '/'
    }

    return config
})
