module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {ecmaVersion: 2021, sourceType: 'module'},
    env: {node: true, jest: true, es2021: true},
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended'],
    rules: {
        // The TypeScript rule understands imports, types and parameter properties.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {args: 'none', caughtErrors: 'none', ignoreRestSiblings: true}],
    },
};
