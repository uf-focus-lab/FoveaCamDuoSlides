// svg-loader.ts compiles each imported .svg into an inline, style-scoped Vue
// component — so `import Foo from "assets/foo.svg"` is a component, used as <Foo/>.
declare module "*.svg" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    { tagName?: string },
    Record<string, unknown>,
    unknown
  >;
  export default component;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.webm" {
  const src: string;
  export default src;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}
