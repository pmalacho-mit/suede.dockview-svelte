export class ViewPocket<Api> {
  api = $state<Api>();
  ready = ({ api }: { api: Api }) => (this.api = api);
}

export const rendered = {
  all: (container: HTMLElement, testId: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)
    ),
  texts: (container: HTMLElement, testId: string) =>
    rendered
      .all(container, testId)
      .map((element) => element.textContent?.trim() ?? ""),
  rects: (container: HTMLElement, testId: string) =>
    rendered
      .all(container, testId)
      .map((element) => element.getBoundingClientRect()),
  only: (container: HTMLElement, testId: string) => {
    const [element, ...rest] = rendered.all(container, testId);
    if (!element)
      throw new Error(`No element matching [data-testid="${testId}"]`);
    if (rest.length)
      throw new Error(
        `Expected a single [data-testid="${testId}"], found ${rest.length + 1}`
      );
    return element;
  },
};

export const labels = (container: HTMLElement) =>
  rendered.texts(container, "label");

export const themeNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[class]"))
    .flatMap(({ classList }) => Array.from(classList))
    .filter((name) => name.startsWith("dockview-theme-"));

/** Every view mounts its panels into an element tagged with what it renders. */
export const mounted = {
  parts: (container: HTMLElement, target: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        `[data-dockview-svelte^="${target}-"]`
      )
    ),
  rects: (container: HTMLElement, target: string) =>
    mounted.parts(container, target).map((part) => part.getBoundingClientRect()),
};

/** jsdom does no layout: geometry only means something in a real browser. */
export const layout = !navigator.userAgent.includes("jsdom");

export const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(count);
  });

/** A right-click on the dock tab titled `title`, at the pointer or below the tab. */
export const rightClickTab = (
  container: HTMLElement,
  title: string,
  at?: { x: number; y: number },
) => {
  const tab = rendered
    .all(container, "dockview-dv-default-tab")
    .find((it) => it.textContent?.trim().startsWith(title));

  if (!tab) throw new Error(`No tab titled "${title}"`);

  const { left, bottom } = tab.getBoundingClientRect();
  tab.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: at?.x ?? left,
      clientY: at?.y ?? bottom,
    }),
  );
};

export const menuBox = (container: HTMLElement) => {
  const menu = container.querySelector(
    '[data-dockview-svelte="dockcontextmenu"]',
  );
  if (!menu) throw new Error("The context menu is not open");
  return menu.getBoundingClientRect();
};

export const menuItems = (container: HTMLElement) =>
  rendered.texts(container, "menu-item");

export const clickMenuItem = (container: HTMLElement, label: string) => {
  const item = rendered
    .all(container, "menu-item")
    .find((it) => it.textContent?.trim() === label);

  if (!item) throw new Error(`No menu item labelled "${label}"`);
  item.click();
};
