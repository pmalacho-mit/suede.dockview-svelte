<script lang="ts">
  import type { Snippet } from "svelte";
  import { PaneView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./PaneView.svelte";
  import type { Test } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import type { Params } from "./fixtures/Label.svelte";
  import PaneLabel from "./fixtures/PaneLabel.svelte";
  import PaneHeader from "./fixtures/PaneHeader.svelte";
  import { frames, labels, layout, mounted, rendered } from "./support.svelte";

  export type Api = ViewAPI<
    "pane",
    {
      Label: typeof PaneLabel;
      label: Snippet<[PanelProps<"pane", Params>]>;
    }
  >;

  let { onReady }: { onReady?: (event: { api: Api }) => void } = $props();
</script>

<div data-testid="host" style:width="100%" style:height="300px">
  <PaneView
    components={{ Label: PaneLabel }}
    snippets={{ label }}
    headers={{ components: { Header: PaneHeader }, snippets: { header } }}
    {onReady}
  />
</div>

{#snippet label({ params }: PanelProps<"pane", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

{#snippet header({ title }: PanelProps<"pane", Params>)}
  <span data-testid="header">snippet header for {title}</span>
{/snippet}

<!-- panels stack in the order they are added -->
{#snippet stacks(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const expanded = (id: string, title: string) =>
      panel("pane").id(id).title(title).isExpanded(true)();

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      expanded("first", "First"),
    );
    await api.addSnippetPanel(
      "label",
      { text: "second" },
      expanded("second", "Second"),
    );

    const [above, below] = mounted.rects(pocket.el, "pane");

    await capture(pocket.el);
    expect(labels(pocket.el)).toEqual(["first", "second"]);
    if (layout) expect(above.top).toBeLessThan(below.top);
  })}
{/snippet}

<!-- the panel title reaches the default header -->
{#snippet titlesTheDefaultHeader(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("pane").id("first").title("A section")(),
    );

    expect(pocket.el.textContent).toContain("A section");
  })}
{/snippet}

<!-- a header component renders in place of the default header -->
{#snippet headerComponent(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("pane").id("first").title("A section").headerComponent("Header")(),
    );

    await capture(pocket.el);
    expect(rendered.texts(pocket.el, "header")).toEqual([
      "A section holds first",
    ]);
  })}
{/snippet}

<!-- a header snippet renders in place of the default header -->
{#snippet headerSnippet(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("pane").id("first").title("A section").headerComponent("header")(),
    );

    expect(rendered.texts(pocket.el, "header")).toEqual([
      "snippet header for A section",
    ]);
  })}
{/snippet}

<!-- a panel arrives collapsed unless it asks to be expanded -->
{#snippet arrivesCollapsed(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("pane").id("first").title("First")(),
    );

    expect(first.panel.api.isExpanded).toBe(false);
    if (layout) {
      const heights = Array.from(
        pocket.el.querySelectorAll<HTMLElement>(".dv-pane-body"),
      ).map((body) => Math.round(body.getBoundingClientRect().height));
      expect(heights).toEqual([0]);
    }
  })}
{/snippet}

<!-- collapsing a panel closes its body -->
{#snippet collapses(
  PaneViewHost: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <PaneViewHost onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const heights = () =>
      Array.from(
        pocket.el.querySelectorAll<HTMLElement>(".dv-pane-body"),
      ).map((body) => Math.round(body.getBoundingClientRect().height));

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("pane").id("first").title("First").isExpanded(true)(),
    );
    if (layout) expect(heights()[0]).toBeGreaterThan(0);

    first.panel.api.setExpanded(false);
    await frames();

    await capture(pocket.el);
    expect(first.panel.api.isExpanded).toBe(false);
    if (layout) expect(heights()).toEqual([0]);
  })}
{/snippet}
