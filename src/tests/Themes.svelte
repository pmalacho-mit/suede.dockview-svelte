<script lang="ts">
  import {
    DockView,
    themes,
    themeOptions,
    type Theme,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./Themes.svelte";
  import type { Test, Sweater } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import ThemedLabel from "./fixtures/ThemedLabel.svelte";
  import { frames, labels, themeNames } from "./support.svelte";

  export type Api = ViewAPI<"dock", { Label: typeof ThemedLabel }>;

  let {
    theme,
    onReady,
  }: { theme: Theme; onReady?: (event: { api: Api }) => void } = $props();
</script>

<div style:width="100%" style:height="240px">
  <DockView {theme} components={{ Label: ThemedLabel }} {onReady} />
</div>

<!-- every built-in theme, each with two groups (one tabbed): enough chrome for a capture to show what a theme does to tabs, sashes, borders and the gap between groups -->
{#snippet gallery(
  ThemesHost: typeof Self,
  Grid: typeof Sweater.Grid,
  Labeled: typeof Sweater.Labeled,
  Frame: typeof Sweater.Frame,
  pocket: { el: HTMLDivElement },
  test: Test,
)}
  {@const apis: Record<string, Api> = {}}
  <div bind:this={pocket.el}>
    <Grid columns={2}>
      {#each themeOptions as theme (theme)}
        <Labeled label={theme}>
          <Frame>
            <div data-theme-case={theme} style:width="420px">
              <ThemesHost {theme} onReady={({ api }) => (apis[theme] = api)} />
            </div>
          </Frame>
        </Labeled>
      {/each}
    </Grid>
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() =>
      expect(Object.keys(apis)).toHaveLength(themeOptions.length),
    );
    const at = (id: string) => panel("dock").id(id)();

    for (const theme of themeOptions) {
      const api = apis[theme];
      const first = await api.addComponentPanel("Label", { text: "left panel" }, at("first"));
      await api.addComponentPanel(
        "Label",
        { text: "right panel" },
        panel("dock").id("second").reference(first).direction("right")(),
      );
      await api.addComponentPanel("Label", { text: "tabbed alongside it" }, at("third"));
    }
    await frames();
    await capture(pocket.el, "every theme");

    for (const theme of themeOptions) {
      const host = pocket.el.querySelector<HTMLElement>(
        `[data-theme-case="${theme}"]`,
      )!;
      note(`${theme} → .${themes[theme].className}`);
      expect(themeNames(host)).toEqual([themes[theme].className]);
      expect(labels(host)).toEqual(["left panel", "tabbed alongside it"]);
    }
  })}
{/snippet}
