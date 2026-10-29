<script lang="ts">
  import {
    createLayoutHistory,
    DockView,
    type LayoutHistory,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./LayoutHistory.svelte";
  import type { Test, Widen } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import { frames, labels, rendered } from "./support.svelte";

  export type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  let {
    text = $bindable("before"),
    onReady,
  }: {
    text?: string;
    onReady?: (event: { api: Api }) => void;
  } = $props();

  let api = $state.raw<Api>();
  let history = $state.raw<LayoutHistory>();
  let added = 0;

  /**
   * Buttons drive the api, so this records api-origin mutations too. Left at
   * the default an undo stack follows user gestures only.
   */
  const ready = (event: { api: Api }) => {
    history = createLayoutHistory(event.api, { origins: ["user", "api"] });
    api = event.api;
    onReady?.(event);
  };

  export const add = async (options?: { reactive: true }) => {
    const id = `panel ${++added}`;
    await api?.addComponentPanel(
      "Label",
      { text: options ? api.reactive(() => text) : id },
      panel("dock").id(id).title(id)()
    );
  };

  const closeActive = () => api?.activePanel?.api.close();
</script>

<div
  style:display="flex"
  style:flex-direction="column"
  style:width="100%"
  style:height="300px"
>
  <div class="toolbar">
    <button type="button" data-testid="add" onclick={() => add()}>
      Add a panel
    </button>
    <button type="button" data-testid="close" onclick={closeActive}>
      Close the active panel
    </button>
    <button
      type="button"
      data-testid="undo"
      disabled={!history?.canUndo}
      onclick={() => history?.undo()}
    >
      Undo ({history?.undoCount ?? 0})
    </button>
    <button
      type="button"
      data-testid="redo"
      disabled={!history?.canRedo}
      onclick={() => history?.redo()}
    >
      Redo ({history?.redoCount ?? 0})
    </button>
  </div>

  <div style:flex="1" style:min-height="0">
    <DockView theme="dark" components={{ Label: DockLabel }} onReady={ready} />
  </div>
</div>

<!-- undo steps back over the last change, redo returns to it -->
{#snippet undoes(
  History: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <History onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const click = (id: string) => rendered.only(pocket.el, id).click();
    const ids = () => api.panels.map(({ id }) => id);

    click("add");
    await frames();
    click("add");
    await frames();
    expect(ids()).toEqual(["panel 1", "panel 2"]);

    click("undo");
    await frames();
    expect(ids()).toEqual(["panel 1"]);
    expect((rendered.only(pocket.el, "redo") as HTMLButtonElement).disabled).toBe(false);

    click("redo");
    await frames();

    await capture(pocket.el);
    expect(ids()).toEqual(["panel 1", "panel 2"]);
    expect((rendered.only(pocket.el, "redo") as HTMLButtonElement).disabled).toBe(true);
  })}
{/snippet}

<!-- the buttons follow what is on the stacks -->
{#snippet follows(
  History: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <History onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const click = (id: string) => rendered.only(pocket.el, id).click();
    const button = (id: string) =>
      rendered.only(pocket.el, id) as HTMLButtonElement;

    expect(button("undo").disabled).toBe(true);
    expect(button("redo").disabled).toBe(true);

    click("add");
    await frames();

    note("`canUndo` is reactive, so the button binds straight to it");
    expect(button("undo").disabled).toBe(false);
    expect(button("undo").textContent).toContain("Undo (1)");

    click("undo");
    await frames();

    expect(button("undo").disabled).toBe(true);
    expect(button("redo").disabled).toBe(false);
  })}
{/snippet}

<!-- closing a panel is undone too -->
{#snippet closes(
  History: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <History onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const click = (id: string) => rendered.only(pocket.el, id).click();

    click("add");
    await frames();
    click("close");
    await frames();
    expect(api.panels).toHaveLength(0);

    click("undo");
    await frames();

    expect(api.panels.map(({ id }) => id)).toEqual(["panel 1"]);
  })}
{/snippet}

<!-- reactive params survive an undo -->
{#snippet survivesUndo(
  History: typeof Self,
  pocket: { api: Api; el: HTMLDivElement; history: Self; text: Widen<"before"> },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <History
      bind:this={pocket.history}
      bind:text={pocket.text}
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const click = (id: string) => rendered.only(pocket.el, id).click();

    await pocket.history.add({ reactive: true });
    click("add");
    await frames();

    click("undo");
    await frames();

    pocket.text = "after";
    await frames();

    note(
      "`reuseExistingPanels` kept the panel instance, so its subscribers are still attached"
    );
    expect(labels(pocket.el)).toEqual(["after"]);
  })}
{/snippet}

<!-- reactive params do not survive a rebuild that replaces panels -->
{#snippet doesNotSurviveRebuild(
  History: typeof Self,
  pocket: { api: Api; el: HTMLDivElement; history: Self; text: Widen<"before"> },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <History
      bind:this={pocket.history}
      bind:text={pocket.text}
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor, note }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await pocket.history.add({ reactive: true });
    api.fromJSON(api.toJSON());
    await frames();

    pocket.text = "after";
    await frames();

    note(
      "without `reuseExistingPanels` the panel is rebuilt, and the new instance has no subscribers"
    );
    expect(labels(pocket.el)).toEqual(["before"]);
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

  .toolbar button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .toolbar button:hover:not(:disabled) {
    background: #333;
  }
</style>
