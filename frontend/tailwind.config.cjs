/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Apple-inspired premium palette
        primary: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1"
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F7F8FA",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#0F172A"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        // Apple-style layered shadows
        "soft": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "soft-md": "0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08)",
        "soft-xl": "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 20px 40px -10px rgba(0, 0, 0, 0.10)"
      },
      borderRadius: {
        "premium": "10px",
        "premium-lg": "12px"
      },
      transitionDuration: {
        "150": "150ms"
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: []
};

