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
};

function createCameraPath({
  cube = 80,
  lens = 80,
  R = 4,
}: CameraProps): string {
  const shaftLength = (lens - 20) / 2;
  const edge = cube - R * 2;
  return [
    `M-30,${(lens - cube) / 2}`,
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
  const { cube = 80, lens = 80 } = props;
  const d = createCameraPath(props);
  const pathStyle: StyleValue = { d: `path('${d}')`, transition: "d .5s ease" };

  const { fill, transform, class: klass, style: attrStyle, ...rest } = attrs;

  return h(
    "g",
    { class: klass, transform, style: { color: fill as string | undefined } },
    [
      slots.default?.(),
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        ...rest,
        fill: "currentColor",
        d,
        style: [pathStyle, attrStyle as StyleValue],
      }),
      props.label === undefined
        ? null
        : h(
            "text",
            {
              style: {
                transform: `translateY(${(lens + cube) / 2 - 32}px)`,
                transition: "transform .5s ease",
              },
            },
            [
              h(
                "tspan",
                {
                  x: 0,
                  "text-anchor": "middle",
                  "dominant-baseline": "middle",
                  "font-size": cube * 0.75,
                  "font-weight": 800,
                  stroke: "black",
                  fill: "white",
                  "stroke-width": cube / 20,
                },
                props.label,
              ),
            ],
          ),
    ],
  );
};

CameraModel.props = {
  cube: { type: Number, default: 80 },
  lens: { type: Number, default: 80 },
  R: { type: Number, default: 4 },
  label: { type: String, required: false },
};
// Keep forwarded attrs off the <g> so they only land on the <path>.
CameraModel.inheritAttrs = false;

export default CameraModel;
