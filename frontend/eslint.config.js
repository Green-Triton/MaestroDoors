import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

/**
 * Feature-Sliced Design layers, ordered from the top of the application down.
 * A module may import from layers below it, never from above.
 */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

const ORDER = 'app → pages → widgets → features → entities → shared'

/**
 * `app` and `shared` are flat: they hold no slices, so a module inside them may
 * reference a sibling (`shared/ui` legitimately uses `shared/lib`). The layers
 * in between are divided into slices that must stay independent of each other.
 */
const UNSLICED = new Set(['app', 'shared'])

/** Alias patterns a given layer is not allowed to reach for. */
const forbiddenFor = (layer) => {
  const above = LAYERS.slice(0, LAYERS.indexOf(layer)).map((higher) => ({
    group: [`@${higher}/*`],
    message: `Слой "${layer}" не может импортировать из "${higher}": зависимости направлены только вниз (${ORDER}).`,
  }))

  if (UNSLICED.has(layer)) return above

  return [
    ...above,
    {
      group: [`@${layer}/*`],
      message: `Слайсы внутри "${layer}" независимы: импортируйте через нижние слои, а не соседний слайс.`,
    },
  ]
}

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  // One block per layer, forbidding upward and sideways imports.
  ...LAYERS.map((layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': ['error', { patterns: forbiddenFor(layer) }],
    },
  })),
)
