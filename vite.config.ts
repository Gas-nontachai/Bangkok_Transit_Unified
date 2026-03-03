import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  if (mode === "test") {
    return {
      plugins: [tsconfigPaths()],
      test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./app/test-setup.ts"],
        include: ["app/**/*.test.{ts,tsx}"],
      },
    };
  }
  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  };
});
