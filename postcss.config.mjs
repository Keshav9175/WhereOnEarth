// PostCSS processes our CSS during the build. This plugin turns Tailwind's utility classes
// (e.g. "flex", "p-4", "bg-primary") into real CSS — only the classes we actually use.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
