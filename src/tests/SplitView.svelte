<script lang="ts">
  import type { Snippet } from "svelte";
  import { SplitView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./SplitView.svelte";
  import type { Test, Sweater } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import type { Params } from "./fixtures/Label.svelte";
  import SplitLabel from "./fixtures/SplitLabel.svelte";
  import { frames, labels, layout, mounted } from "./support.svelte";

  export type Api = ViewAPI<
    "split",
    {
      Label: typeof SplitLabel;
      label: Snippet<[PanelProps<"split", Params>]>;
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
  <SplitView
    {orientation}
    components={{ Label: SplitLabel }}
    snippets={{ label }}
    {onReady}
  />
</div>

{#snippet label({ params }: PanelProps<"split", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

<!-- component panels (snippet panels are tested beside SplitView in release/) -->
{#snippet fills(
  SplitViewHost: typeof Self,
  Status: typeof Sweater.Status,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <Status {test} />
  <div bind:this={pocket.el}>
    <SplitViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addComponentPanel("Label", { text: "first" }, panel("split").id("first")());
    await api.addSnippetPanel("label", { text: "second" }, panel("split").id("second")());

    const [left, right] = mounted.rects(pocket.el, "split");

    await capture(pocket.el);
    expect(labels(pocket.el)).toEqual(["first", "second"]);
    if (layout) expect(left.left).toBeLessThan(right.left);
  })}
{/snippet}
