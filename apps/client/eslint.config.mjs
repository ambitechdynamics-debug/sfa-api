import nextVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "scraps/**",
      "*.jsx",
      "**/*.jsx",
    ],
  },
]

export default eslintConfig
