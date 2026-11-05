import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the same build works at any path:
  //   paulgresham.com/world-cal/  AND  world-cal.paulgresham.com/
  // Asset links are written as ./assets/… — browser resolves under the
  // current page directory. Requires trailing-slash on the URL
  // (Hostinger already redirects /world-cal → /world-cal/).
  base: './',
  plugins: [react()],
})
