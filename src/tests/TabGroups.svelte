<script lang="ts">
  import type { ITabGroup } from "dockview";
  import { DockView, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./TabGroups.svelte";
  import type { Test } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import TabGroupChip from "./fixtures/TabGroupChip.svelte";
  import { frames, rendered } from "./support.svelte";

  export type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  const colors = ["#7aa2f7", "#9ece6a", "#f7768e"];

  let { onReady }: { onReady?: (event: { api: Api }) => void } = $props();

  /**
   * The whole tab group api is free and arrives with the upgrade; the only
   * thing this library adds is the chip renderer. These are the calls the
   * buttons below make.
   */
  let api = $state<Api>();
  let tabGroup = $state.raw<ITabGroup>();
  let color = 0;

  const ready = (event: { api: Api }) => {
    api = event.api;
    onReady?.(event);
  };

  const add = async (text: string) => {
    await api?.addComponentPanel(
      "Label",
      { text },
      panel("dock").id(text).title(text)(),
    );
  };

  const group = (label: string) => {
    const [first, ...rest] = api?.panels ?? [];
    if (!first) return;

    const groupId = first.api.group.id;
    const created = api!.createTabGroup({ groupId, label });

    for (const it of [first, ...rest])
      api!.addPanelToTabGroup({
        groupId,
        tabGroupId: created.id,
        panelId: it.id,
      });

    tabGroup = created;
  };

  const rename = (label: string) => tabGroup?.setLabel(label);

  const recolor = () => tabGroup?.setColor(colors[++color % colors.length]);

  const toggle = () => tabGroup?.toggle();
</script>

<div
  style:display="flex"
  style:flex-direction="column"
  style:width="100%"
  style:height="300px"
>
  <div class="toolbar">
    <button
      type="button"
      data-testid="add"
      onclick={() => add(`panel ${(api?.panels.length ?? 0) + 1}`)}
    >
      Add a panel
    </button>
    <button type="button" data-testid="group" onclick={() => group("Docs")}>
      Group the open tabs
    </button>
    <button type="button" data-testid="rename" onclick={() => rename("Notes")}>
      Rename
    </button>
    <button type="button" data-testid="recolor" onclick={recolor}>
      Recolor
    </button>
    <button type="button" data-testid="toggle" onclick={toggle}>
      Collapse / expand
    </button>
  </div>

  <div style:flex="1" style:min-height="0">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      tabGroupChip={{ component: TabGroupChip }}
      onReady={ready}
    />
  </div>
</div>

<!-- a chip renders for the tab group it labels -->
{#snippet chipRenders(
  TabGroups: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <TabGroups onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const text = (id: string) => rendered.texts(pocket.el, id);

    for (const name of ["readme", "changelog"])
      await pocket.api.addComponentPanel(
        "Label",
        { text: name },
        panel("dock").id(name).title(name)(),
      );
    rendered.only(pocket.el, "group").click();
    await frames();

    await capture(pocket.el);
    expect(text("chip-label")).toEqual(["Docs"]);
    expect(text("chip-size")).toEqual(["2"]);
  })}
{/snippet}

<!-- the chip follows the group it was given -->
{#snippet chipFollows(
  TabGroups: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <TabGroups onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    for (const name of ["readme", "changelog"])
      await pocket.api.addComponentPanel(
        "Label",
        { text: name },
        panel("dock").id(name).title(name)(),
      );
    rendered.only(pocket.el, "group").click();
    await frames();

    rendered.only(pocket.el, "rename").click();
    await frames();
    expect(rendered.texts(pocket.el, "chip-label")).toEqual(["Notes"]);

    rendered.only(pocket.el, "toggle").click();
    await frames();

    note("the chip is handed a live tab group, so it follows its events");
    await capture(pocket.el);
    expect(rendered.all(pocket.el, "chip-collapsed").length > 0).toBe(true);
  })}
{/snippet}

<!-- a panel leaves the tab group when it is removed from it -->
{#snippet panelLeaves(
  TabGroups: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <TabGroups onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    for (const name of ["readme", "changelog"])
      await api.addComponentPanel(
        "Label",
        { text: name },
        panel("dock").id(name).title(name)(),
      );
    rendered.only(pocket.el, "group").click();
    await frames();

    api.removePanelFromTabGroup({
      groupId: api.panels[0].api.group.id,
      panelId: "changelog",
    });
    await frames();

    expect(rendered.texts(pocket.el, "chip-size")).toEqual(["1"]);
    expect(
      api.getTabGroupForPanel({
        groupId: api.panels[0].api.group.id,
        panelId: "readme",
      })?.label,
    ).toBe("Docs");
  })}
{/snippet}

<style>
  .toolbar {
    display: flex;
    gap: 6px;
    padding: 6px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
  }

  .toolbar button {
    padding: 3px 8px;
    border: 1px solid #444;
    border-radius: 3px;
    background: #262626;
    color: #ddd;
    font-size: 12px;
    cursor: pointer;
  }

  .toolbar button:hover:not(:disabled) {
    background: #333;
  }
</style>
