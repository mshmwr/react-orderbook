/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the build relocatable (can be served from a subpath, like the
// sibling vue3-orderbook project). Pure-logic tests run in the node env.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
