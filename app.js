let siteData = null;

async function loadSiteData() {
  if (siteData) return siteData;

  const baseUrl = new URL(window.location.href);
  baseUrl.search = "";
  baseUrl.hash = "";

  const jsonUrl = new URL("./chapters.json", baseUrl);
  jsonUrl.searchParams.set("v", "12");

  const response = await fetch(jsonUrl.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Impossible de charger chapters.json (${response.status})`);
  }

  const data = await response.json();
  if (
    !data ||
    (!Array.isArray(data.chapters) && !Array.isArray(data.arcs))
  ) {
    throw new Error("Le fichier chapters.json est invalide.");
  }

  siteData = data;
  return data;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInlineText(text) {
  const escaped = escapeHtml(text);

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function showView(viewName) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `${viewName}-view`);
  });
}

function goHome() {
  showView("home");
  history.replaceState({}, "", window.location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHomeAndScrollToChapters() {
  showView("home");
  history.replaceState({}, "", `${window.location.pathname}#chapitres`);
  window.setTimeout(() => {
    const section = document.getElementById("chapitres");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}

function formatPublicationDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getChapterLabel(chapter) {
  if (chapter.label) return chapter.label;
  return `Chapitre ${chapter.number}`;
}

function getAllChapters(data) {
  if (Array.isArray(data.chapters)) {
    return [...data.chapters];
  }

  if (Array.isArray(data.arcs)) {
    return data.arcs.flatMap((arc) =>
      Array.isArray(arc.chapters)
        ? arc.chapters.map((chapter) => ({
            ...chapter,
            arcTitle: arc.title
          }))
        : []
    );
  }

  return [];
}

function renderHome(data) {
  document.getElementById("story-title").textContent = data.storyTitle || "Mon histoire";
  document.getElementById("story-subtitle").textContent = data.storySubtitle || "";

  const introElement = document.getElementById("story-intro");
  const introParagraphs = Array.isArray(data.intro)
    ? data.intro
    : [String(data.intro || "")];

  introElement.innerHTML = introParagraphs
    .map((paragraph) => String(paragraph).trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${formatInlineText(paragraph)}</p>`)
    .join("");

  const list = document.getElementById("chapters-list");
  const count = document.getElementById("chapters-count");

  const allChapters = getAllChapters(data).sort((a, b) => Number(a.number) - Number(b.number));
  count.textContent = `${allChapters.length} chapitre${allChapters.length > 1 ? "s" : ""} disponible${allChapters.length > 1 ? "s" : ""}.`;

  if (Array.isArray(data.arcs)) {
    list.innerHTML = data.arcs
      .map((arc) => {
        const chapters = [...(arc.chapters || [])].sort((a, b) => Number(a.number) - Number(b.number));

        return `
          <section class="arc-block">
            <h3 class="arc-title">${escapeHtml(arc.title)}</h3>
            <div class="arc-chapters">
              ${chapters
                .map((chapter) => {
                  const formattedDate = formatPublicationDate(chapter.publishedAt);
                  const label = getChapterLabel(chapter);
                  const safeId = String(chapter.id).replaceAll("'", "\\'");

                  return `
                    <article
                      class="novel-card chapter-card-interactive"
                      role="button"
                      tabindex="0"
                      onclick="openChapter('${safeId}')"
                      onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChapter('${safeId}'); }"
                    >
                      <div class="novel-content chapter-row">
                        <h3>${escapeHtml(label)} — ${escapeHtml(chapter.title)}</h3>
                        <span class="chapter-date">${escapeHtml(formattedDate)}</span>
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          </section>
        `;
      })
      .join("");
  } else {
    const sorted = [...data.chapters].sort((a, b) => Number(a.number) - Number(b.number));

    list.innerHTML = sorted
      .map((chapter) => {
        const formattedDate = formatPublicationDate(chapter.publishedAt);
        const label = getChapterLabel(chapter);
        const safeId = String(chapter.id).replaceAll("'", "\\'");

        return `
          <article
            class="novel-card chapter-card-interactive"
            role="button"
            tabindex="0"
            onclick="openChapter('${safeId}')"
            onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChapter('${safeId}'); }"
          >
            <div class="novel-content chapter-row">
              <h3>${escapeHtml(label)} — ${escapeHtml(chapter.title)}</h3>
              <span class="chapter-date">${escapeHtml(formattedDate)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }
}

function normalizeLegacyStringContent(text) {
  return String(text || "")
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "text",
      text: paragraph
    }));
}

function normalizeContentArray(content) {
  return content
    .map((item) => {
      if (typeof item === "string") {
        return {
          type: "text",
          text: item
        };
      }

      if (item && typeof item === "object") {
        return item;
      }

      return null;
    })
    .filter(Boolean);
}

async function getContentBlocks(chapter) {
  if (Array.isArray(chapter.content)) {
    return normalizeContentArray(chapter.content);
  }

  if (typeof chapter.content === "string") {
    return normalizeLegacyStringContent(chapter.content);
  }

  if (chapter.file) {
    const baseUrl = new URL(window.location.href);
    baseUrl.search = "";
    baseUrl.hash = "";

    const fileUrl = new URL(chapter.file, baseUrl);
    fileUrl.searchParams.set("v", "12");

    const response = await fetch(fileUrl.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Impossible de charger ${chapter.file} (${response.status})`);
    }

    const fileData = await response.json();

    if (Array.isArray(fileData.content)) {
      return normalizeContentArray(fileData.content);
    }

    if (typeof fileData.content === "string") {
      return normalizeLegacyStringContent(fileData.content);
    }

    return [];
  }

  return [];
}

function revealSpoilerImage(button) {
  const container = button.closest("[data-spoiler-image]");
  if (!container) return;

  const content = container.querySelector(".spoiler-image-content");
  if (!content) return;

  content.classList.remove("hidden");
  button.remove();
}

function renderContentBlock(block) {
  if (!block || typeof block !== "object") return "";

  if (block.type === "image") {
    const src = escapeHtml(block.src || "");
    const alt = escapeHtml(block.alt || "");
    const caption = block.caption
      ? `<figcaption class="chapter-image-caption">${formatInlineText(block.caption)}</figcaption>`
      : "";

    return `
      <figure class="chapter-image-block">
        <img src="${src}" alt="${alt}" class="chapter-image" />
        ${caption}
      </figure>
    `;
  }

  if (block.type === "spoiler-image") {
    const src = escapeHtml(block.src || "");
    const alt = escapeHtml(block.alt || "");
    const buttonText = escapeHtml(block.buttonText || "Afficher l'image");
    const caption = block.caption
      ? `<figcaption class="chapter-image-caption">${formatInlineText(block.caption)}</figcaption>`
      : "";

    return `
      <figure class="chapter-image-block spoiler-image-block" data-spoiler-image>
        <button
          type="button"
          class="spoiler-image-button"
          onclick="revealSpoilerImage(this)"
        >
          ${buttonText}
        </button>

        <div class="spoiler-image-content hidden">
          <img src="${src}" alt="${alt}" class="chapter-image" />
          ${caption}
        </div>
      </figure>
    `;
  }

  if (block.type === "text" || block.type === "texte" || block.type === "paragraph") {
    return `<p>${formatInlineText(block.text || "")}</p>`;
  }

  return "";
}

async function openChapter(id) {
  if (!siteData) return;

  const chapter = getAllChapters(siteData).find((item) => String(item.id) === String(id));
  if (!chapter) return;

  document.getElementById("chapter-story-title").textContent =
    siteData.storyTitle || "Mon histoire";
  document.getElementById("chapter-subtitle").textContent =
    `${getChapterLabel(chapter)} — ${chapter.title}`;

  try {
    const blocks = await getContentBlocks(chapter);

    const html = blocks
      .map((block) => renderContentBlock(block))
      .join("");

    document.getElementById("chapter-content").innerHTML =
      html || "<p>Ce chapitre est vide.</p>";
  } catch (error) {
    document.getElementById("chapter-content").innerHTML =
      `<p>Impossible de charger ce chapitre. ${escapeHtml(error.message)}</p>`;
    console.error(error);
  }

  showView("chapter");

  const url = new URL(window.location.href);
  url.search = `?chapter=${encodeURIComponent(chapter.id)}`;
  url.hash = "";
  history.replaceState({}, "", url.toString());

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderError(message) {
  const error = document.getElementById("error-message");
  error.textContent = message;
  error.classList.remove("hidden");
  document.getElementById("chapters-count").textContent = "Impossible de charger les chapitres.";
}

function openChapterFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("chapter");

  if (chapterId && siteData) {
    openChapter(chapterId);
  } else {
    showView("home");
  }
}

async function init() {
  try {
    const data = await loadSiteData();
    renderHome(data);
    openChapterFromUrl();
  } catch (error) {
    renderError(`Le site n’a pas réussi à charger chapters.json. ${error.message}`);
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
