<script setup lang="ts">
import Focus from "assets/logos/focus.svg";
import ICCP2026 from "assets/logos/iccp-2026.svg";
</script>

<template>
  <div class="heading">
    <ICCP2026 />
  </div>
  <div class="content">
    <h1>
      <b class="brand-text">FoveaCam Duo</b>: Foveated Stereo for Standoff Depth
      Sensing
    </h1>

    <p class="authors">
      Yuxuan Zhang*, Jacob Carter*, Hannah Kirkland, Michael Tomadakis, Noah
      Ralph, Sanjeev J. Koppal<br />
      <span class="attribution">*equal contribution</span>
    </p>
  </div>

  <div class="footer">
    <a
      href="https://z-yx.cc/FOCUS"
      class="focus-lab-logo"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Focus role="img" aria-label="FOCUS Lab" />
      <span class="focus-lab-suffix">Lab</span>
    </a>
    <div class="h-div"></div>
    <img
      src="assets/logos/uf-ece.webp"
      alt="University of Florida ECE"
      class="uf-ece-logo"
    />
  </div>
</template>

<style scoped lang="scss">
.heading,
.content,
.footer {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  padding: 40px;
  gap: 10px;
}
.heading {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  svg {
    height: 1.4em;
    width: auto;
  }
}
.content {
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
}
.footer {
  bottom: 0;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}
h1 {
  font-size: 3.2rem;
  line-height: 1.2;
  font-weight: 400;
  b {
    font-weight: 700;
  }
}
p.authors {
  font-family: "Times New Roman", serif;
  font-size: 1.3em;
  line-height: 1.6;
  font-weight: 400;
  opacity: 0.9;
  letter-spacing: 0.01em;
  .attribution {
    font-style: italic;
    font-size: 0.9em;
    opacity: 0.8;
  }
}
.focus-lab-logo {
  display: flex;
  color: white;
  font-weight: bold;
  text-decoration: none;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  gap: 0.5ch;
  user-select: none;
}
.focus-lab-suffix {
  line-height: 80%;
}
.uf-ece-logo {
  filter: brightness(0) invert(1);
  height: 1.2em;
  transform: translateY(2px);
}
div.h-div {
  width: 1px;
  height: 1.4em;
  background: var(--fc-fg);
  margin: 0 10px;
}
div.v-div {
  width: 100%;
  height: 1px;
  background: var(--fc-fg);
}
</style>
