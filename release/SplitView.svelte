<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { PanelProps } from "./index.js";
  import {
    SplitviewApi,
    type PanelViewInitParameters,
    SplitviewPanel,
    type IFrameworkPart,
    PROPERTY_KEYS_SPLITVIEW,
    type SplitviewFrameworkOptions,
    createSplitview,
  } from "dockview";
  import {
    type ComponentsConstraint,
    type SnippetsConstraint,
    type ModifiedProps,
    type ViewAPI,
    getComponentToMount,
    extractCoreOptions,
    createExtendedAPI,
  } from "./utils/index.js";
  import PanelRendererBase, {
    type ConstructorConfigWithout,
  } from "./utils/PanelRendererBase.js";

  let splitCount = 0;

  type Params = { text: string };
  type Api = ViewAPI<"split", {}, { label: Snippet<[PanelProps<"split", Params>]> }>;

  class SvelteGridviewPanel<
    Props extends Record<string, any>,
  > extends SplitviewPanel {
    private renderer: PanelRendererBase<Props, PanelViewInitParameters>;

    constructor(
      config: ConstructorConfigWithout<Props, PanelViewInitParameters>
    ) {
      super(config.id, config.name);
      const self = this;
      this.renderer = new PanelRendererBase({
        ...config,
        element: this.element,
        panelTarget: "split",
        initOptionsToProps: (options) =>
          ({
            params: options?.params ?? {},
            api: self.api,
            containerApi: new SplitviewApi(options.accessor),
          }) as any as Props,
      });
    }

    getComponent(): IFrameworkPart {
      this.renderer.init(this._params as PanelViewInitParameters);
      return this.renderer;
    }
  }
</script>

<script
  lang="ts"
  generics="
    const Components extends ComponentsConstraint<`split`>,
    const Snippets extends SnippetsConstraint<`split`>,
  "
>
  import { onDestroy, onMount } from "svelte";
  import type Self from "./SplitView.svelte";
  import type { Test, Sweater } from "../suede.sweater-vest/dsl.import.meta.vitest";
  import { panel } from "./config.js";

  let {
    components,
    snippets,
    onReady,
    ...props
  }: ModifiedProps<"split", Components, Snippets> = $props();

  const index = splitCount++;

  let splitView: ViewAPI<"split", Components, Snippets>;

  for (const key of PROPERTY_KEYS_SPLITVIEW)
    $effect(() => splitView!?.updateOptions({ [key]: props[key] }));

  const frameworkOptions: SplitviewFrameworkOptions = {
    createComponent: (options) => {
      const { component, propsPostProcessor, name } = getComponentToMount(
        "split",
        components,
        snippets,
        options
      );
      return new SvelteGridviewPanel({
        id: options.id,
        name,
        svelteComponent: component,
        viewIndex: index,
        propsPostProcessor,
      });
    },
  };

  let element = $state<HTMLElement>();

  onMount(() => {
    const api = createSplitview(element!, {
      ...extractCoreOptions(props, PROPERTY_KEYS_SPLITVIEW),
      ...frameworkOptions,
    });
    splitView = Object.assign(
      api,
      createExtendedAPI<"split", Components, Snippets>("split", api, index)
    );

    const { clientWidth, clientHeight } = element!;
    splitView.layout(clientWidth, clientHeight);

    onReady?.({ api: splitView });
  });

  onDestroy(() => {
    splitView?.dispose();
  });
</script>

<div
  id={`split${index}`}
  bind:this={element}
  style:width="100%"
  style:height="100%"
></div>

<!-- Tests: dormant unless sweater-vest is installed, and erased from builds. -->

<!-- snippet panels fill the view in the order they are added -->
{#snippet fills(
  SplitView: typeof Self,
  Status: typeof Sweater.Status,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  {#snippet label({ params }: PanelProps<"split", Params>)}
    <span data-testid="label">{params.text}</span>
  {/snippet}
  <Status {test} />
  <div data-testid="host" style:width="100%" style:height="300px" bind:this={pocket.el}>
    <SplitView orientation="HORIZONTAL" snippets={{ label }} onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor, capture }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;

    await api.addSnippetPanel("label", { text: "first" }, panel("split").id("first")());
    await api.addSnippetPanel("label", { text: "second" }, panel("split").id("second")());

    await capture(pocket.el);
    const labels = [...pocket.el.querySelectorAll("[data-testid=label]")];
    expect(labels.map((label) => label.textContent)).toEqual(["first", "second"]);
  })}
{/snippet}

<!-- size decides how much room a panel takes -->
{#snippet sizes(
  SplitView: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  {#snippet label({ params }: PanelProps<"split", Params>)}
    <span data-testid="label">{params.text}</span>
  {/snippet}
  <div data-testid="host" style:width="100%" style:height="300px" bind:this={pocket.el}>
    <SplitView orientation="HORIZONTAL" snippets={{ label }} onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const add = (id: string, build = panel("split").id(id)) =>
      api.addSnippetPanel("label", { text: id }, build());
    const texts = () =>
      [...pocket.el.querySelectorAll("[data-testid=label]")].map((label) => label.textContent);
    // jsdom does no layout, so geometry is only asserted in a real browser
    const rects = () =>
      [...pocket.el.querySelectorAll('[data-dockview-svelte^="split-"]')].map((part) => part.getBoundingClientRect());
    const layout = !navigator.userAgent.includes("jsdom");

    await add("first");
    await add("second", panel("split").id("second").size(150));

    if (layout) expect(Math.round(rects()[1].width)).toBe(150);
  })}
{/snippet}

<!-- a vertical splitview stacks its panels -->
{#snippet stacks(
  SplitView: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  {#snippet label({ params }: PanelProps<"split", Params>)}
    <span data-testid="label">{params.text}</span>
  {/snippet}
  <div data-testid="host" style:width="100%" style:height="300px" bind:this={pocket.el}>
    <SplitView orientation="VERTICAL" snippets={{ label }} onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const add = (id: string, build = panel("split").id(id)) =>
      api.addSnippetPanel("label", { text: id }, build());
    const texts = () =>
      [...pocket.el.querySelectorAll("[data-testid=label]")].map((label) => label.textContent);
    // jsdom does no layout, so geometry is only asserted in a real browser
    const rects = () =>
      [...pocket.el.querySelectorAll('[data-dockview-svelte^="split-"]')].map((part) => part.getBoundingClientRect());
    const layout = !navigator.userAgent.includes("jsdom");

    await add("first");
    await add("second");

    const [above, below] = rects();
    if (layout) {
      expect(above.top).toBeLessThan(below.top);
      expect(above.left).toBe(below.left);
    }
  })}
{/snippet}

<!-- index puts a panel ahead of its siblings -->
{#snippet indexes(
  SplitView: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  {#snippet label({ params }: PanelProps<"split", Params>)}
    <span data-testid="label">{params.text}</span>
  {/snippet}
  <div data-testid="host" style:width="100%" style:height="300px" bind:this={pocket.el}>
    <SplitView orientation="HORIZONTAL" snippets={{ label }} onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const add = (id: string, build = panel("split").id(id)) =>
      api.addSnippetPanel("label", { text: id }, build());
    const texts = () =>
      [...pocket.el.querySelectorAll("[data-testid=label]")].map((label) => label.textContent);
    // jsdom does no layout, so geometry is only asserted in a real browser
    const rects = () =>
      [...pocket.el.querySelectorAll('[data-dockview-svelte^="split-"]')].map((part) => part.getBoundingClientRect());
    const layout = !navigator.userAgent.includes("jsdom");

    await add("second");
    await add("first", panel("split").id("first").index(0));

    expect(texts()).toEqual(["first", "second"]);
    expect(api.panels.map(({ id }: { id: string }) => id)).toEqual(["first", "second"]);
  })}
{/snippet}

<!-- removePanel takes a panel back out of the view -->
{#snippet removes(
  SplitView: typeof Self,
  pocket: { api: Api; el: HTMLDivElement },
  test: Test,
)}
  {#snippet label({ params }: PanelProps<"split", Params>)}
    <span data-testid="label">{params.text}</span>
  {/snippet}
  <div data-testid="host" style:width="100%" style:height="300px" bind:this={pocket.el}>
    <SplitView orientation="HORIZONTAL" snippets={{ label }} onReady={({ api }) => (pocket.api = api)} />
  </div>
  {test(async ({ expect, waitFor }) => {
    await waitFor(() => expect(pocket.api).toBeDefined());
    const { api } = pocket;
    const add = (id: string, build = panel("split").id(id)) =>
      api.addSnippetPanel("label", { text: id }, build());
    const texts = () =>
      [...pocket.el.querySelectorAll("[data-testid=label]")].map((label) => label.textContent);
    // jsdom does no layout, so geometry is only asserted in a real browser
    const rects = () =>
      [...pocket.el.querySelectorAll('[data-dockview-svelte^="split-"]')].map((part) => part.getBoundingClientRect());
    const layout = !navigator.userAgent.includes("jsdom");

    await add("first");
    const second = await add("second");

    api.removePanel(second.panel);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(api.panels).toHaveLength(1);
    expect(texts()).toEqual(["first"]);
  })}
{/snippet}
