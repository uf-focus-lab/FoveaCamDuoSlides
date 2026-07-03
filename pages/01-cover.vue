<script setup lang="ts">
import { ref } from "vue";
import Focus from "assets/logos/focus.svg";
import ICCP2026 from "assets/logos/iccp-2026.svg";

type Author = {
  name: string;
  initials: string;
  photo: string;
};

const authors: Author[] = [
  {
    name: "Yuxuan Zhang*",
    initials: "YZ",
    photo: "/authors/yuxuan-zhang.webp",
  },
  {
    name: "Jacob Carter*",
    initials: "JC",
    photo: "/authors/jacob-carter.webp",
  },
  {
    name: "Hannah Kirkland",
    initials: "HK",
    photo: "/authors/hannah-kirkland.webp",
  },
  {
    name: "Michael Tomadakis",
    initials: "MT",
    photo: "/authors/michael-tomadakis.webp",
  },
  {
    name: "Noah Ralph",
    initials: "NR",
    photo: "/authors/noah-ralph.webp",
  },
  {
    name: "Sanjeev J. Koppal",
    initials: "SK",
    photo: "/authors/sanjeev-koppal.webp",
  },
];

const failedPhotos = ref<Set<string>>(new Set());

const markPhotoFailed = (name: string) => {
  failedPhotos.value.add(name);
};
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

    <div class="author-grid">
      <figure v-for="author in authors" :key="author.name" class="author-card">
        <img
          v-if="!failedPhotos.has(author.name)"
          :src="author.photo"
          :alt="author.name"
          class="author-photo"
          @error="markPhotoFailed(author.name)"
        />
        <div v-else class="author-photo author-photo-fallback" aria-hidden="true">
          {{ author.initials }}
        </div>
        <figcaption class="author-name">{{ author.name }}</figcaption>
      </figure>
    </div>
  </div>

  <p class="attribution">*equal contribution</p>

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
    height: 2em;
    width: auto;
  }
}
.content {
  top: 48%;
  transform: translateY(-50%);
  flex-direction: column;
  align-items: center;
  text-align: center;
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
  max-width: 30ch;
  b {
    font-weight: 700;
  }
}
.author-grid {
  width: min(100%, 1120px);
  margin-top: 1.3rem;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.9rem;
}
.author-card {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}
.author-photo {
  width: clamp(84px, 11vw, 120px);
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--fc-fg) 35%, transparent);
  box-shadow: 0 8px 20px color-mix(in srgb, #000 26%, transparent);
}
.author-photo-fallback {
  display: grid;
  place-items: center;
  font-size: clamp(1rem, 1.8vw, 1.25rem);
  font-weight: 700;
  color: color-mix(in srgb, var(--fc-fg) 82%, #7dc4ff 18%);
  background:
    radial-gradient(circle at 30% 20%, #ffffff1f, transparent 45%),
    linear-gradient(145deg, #1f2c42, #162032);
}
.author-name {
  font-family: "Times New Roman", serif;
  font-size: clamp(0.86rem, 1.2vw, 1.04rem);
  line-height: 1.2;
  opacity: 0.93;
  text-align: center;
}
p.attribution {
  position: absolute;
  left: 40px;
  bottom: 30px;
  margin: 0;
  font-family: "Times New Roman", serif;
  font-style: italic;
  font-size: 0.95rem;
  opacity: 0.8;
}
@media (max-width: 1100px) {
  .author-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 1rem;
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
