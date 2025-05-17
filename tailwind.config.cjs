/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class', // This is important for manual dark mode toggling
    theme: {
        extend: {},
    },
    plugins: [],
}