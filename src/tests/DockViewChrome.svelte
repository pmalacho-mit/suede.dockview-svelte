<script lang="ts">
  import type {
    IDockviewHeaderActionsProps,
    IDockviewPanelHeaderProps,
    IWatermarkPanelProps,
  } from "dockview";
  import {
    DefaultDockTab,
    DockView,
    themes,
    type DockviewTheme,
    type Theme,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type Self from "./DockViewChrome.svelte";
  import type {
    Test,
    Widen,
  } from "../../suede.sweater-vest/dsl.import.meta.vitest";
  import type { Params } from "./fixtures/Label.svelte";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import DockTab from "./fixtures/DockTab.svelte";
  import { frames, labels, rendered, themeNames } from "./support.svelte";

  export type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  type Variant =
    | "tabbed"
    | "defaultTabbed"
    | "watermarked"
    | "headerActions"
    | "themed"
    | "handRolled";

  let {
    variant = "themed",
    theme = "dark",
    onReady,
  }: {
    variant?: Variant;
    theme?: string;
    onReady?: (event: { api: Api }) => void;
  } = $props();

  /** Settings like `tabAnimation` are reachable only through a theme object. */
  const handRolled = {
    ...themes.dark,
    tabAnimation: "smooth",
  } satisfies DockviewTheme;
</script>

<div data-testid="host" style:width="100%" style:height="300px">
  {#if variant === "tabbed"}
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      tabs={{
        components: { Tab: DockTab, Default: DefaultDockTab },
        snippets: { tab },
      }}
      {onReady}
    />
  {:else if variant === "defaultTabbed"}
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      defaultTab={{ component: DockTab }}
      {onReady}
    />
  {:else if variant === "watermarked"}
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      watermark={{ snippet: watermark }}
      {onReady}
    />
  {:else if variant === "headerActions"}
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      rightHeaderActions={{ snippet: headerActions }}
      {onReady}
    />
  {:else if variant === "handRolled"}
    <DockView
      theme={handRolled}
      components={{ Label: DockLabel }}
      {onReady}
    />
  {:else}
    <DockView
      theme={theme as Theme}
      components={{ Label: DockLabel }}
      {onReady}
    />
  {/if}
</div>

{#snippet tab({ params }: IDockviewPanelHeaderProps<Params>)}
  <span data-testid="tab">snippet tab for {params.text}</span>
{/snippet}

{#snippet watermark(_: IWatermarkPanelProps)}
  <span data-testid="watermark">nothing open</span>
{/snippet}

{#snippet headerActions({ panels }: IDockviewHeaderActionsProps)}
  <span data-testid="panel-count">{panels.length} panel(s)</span>
{/snippet}

<!-- a tab component renders in place of the default tab -->
{#snippet tabComponent(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="tabbed" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").tabComponent("Tab")(),
    );

    await capture(pocket.el);
    expect(rendered.texts(pocket.el, "tab")).toEqual(["tab for first"]);
  })}
{/snippet}

<!-- a tab component is told where it is rendered -->
{#snippet tabLocation(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="tabbed" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").tabComponent("Tab")(),
    );

    expect(rendered.texts(pocket.el, "tab-location")).toEqual(["header"]);
  })}
{/snippet}

<!-- a tab snippet renders in place of the default tab -->
{#snippet tabSnippet(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="tabbed" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").tabComponent("tab")(),
    );

    expect(rendered.texts(pocket.el, "tab")).toEqual([
      "snippet tab for first",
    ]);
  })}
{/snippet}

<!-- the default tab covers panels that do not name a tab -->
{#snippet defaultTabCovers(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome
      variant="defaultTabbed"
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel("Label", { text: "first" });

    expect(rendered.texts(pocket.el, "tab")).toEqual(["tab for first"]);
  })}
{/snippet}

<!-- the default tab closes the panel it belongs to -->
{#snippet defaultTabCloses(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="tabbed" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").tabComponent("Default")(),
    );

    // A tab cancels `pointerdown` to keep focus where it was, and `userEvent`
    // answers that by cancelling the click it would otherwise emulate.
    const tab = rendered.only(pocket.el, "dockview-dv-default-tab");
    const button = tab.querySelector(".dv-default-tab-action");
    if (!(button instanceof HTMLElement))
      throw new Error("The default tab rendered without a close button");
    button.click();
    await frames();

    expect(pocket.api.panels).toHaveLength(0);
    expect(labels(pocket.el)).toEqual([]);
  })}
{/snippet}

<!-- the default tab closes the panel it belongs to from the keyboard -->
{#snippet defaultTabClosesFromKeyboard(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="tabbed" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, user }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").tabComponent("Default")(),
    );

    const tab = rendered.only(pocket.el, "dockview-dv-default-tab");
    const button = tab.querySelector(".dv-default-tab-action");
    if (!(button instanceof HTMLElement))
      throw new Error("The default tab rendered without a close button");
    button.focus();
    await user.keyboard("{Enter}");
    await frames();

    expect(pocket.api.panels).toHaveLength(0);
  })}
{/snippet}

<!-- the watermark shows until the first panel is added -->
{#snippet watermarkShows(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="watermarked" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await capture(pocket.el);
    expect(rendered.texts(pocket.el, "watermark")).toEqual(["nothing open"]);

    await pocket.api.addComponentPanel("Label", { text: "first" });

    expect(rendered.all(pocket.el, "watermark")).toEqual([]);
  })}
{/snippet}

<!-- header actions follow the panels of their group -->
{#snippet headerActionsFollow(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome
      variant="headerActions"
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first")(),
    );
    expect(rendered.texts(pocket.el, "panel-count")).toEqual(["1 panel(s)"]);

    await api.addComponentPanel(
      "Label",
      { text: "second" },
      panel("dock").id("second")(),
    );
    await frames();

    await capture(pocket.el);
    expect(rendered.texts(pocket.el, "panel-count")).toEqual(["2 panel(s)"]);
  })}
{/snippet}

<!-- the theme class follows the theme prop -->
{#snippet themeFollows(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement; theme: Widen<"dark"> },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome
      theme={pocket.theme}
      onReady={({ api }) => (pocket.api = api)}
    />
  </div>
  {test(async ({ expect, waitFor, flushSync }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    expect(themeNames(pocket.el)).toEqual(["dockview-theme-dark"]);

    pocket.theme = "dracula";
    flushSync();
    await frames();

    expect(themeNames(pocket.el)).toEqual(["dockview-theme-dracula"]);
  })}
{/snippet}

<!-- the theme prop also takes a theme object -->
{#snippet themeObject(
  Chrome: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.el}>
    <Chrome variant="handRolled" onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());

    await pocket.api.addComponentPanel("Label", { text: "first" });

    expect(themeNames(pocket.el)).toEqual([themes.dark.className]);
  })}
{/snippet}
