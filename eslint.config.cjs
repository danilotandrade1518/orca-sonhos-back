const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const globals = require('globals');

// Plugin personalizado para proibir comentários
const noCommentsPlugin = {
  rules: {
    'no-comments': {
      meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
          description: 'Remove comentários do código automaticamente',
        },
      },
      create(context) {
        return {
          Program() {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getAllComments();

            comments.forEach((comment) => {
              const commentText = comment.value.trim();

              const eslintPatterns = [
                'eslint-disable',
                'eslint-enable',
                'eslint-disable-next-line',
                'eslint-disable-line',
                '@ts-check',
                '@ts-expect-error',
                '@ts-ignore',
                '@ts-nocheck',
              ];

              const isEslintDirective = eslintPatterns.some((pattern) =>
                commentText.includes(pattern)
              );

              if (isEslintDirective) {
                return;
              }

              context.report({
                node: comment,
                message: 'Comentários no código devem ser evitados.',
                fix(fixer) {
                  const lines = sourceCode.getLines();
                  const commentLineIndex = comment.loc.start.line - 1;

                  const commentLine = lines[commentLineIndex];
                  const commentOnly =
                    commentLine.trim() === comment.value.trim() ||
                    commentLine.trim() === `//${comment.value.trim()}` ||
                    commentLine.trim() === `/*${comment.value.trim()}*/`;

                  if (commentOnly) {
                    const lineStart = sourceCode.getIndexFromLoc({
                      line: commentLineIndex + 1,
                      column: 0,
                    });
                    const lineEnd =
                      commentLineIndex + 1 < lines.length
                        ? sourceCode.getIndexFromLoc({ line: commentLineIndex + 2, column: 0 })
                        : sourceCode.getText().length;

                    return fixer.removeRange([lineStart, lineEnd]);
                  } else {
                    return fixer.remove(comment);
                  }
                },
              });
            });
          },
        };
      },
    },
  },
};

module.exports = [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'no-comments-plugin': noCommentsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      'no-comments-plugin/no-comments': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['*.js', '*.cjs', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/migrations/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        exports: 'writable',
        module: 'writable',
      },
    },
  },
  prettier,
];
