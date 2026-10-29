<script lang="ts">
  import type { Snippet } from "svelte";
  import { DockView, type PanelProps, type Theme, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./DockView.svelte";
  import type { Test, Widen } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import { type Params } from "./fixtures/Label.svelte";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import DockCounter from "./fixtures/DockCounter.svelte";
  import DockNested from "./fixtures/DockNested.svelte";
  import { frames, labels, layout, rendered } from "./support.svelte";

  export type Api = ViewAPI<
    "dock",
    {
      Label: typeof DockLabel;
      Counter: typeof DockCounter;
      Nested: typeof DockNested;
      label: Snippet<[PanelProps<"dock", Params>]>;
    }
  >;

  let {
    theme = "dark",
    onReady,
  }: {
    theme?: Theme;
    onReady?: (event: { api: Api }) => void;
  } = $props();
</script>

<div style:width="100%" style:height="300px">
  <DockView
    {theme}
    components={{ Label: DockLabel, Counter: DockCounter, Nested: DockNested }}
    snippets={{ label }}
    {onReady}
  />
</div>

{#snippet label({ params }: PanelProps<"dock", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

<!-- component panels render their params -->
{#snippet renders(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const first = await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addComponentPanel("Label", { text: "second" }, rightOf(first, "second"));
    await capture(pocket.el);

    expect(labels(pocket.el)).toEqual(["first", "second"]);
  })}
{/snippet}

<!-- snippet panels render their params -->
{#snippet snippets(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    await api.addSnippetPanel("label", { text: "from a snippet" });
    await capture(pocket.el);

    expect(labels(pocket.el)).toEqual(["from a snippet"]);
  })}
{/snippet}

<!-- panels of the same component need distinct ids -->
{#snippet distinctIds(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    await api.addComponentPanel("Label", { text: "first" });
    const duplicate = api.addComponentPanel("Label", { text: "second" });

    await expect(duplicate).rejects.toThrow("panel with id c_Label already exists");
  })}
{/snippet}

<!-- panels stacked in one group render only the active tab -->
{#snippet stacks(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const first = await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addComponentPanel("Label", { text: "second" }, at("second"));
    expect(labels(pocket.el)).toEqual(["second"]);

    first.panel.api.setActive();
    await frames();

    expect(api.groups).toHaveLength(1);
    expect(labels(pocket.el)).toEqual(["first"]);
  })}
{/snippet}

<!-- component exports are handed back by addComponentPanel -->
{#snippet handsBackExports(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const { exports } = await api.addComponentPanel("Counter", { start: 41 });
    exports.increment();
    await frames();

    expect(exports.read()).toBe(42);
    expect(rendered.only(pocket.el, "count").textContent).toBe("42");
  })}
{/snippet}

<!-- reactive params keep a mounted panel in sync -->
{#snippet reactive(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    await api.addComponentPanel("Label", {
      text: api.reactive(() => pocket.text),
    });
    expect(labels(pocket.el)).toEqual(["before"]);

    pocket.text = "after";
    await frames();

    note(`the panel re-rendered as "${labels(pocket.el)}"`);
    expect(labels(pocket.el)).toEqual(["after"]);
  })}
{/snippet}

<!-- a removed panel stops listening to its reactive params -->
{#snippet removedStopsListening(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const { panel: added } = await api.addComponentPanel("Label", {
      text: api.reactive(() => pocket.text),
    });
    api.removePanel(added);
    pocket.text = "after";
    await frames();

    expect(labels(pocket.el)).toEqual([]);
    expect(api.panels).toHaveLength(0);
  })}
{/snippet}

<!-- the panel builder titles a panel and places it beside another -->
{#snippet builder(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").title("The first one")(),
    );
    await api.addComponentPanel("Label", { text: "second" }, rightOf(first, "second"));
    await capture(pocket.el);

    const [firstLabel, secondLabel] = rendered.rects(pocket.el, "label");

    expect(api.getPanel("first")?.title).toBe("The first one");
    expect(api.groups).toHaveLength(2);
    if (layout) expect(firstLabel.left).toBeLessThan(secondLabel.left);
  })}
{/snippet}

<!-- a reactive param nested inside another param keeps its panel in sync -->
{#snippet nestedReactive(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    await api.addComponentPanel("Nested", {
      label: { text: api.reactive(() => pocket.text) },
      rows: ["a", "b"],
    });
    expect(labels(pocket.el)).toEqual(["before"]);

    pocket.text = "after";
    await frames();

    note("dockview merges params one level deep, so the whole `label` is re-sent");
    expect(labels(pocket.el)).toEqual(["after"]);
  })}
{/snippet}

<!-- a param that did not change is not written again -->
{#snippet unchangedNotRewritten(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const { exports } = await api.addComponentPanel("Nested", {
      label: { text: api.reactive(() => pocket.text) },
      rows: ["a", "b"],
    });
    expect(exports.rowRenderCount()).toBe(1);

    pocket.text = "after";
    await frames();
    pocket.text = "later";
    await frames();

    note(
      "`rows` is handed back unchanged on every update; rewriting it would re-proxy it and invalidate its readers",
    );
    expect(labels(pocket.el)).toEqual(["later"]);
    expect(exports.rowRenderCount()).toBe(1);
  })}
{/snippet}

<!-- one reactive value keeps every panel holding it in sync -->
{#snippet sharedReactive(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const shared = api.reactive(() => pocket.text);
    const first = await api.addComponentPanel("Label", { text: shared }, at("first"));
    await api.addComponentPanel("Label", { text: shared }, rightOf(first, "second"));

    pocket.text = "after";
    await frames();

    expect(labels(pocket.el)).toEqual(["after", "after"]);
  })}
{/snippet}

<!-- a reactive value cannot stand in for the whole params object -->
{#snippet reactiveParamsRejected(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement; text: Widen<"before"> }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const wrongly = api.reactive(() => ({ text: pocket.text })) as { text: string };

    await expect(api.addComponentPanel("Label", wrongly)).rejects.toThrow(
      "wraps a single param value",
    );
  })}
{/snippet}

<!-- the panel builder places a panel into an edge group -->
{#snippet edgeGroup(DockViewHost: typeof Self, pocket: { api: Api; el: HTMLDivElement }, test: Test)}
  <div bind:this={pocket.el}>
    <DockViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const at = (id: string) => panel("dock").id(id)();
    const rightOf = (reference: { reference: string }, id: string) =>
      panel("dock").id(id).reference(reference).direction("right")();

    const edge = api.addEdgeGroup("left", { id: "activity-bar", initialSize: 120 });
    await api.addComponentPanel(
      "Label",
      { text: "in the edge" },
      panel("dock").group(edge).id("explorer")(),
    );
    await api.addComponentPanel(
      "Label",
      { text: "in the dock" },
      panel("dock").id("main").direction("right")(),
    );
    await capture(pocket.el);

    const [edgeLabel, dockLabel] = rendered.rects(pocket.el, "label");

    expect(api.getEdgeGroup("left")?.id).toBe(edge.id);
    expect(api.getPanel("explorer")?.api.group.id).toBe(edge.id);
    if (layout) expect(edgeLabel.left).toBeLessThan(dockLabel.left);
  })}
{/snippet}
