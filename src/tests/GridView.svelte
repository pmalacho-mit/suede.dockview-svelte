<script lang="ts">
  import type { Snippet } from "svelte";
  import { GridView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import { animateEntry, animateExit, animateSize } from "../../release/animate";
  import "../../release/styles/dockview.css";
  import type Self from "./GridView.svelte";
  import type { Test } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import type { Params } from "./fixtures/Label.svelte";
  import GridLabel from "./fixtures/GridLabel.svelte";
  import { frames, labels, layout, mounted } from "./support.svelte";

  export type Api = ViewAPI<
    "grid",
    {
      Label: typeof GridLabel;
      label: Snippet<[PanelProps<"grid", Params>]>;
    }
  >;

  let {
    orientation = "HORIZONTAL",
    onReady,
  }: {
    orientation?: "HORIZONTAL" | "VERTICAL";
    onReady?: (event: { api: Api }) => void;
  } = $props();
</script>

<div data-testid="host" style:width="100%" style:height="300px">
  <GridView
    {orientation}
    components={{ Label: GridLabel }}
    snippets={{ label }}
    {onReady}
  />
</div>

{#snippet label({ params }: PanelProps<"grid", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

<!-- component and snippet panels sit side by side -->
{#snippet sitsSideBySide(
  GridViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <GridViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("grid").id("first")(),
    );
    await api.addSnippetPanel(
      "label",
      { text: "second" },
      panel("grid").id("second").reference(first).direction("right")(),
    );

    const [left, right] = mounted.rects(pocket.el, "grid");

    await capture(pocket.el);
    expect(labels(pocket.el)).toEqual(["first", "second"]);
    if (layout) expect(left.left).toBeLessThan(right.left);
  })}
{/snippet}

<!-- a vertical grid stacks its panels -->
{#snippet stacks(
  GridViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <GridViewHost
      orientation="VERTICAL"
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("grid").id("first")(),
    );
    await api.addComponentPanel(
      "Label",
      { text: "second" },
      panel("grid").id("second").reference(first).direction("below")(),
    );

    const [above, below] = mounted.rects(pocket.el, "grid");

    if (layout) {
      expect(above.top).toBeLessThan(below.top);
      expect(above.left).toBe(below.left);
    }
  })}
{/snippet}

<!-- animateSize settles a panel on its target width -->
{#snippet animatesSize(
  GridViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <GridViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("grid").id("first")(),
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      panel("grid").id("second").reference(first).direction("right")(),
    );

    await new Promise<void>((onComplete) =>
      animateSize(second.panel, "width", {
        from: 100,
        to: 300,
        duration: 100,
        onComplete,
      }),
    );

    if (layout) expect(second.panel.width).toBe(300);
  })}
{/snippet}

<!-- animateEntry settles the arriving panel on an equal share -->
{#snippet animatesEntry(
  GridViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <GridViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("grid").id("first")(),
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      panel("grid").id("second").reference(first).direction("right")(),
    );
    const third = await api.addComponentPanel(
      "Label",
      { text: "third" },
      panel("grid").id("third").reference(second).direction("right")(),
    );

    const share = api.width / api.panels.length;
    animateEntry(api, third.panel);
    await new Promise((resolve) => setTimeout(resolve, 700));

    await capture(pocket.el);
    if (layout) {
      expect(third.panel.width).toBeCloseTo(share, 0);
      const widths = mounted
        .rects(pocket.el, "grid")
        .map(({ width }) => Math.round(width));
      expect(Math.min(...widths)).toBeGreaterThan(0);
    }
  })}
{/snippet}

<!-- animateExit removes the panel it collapses -->
{#snippet animatesExit(
  GridViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <GridViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("grid").id("first")(),
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      panel("grid").id("second").reference(first).direction("right")(),
    );

    await new Promise<void>((onComplete) =>
      animateExit(api, second.panel, onComplete),
    );
    await frames();

    expect(api.panels).toHaveLength(1);
    expect(labels(pocket.el)).toEqual(["first"]);
  })}
{/snippet}
