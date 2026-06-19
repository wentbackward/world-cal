import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://paulgresham.com/world-cal/ — assets resolve under this path.
  base: '/world-cal/',
  plugins: [react()],
})
