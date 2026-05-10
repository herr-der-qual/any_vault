import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    server: {
        port: Number(process.env.PORT ?? 3020),
        open: true,
        proxy: {
            '/api': {
                target: process.env.HTTP_PROXY ?? 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },

    build: {
        outDir: 'dist',
        sourcemap: true,
    },
})