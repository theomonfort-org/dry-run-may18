/**
 * Playbook プレゼンテーション制御
 *
 * 役割:
 *  1. 各 <section data-section> 内のレンダ済みマークダウンを h2 境界で
 *     <div class="slide"> に再グルーピング
 *  2. キーボード操作: ←/→ でスライド、↑/↓ でセクション
 *  3. サイドバー TOC のアクティブ表示同期 / クリックジャンプ
 *  4. URL ハッシュ (#<entry-id>/<slide-1based>) と双方向同期
 *  5. Mermaid コードブロックをアクティブ化時に遅延レンダ
 *  6. モバイル: サイドバートグル
 */

import mermaid from "mermaid";

type Coord = { section: number; slide: number };

const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.debug("[presentation]", ...args);
};

function init() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("section[data-section]"),
  );
  if (sections.length === 0) return;

  // ---- 1. h2 境界でスライドに再分割 ----
  for (const section of sections) {
    splitIntoSlides(section);
  }

  // ---- 2. Mermaid 初期化 ----
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: '"Noto Sans JP", system-ui, sans-serif',
  });

  // ---- 3. 状態管理 ----
  const state: Coord = parseHash(sections) ?? { section: 0, slide: 0 };
  applyState(sections, state);

  // ---- 4. キーボード ----
  window.addEventListener("keydown", (event) => {
    // input/textarea にフォーカスがある場合は無視
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

    let handled = true;
    switch (event.key) {
      case "ArrowRight":
        moveSlide(sections, state, +1);
        break;
      case "ArrowLeft":
        moveSlide(sections, state, -1);
        break;
      case "ArrowDown":
        moveSection(sections, state, +1);
        break;
      case "ArrowUp":
        moveSection(sections, state, -1);
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      applyState(sections, state);
    }
  });

  // ---- 5. TOC クリック ----
  document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]").forEach((a) => {
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const href = a.getAttribute("href") ?? "";
      const parsed = parseHashString(href.replace(/^#/, ""), sections);
      if (parsed) {
        state.section = parsed.section;
        state.slide = parsed.slide;
        applyState(sections, state);
        closeSidebar();
      }
    });
  });

  // ---- 6. URL ハッシュ変更（戻る/進む）に追従 ----
  window.addEventListener("hashchange", () => {
    const parsed = parseHash(sections);
    if (parsed && (parsed.section !== state.section || parsed.slide !== state.slide)) {
      state.section = parsed.section;
      state.slide = parsed.slide;
      applyState(sections, state, { skipHashUpdate: true });
    }
  });

  // ---- 7. サイドバートグル（モバイル） ----
  const toggle = document.querySelector<HTMLButtonElement>("[data-sidebar-toggle]");
  const sidebar = document.querySelector<HTMLElement>("[data-sidebar]");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      const open = sidebar.getAttribute("data-open") === "true";
      sidebar.setAttribute("data-open", open ? "false" : "true");
    });
  }
}

function closeSidebar() {
  const sidebar = document.querySelector<HTMLElement>("[data-sidebar]");
  if (sidebar?.getAttribute("data-open") === "true") {
    sidebar.setAttribute("data-open", "false");
  }
}

/**
 * <section> 内の slide-source の子要素を、h2 境界で .slide にグルーピングする。
 * 最初の h2 の前にあるノードは「スライド 0」（イントロ）として独立させる。
 */
function splitIntoSlides(section: HTMLElement) {
  const source = section.querySelector<HTMLElement>("[data-slide-source]");
  const target = section.querySelector<HTMLElement>("[data-slides]");
  if (!source || !target) return;

  // <Content /> は通常 <article> など 1 つの要素を返すため、その中を見る
  const root: HTMLElement =
    (source.firstElementChild as HTMLElement | null) ?? source;
  const children = Array.from(root.childNodes);

  let current: HTMLDivElement | null = null;
  const slides: HTMLDivElement[] = [];

  const startSlide = () => {
    current = document.createElement("div");
    current.className = "slide";
    slides.push(current);
  };

  for (const node of children) {
    const isH2 =
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName === "H2";
    if (isH2) {
      startSlide();
      current!.appendChild(node);
    } else {
      // 最初の h2 より前のコンテンツも 1 枚にまとめる
      if (!current) startSlide();
      current!.appendChild(node);
    }
  }

  // 空のスライドは除外
  for (const slide of slides) {
    if (slide.childNodes.length > 0) target.appendChild(slide);
  }

  // ソースはもう不要
  source.remove();
}

function applyState(
  sections: HTMLElement[],
  state: Coord,
  opts: { skipHashUpdate?: boolean } = {},
) {
  // 範囲クランプ
  state.section = clamp(state.section, 0, sections.length - 1);
  const slides = slidesIn(sections[state.section]);
  state.slide = clamp(state.slide, 0, Math.max(0, slides.length - 1));

  // セクションの表示切替
  sections.forEach((s, i) => {
    s.setAttribute("data-active", i === state.section ? "true" : "false");
  });

  // スライドの表示切替
  slides.forEach((slide, i) => {
    slide.setAttribute("data-active", i === state.slide ? "true" : "false");
  });

  // TOC ハイライト
  const activeId = sections[state.section]?.dataset.entryId;
  document.querySelectorAll<HTMLElement>("[data-toc-item]").forEach((item) => {
    item.setAttribute(
      "data-active",
      item.dataset.entryId === activeId ? "true" : "false",
    );
  });

  // ステータスバー
  updateStatus(sections, state, slides.length);

  // Mermaid 遅延レンダ
  void renderMermaidIn(slides[state.slide]);

  // URL ハッシュ同期
  if (!opts.skipHashUpdate && activeId) {
    const newHash = `#${activeId}/${state.slide + 1}`;
    if (location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  }
}

function moveSlide(sections: HTMLElement[], state: Coord, delta: number) {
  const slides = slidesIn(sections[state.section]);
  const next = state.slide + delta;
  if (next < 0 || next >= slides.length) return; // 境界で停止
  state.slide = next;
}

function moveSection(sections: HTMLElement[], state: Coord, delta: number) {
  const next = state.section + delta;
  if (next < 0 || next >= sections.length) return;
  state.section = next;
  state.slide = 0;
}

function slidesIn(section: HTMLElement | undefined): HTMLElement[] {
  if (!section) return [];
  return Array.from(section.querySelectorAll<HTMLElement>(":scope .slides > .slide"));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseHash(sections: HTMLElement[]): Coord | null {
  const raw = location.hash.replace(/^#/, "");
  return parseHashString(raw, sections);
}

function parseHashString(raw: string, sections: HTMLElement[]): Coord | null {
  if (!raw) return null;
  const [idRaw, slideRaw] = raw.split("/");
  const id = decodeURIComponent(idRaw ?? "");
  const sectionIndex = sections.findIndex((s) => s.dataset.entryId === id);
  if (sectionIndex < 0) return null;
  const slideOneBased = Number.parseInt(slideRaw ?? "1", 10);
  const slideIndex = Number.isFinite(slideOneBased) ? slideOneBased - 1 : 0;
  return { section: sectionIndex, slide: Math.max(0, slideIndex) };
}

function updateStatus(
  sections: HTMLElement[],
  state: Coord,
  totalSlides: number,
) {
  const positionEl = document.querySelector<HTMLElement>("[data-position]");
  if (positionEl) {
    positionEl.textContent = `SECTION ${state.section + 1}/${sections.length}  ―  SLIDE ${state.slide + 1}/${totalSlides}`;
  }
}

async function renderMermaidIn(slide: HTMLElement | undefined) {
  if (!slide) return;
  // Astro 既定の Shiki は <pre data-language="mermaid"><code>…</code></pre> を吐く。
  // 古い `<code class="language-mermaid">` 形式の両方を拾う。
  const pres = Array.from(
    slide.querySelectorAll<HTMLElement>(
      'pre[data-language="mermaid"], pre:has(code.language-mermaid)',
    ),
  ).filter((pre) => !pre.dataset.mermaidConsumed);

  if (pres.length === 0) return;

  for (const pre of pres) {
    const def = (pre.textContent ?? "").trim();
    if (!def) continue;
    const wrapper = document.createElement("div");
    wrapper.className = "mermaid";
    wrapper.textContent = def;
    pre.replaceWith(wrapper);
    wrapper.dataset.mermaidConsumed = "true";
    try {
      await mermaid.run({ nodes: [wrapper] });
    } catch (err) {
      log("mermaid render error", err);
    }
  }
}

// DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
