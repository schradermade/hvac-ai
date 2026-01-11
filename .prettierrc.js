module.exports = {
  // Line settings
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,

  // String settings
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,

  // Trailing commas
  trailingComma: 'es5',

  // Bracket settings
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow function parentheses
  arrowParens: 'always',

  // End of line
  endOfLine: 'lf',

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
};
