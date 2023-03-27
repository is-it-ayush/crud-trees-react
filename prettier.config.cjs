/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  printWidth: 80,
  bracketSameLine: true,
  singleQuote: false,
  trailingComma: "all",
};

module.exports = config;
