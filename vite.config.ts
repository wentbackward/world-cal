import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the same build works at any path — the
  // deployment target is a root domain (world.paulgresham.com).
  // Asset links are written as ./assets/… — the browser resolves them
  // under the current page directory. Trailing-slash on the URL is
  // required.
  base: './',
  plugins: [react()],
})
