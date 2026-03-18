let siteData = null;

async function loadSiteData() {
  if (siteData) return siteData;

  const response = await fetch("chapters.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger chapters.json");
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

function showView(viewName) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `${viewName}-view`);
  });
}

function goHome() {
  showView("home");
  history.replaceState({}, "", "index.html");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHomeAndScrollToChapters() {
  showView("home");
  history.replaceState({}, "", "index.html#chapitres");
  window.setTimeout(() => {
    const section = document.getElementById("chapitres");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}

function renderHome(data) {
  document.getElementById("story-title").textContent = data.storyTitle || "Mon histoire";
  document.getElementById("story-subtitle").textContent =
    data.storySubtitle || "Une histoire publiée chapitre par chapitre.";
  document.getElementById("story-intro").textContent = data.intro || "";

  const list = document.getElementById("chapters-list");
  const count = document.getElementById("chapters-count");
  const sorted = [...data.chapters].sort((a, b) => Number(a.number) - Number(b.number));

  count.textContent = `${sorted.length} chapitre${sorted.length > 1 ? "s" : ""} disponible${sorted.length > 1 ? "s" : ""}.`;

  list.innerHTML = sorted
    .map((chapter) => `
      <article
        class="novel-card chapter-card-interactive"
        role="button"
        tabindex="0"
        onclick="openChapter(${chapter.id})"
        onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChapter(${chapter.id}); }"
      >
        <div class="novel-content">
          <h3>Chapitre ${chapter.number} — ${escapeHtml(chapter.title)}</h3>
        </div>
      </article>
    `)
    .join("");
}

function openChapter(id) {
  if (!siteData) return;

  const chapter = siteData.chapters.find((item) => Number(item.id) === Number(id));
  if (!chapter) return;

  document.getElementById("chapter-story-title").textContent =
    siteData.storyTitle || "Mon histoire";
  document.getElementById("chapter-subtitle").textContent =
    `Chapitre ${chapter.number} — ${chapter.title}`;

  const html = String(chapter.content || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  document.getElementById("chapter-content").innerHTML =
    html || "<p>Ce chapitre est vide.</p>";

  showView("chapter");
  history.replaceState({}, "", `index.html?chapter=${chapter.id}`);
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
    renderError(
      "Le site n’a pas réussi à charger chapters.json. Sur GitHub Pages, ça fonctionnera normalement. En local, utilise de préférence un petit serveur."
    );
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
