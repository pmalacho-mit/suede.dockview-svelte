<script lang="ts">
  import { DockView, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./TabContextMenu.svelte";
  import type { Test } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import TabMenu from "./fixtures/TabMenu.svelte";
  import {
    clickMenuItem,
    frames,
    labels,
    layout,
    menuBox,
    menuItems,
    rightClickTab,
  } from "./support.svelte";

  export type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  let { onReady }: { onReady?: (event: { api: Api }) => void } = $props();
</script>

<div style:width="100%" style:height="300px">
  <DockView
    theme="dark"
    components={{ Label: DockLabel }}
    tabContextMenu={{ component: TabMenu }}
    {onReady}
  />
</div>

<!-- right-clicking a tab opens the menu at the pointer -->
{#snippet opens(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first", "second", "third");

    rightClickTab(pocket.el, "first");
    await frames();

    note("every item maps to a public, free api call");
    await capture(pocket.el);
    expect(menuItems(pocket.el)).toEqual([
      "Close",
      "Close others",
      "Close all",
      "Close to the left",
      "Close to the right",
      "Maximize",
      "Float",
      "Open in a new window",
    ]);
  })}
{/snippet}

<!-- close others keeps the panel the menu was opened from -->
{#snippet closesOthers(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first", "second", "third");

    rightClickTab(pocket.el, "first");
    await frames();
    clickMenuItem(pocket.el, "Close others");
    await frames();

    expect(api.panels.map(({ id }) => id)).toEqual(["first"]);
    expect(labels(pocket.el)).toEqual(["first"]);
  })}
{/snippet}

<!-- close to the right leaves the panels before it -->
{#snippet closesToTheRight(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first", "second", "third");

    rightClickTab(pocket.el, "second");
    await frames();
    clickMenuItem(pocket.el, "Close to the right");
    await frames();

    expect(api.panels.map(({ id }) => id)).toEqual(["first", "second"]);
  })}
{/snippet}

<!-- the menu maximizes the group its panel belongs to -->
{#snippet maximizes(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first");
    await api.addComponentPanel(
      "Label",
      { text: "beside" },
      panel("dock").id("beside").title("beside").direction("right")(),
    );

    rightClickTab(pocket.el, "first");
    await frames();
    clickMenuItem(pocket.el, "Maximize");
    await frames();

    await capture(pocket.el);
    expect(api.hasMaximizedGroup()).toBe(true);
    expect(api.getPanel("first")?.api.group.api.isMaximized()).toBe(true);
  })}
{/snippet}

<!-- the menu is dismissed by Escape -->
{#snippet dismissesOnEscape(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, user }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first");

    rightClickTab(pocket.el, "first");
    await frames();
    expect(menuItems(pocket.el)).not.toEqual([]);

    await user.keyboard("{Escape}");
    await frames();

    expect(menuItems(pocket.el)).toEqual([]);
    expect(api.panels).toHaveLength(1);
  })}
{/snippet}

<!-- a menu asked for near an edge opens back from it -->
{#snippet opensBackFromAnEdge(
  Menu: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Menu onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const stacked = async (...texts: string[]) => {
      for (const text of texts)
        await api.addComponentPanel("Label", { text }, panel("dock").id(text).title(text)());
    };

    await stacked("first");

    const corner = { x: window.innerWidth - 2, y: window.innerHeight - 2 };
    rightClickTab(pocket.el, "first", corner);
    await frames();

    const box = menuBox(pocket.el);

    note("the pointer was 2px from the bottom-right corner");
    if (layout) {
      expect(box.right).toBeLessThanOrEqual(window.innerWidth);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    }
  })}
{/snippet}
