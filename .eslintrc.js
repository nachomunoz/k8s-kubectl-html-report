module.exports = {
    env: {
        browser: false,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        indent: ['error', 4],
        radix: ['off'],
        'no-param-reassign': ['off'],
        'max-len': ['error', 120],
        'no-restricted-syntax': ['off'],
        'arrow-parens': ['off'],
        'func-names': ['off'],
        'space-before-function-paren': ['off'],
    },
};
