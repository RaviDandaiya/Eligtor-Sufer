import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
    const config = {
        base: '/Eligtor-Sufer/', // Correct base for GitHub Pages
        build: {
            outDir: 'dist',
        }
    }

    if (command === 'serve') {
        // During development, use root base so http://localhost:5173/ works
        config.base = '/'
    }

    return config
})
