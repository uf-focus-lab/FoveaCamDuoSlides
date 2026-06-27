import { h, type FunctionalComponent, type StyleValue } from "vue";

type CameraProps = {
  /** Edge length of the cube in pixels */
  cube?: number;
  /** Lens length in pixels */
  lens?: number;
  /** Border radius for cube corners in pixels */
  R?: number;
  /** Optional text label inside the cube */
  label?: string;
  /** Optional delta Y */
  dy?: number;
};

function createCameraPath({
  cube = 80,
  lens = 80,
  R = 4,
  dy = 0,
}: CameraProps): string {
  const shaftLength = (lens - 20) / 2;
  const edge = cube - R * 2;
  return [
    `M-30,${(lens - cube) / 2 + dy}`,
    `h${30 - edge / 2} a${R},${R},0,0,0,-${R},${R}`,
    `v${edge} a${R},${R},0,0,0,${R},${R}`,
    `h${edge} a${R},${R},0,0,0,${R},${-R}`,
    `v${-edge} a${R},${R},0,0,0,${-R},${-R}`,
    `h${30 - edge / 2}`,
    `v-10 l10,-10 v${-shaftLength}`,
    `l5,-5 v${-(shaftLength - 5)}`,
    `h-5 v5 a120,120,0,0,0,-80,0 v-5 h-5`,
    `v${shaftLength - 5} l5,5`,
    `v${shaftLength} l10,10 v10`,
    `Z`,
  ].join(" ");
}

// Functional component: renders the camera outline in a <g>. The path fills
// with `currentColor`; an incoming `fill` attr is rewritten as the group's CSS
// `color` so the path — and any slotted content — inherits it. `transform` and
// `class` stay on the root <g> (so slotted content moves/styles with it); other
// paint attrs (stroke, stroke-*, …) still forward down to the <path>.
const CameraModel: FunctionalComponent<CameraProps> = (
  props,
  { attrs, slots },
) => {
  const { cube = 80, lens = 80, dy = 0 } = props;
  const d = createCameraPath(props);
  const timing = "var(--transition-duration) var(--transition-curve)";
  const pathStyle: StyleValue = {
    d: `path('${d}')`,
    transition: `d ${timing}`,
  };

  const {
    fill,
    transform,
    class: className,
    style: attrStyle,
    ...rest
  } = attrs;

  function createLabelElement() {
    if (props.label === undefined) return null;
    const fontSize = cube * 0.6;
    const offsetY = lens / 2 + fontSize / 8 + dy;
    const style: StyleValue = {
      transform: `translateY(${offsetY}px)`,
      transition: `transform ${timing}`,
    };
    return h(
      "text",
      { style },
      h(
        "tspan",
        {
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-size": fontSize,
          "font-weight": 800,
          "font-family": "Arial, sans-serif",
          stroke: "black",
          fill: "white",
          "stroke-width": cube / 10,
          "stroke-linejoin": "round",
          "paint-order": "stroke fill",
        },
        props.label,
      ),
    );
  }

  return h(
    "g",
    {
      class: className,
      transform,
      style: [{ color: fill as string | undefined }, attrStyle as StyleValue],
    },
    [
      slots.default?.(),
      h("path", {
        stroke: "var(--fc-fg)",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        ...rest,
        fill: "currentColor",
        d,
        style: pathStyle,
      }),
      createLabelElement(),
    ],
  );
};

CameraModel.props = {
  cube: { type: Number, default: 80 },
  lens: { type: Number, default: 80 },
  R: { type: Number, default: 4 },
  label: { type: String, required: false },
  dy: { type: Number, default: 0 },
};
// Keep forwarded attrs off the <g> so they only land on the <path>.
CameraModel.inheritAttrs = false;

export default CameraModel;
