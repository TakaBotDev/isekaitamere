let siteData = null;

async function loadSiteData() {
  if (siteData) return siteData;

  const baseUrl = new URL(window.location.href);
  baseUrl.search = "";
  baseUrl.hash = "";

  const jsonUrl = new URL("./chapters.json", baseUrl);
  jsonUrl.searchParams.set("v", "5");

  const response = await fetch(jsonUrl.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Impossible de charger chapters.json (${response.status})`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.chapters)) {
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

function renderHome(data) {
  document.getElementById("story-title").textContent = data.storyTitle || "Mon histoire";
  document.getElementById("story-subtitle").textContent =
    data.storySubtitle || "";
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
  const sorted = [...data.chapters].sort((a, b) => Number(a.number) - Number(b.number));

  count.textContent = `${sorted.length} chapitre${sorted.length > 1 ? "s" : ""} disponible${sorted.length > 1 ? "s" : ""}.`;

  list.innerHTML = sorted
    .map((chapter) => {
      const formattedDate = formatPublicationDate(chapter.publishedAt);
      return `
        <article
          class="novel-card chapter-card-interactive"
          role="button"
          tabindex="0"
          onclick="openChapter(${chapter.id})"
          onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChapter(${chapter.id}); }"
        >
          <div class="novel-content chapter-row">
            <h3>Chapitre ${chapter.number} — ${escapeHtml(chapter.title)}</h3>
            <span class="chapter-date">${escapeHtml(formattedDate)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function getParagraphs(chapter) {
  if (Array.isArray(chapter.content)) {
    return chapter.content
      .map((paragraph) => String(paragraph).trim())
      .filter(Boolean);
  }

  const normalizedContent = String(chapter.content || "")
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "");

  return normalizedContent
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function openChapter(id) {
  if (!siteData) return;

  const chapter = siteData.chapters.find((item) => Number(item.id) === Number(id));
  if (!chapter) return;

  document.getElementById("chapter-story-title").textContent =
    siteData.storyTitle || "Mon histoire";
  document.getElementById("chapter-subtitle").textContent =
    `Chapitre ${chapter.number} — ${chapter.title}`;

const html = getParagraphs(chapter)
  .map((paragraph) => `<p>${formatInlineText(paragraph)}</p>`)
  .join("");

  document.getElementById("chapter-content").innerHTML =
    html || "<p>Ce chapitre est vide.</p>";

  showView("chapter");
  const url = new URL(window.location.href);
  url.search = `?chapter=${chapter.id}`;
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
