import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: false, // Set true jika ingin error ketika port 5173 tidak tersedia
        open: false, // Otomatis buka browser saat server start
    }
})
