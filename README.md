# suede.dockview-svelte

This repo is a [suede dependency](https://github.com/pmalacho-mit/suede).

To see the installable source code, please checkout the [release branch](https://github.com/pmalacho-mit/suede.dockview-svelte/tree/release).

## Installation

```bash
bash <(curl https://suede.sh/install/release) --repo pmalacho-mit/suede.dockview-svelte
```

<details>
<summary>
See alternative to using <a href="https://github.com/pmalacho-mit/suede#suedesh">suede.sh</a> script proxy
</summary>

```bash
bash <(curl https://raw.githubusercontent.com/pmalacho-mit/suede/refs/heads/main/scripts/install/release.sh) --repo pmalacho-mit/suede.dockview-svelte
```

</details>

## Development

The views in [release/](./release/) are tested, and documented by example, with
[suede.sweater-vest](./suede.sweater-vest/) (a development dependency, so
`release/` carries no tests and consumers need nothing extra). Each view has a
host component in [src/tests/](./src/tests/) whose snippets are the tests; they
double as worked examples of components, snippets, reactive params, placement,
dock chrome, pane headers and the [animate](./release/animate.ts) helpers.
`Themes.svelte` renders every built-in theme, so `npm run report` doubles as a
screenshot gallery of the styles.

```bash
npm test         # Vitest under jsdom; assertions on geometry are skipped (no layout)
npm run dev      # then open http://localhost:5173/vests.html
npm run report   # with the dev server up: every test in Chromium, geometry included → fashion-show.md
npm run check    # svelte-check, including the type assertions in src/tests/typing.check.ts
```

The report needs a browser once: `npx playwright install chromium`.

[UPGRADE.md](./UPGRADE.md) is the plan that moved this library from `dockview@4.11` to
`8.x`; [release/CHANGELOG.md](./release/CHANGELOG.md) is what that changed for consumers.
