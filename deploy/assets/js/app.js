import { discoverChapters, getChapterMarkdown } from './chapters.js';

const siteTitle = '多元宇宙系统 — 在线阅读';
const navElement = document.getElementById('nav');
const contentElement = document.getElementById('content');
const homeButtonElement = document.getElementById('home-link');

let chapters = [];

function renderError(message) {
  contentElement.innerHTML = `<div class="error-state">${message}</div>`;
}

function getHash() {
  return decodeURIComponent(location.hash.replace('#', ''));
}

function renderNav(activeFile) {
  navElement.innerHTML = chapters
    .map((chapter) => {
      const activeClass = chapter.file === activeFile ? 'active' : '';
      return `<a class="${activeClass}" href="#${chapter.file}">第${chapter.number}章</a>`;
    })
    .join('');
}

function renderHome() {
  renderNav('');
  document.title = siteTitle;

  if (!chapters.length) {
    contentElement.innerHTML = `
      <h1 class="home-hero">多元宇宙系统</h1>
      <p class="home-subtitle">星际联邦 · 基因觉醒 · 万界征途</p>
      <div class="empty-state">当前还没有可阅读的章节。</div>
    `;
    return;
  }

  const chapterList = chapters
    .map(
      (chapter) =>
        `<li><a href="#${chapter.file}"><span class="ch-num">${String(chapter.number).padStart(2, '0')}</span>${chapter.title}</a></li>`
    )
    .join('');

  contentElement.innerHTML = `
    <h1 class="home-hero">多元宇宙系统</h1>
    <p class="home-subtitle">星际联邦 · 基因觉醒 · 万界征途</p>
    <ul class="chapter-list">${chapterList}</ul>
  `;
}

async function renderChapter(file) {
  const chapterIndex = chapters.findIndex((chapter) => chapter.file === file);
  if (chapterIndex === -1) {
    renderHome();
    return;
  }

  renderNav(file);

  try {
    const markdown = await getChapterMarkdown(file);
    const html = globalThis.marked.parse(markdown);
    const previousLink = chapterIndex > 0
      ? `<a href="#${chapters[chapterIndex - 1].file}">← ${chapters[chapterIndex - 1].title}</a>`
      : '<a class="disabled">← 已是第一章</a>';
    const nextLink = chapterIndex < chapters.length - 1
      ? `<a href="#${chapters[chapterIndex + 1].file}">${chapters[chapterIndex + 1].title} →</a>`
      : '<a class="disabled">已是最新章节 →</a>';

    document.title = `${chapters[chapterIndex].title} — 在线阅读`;
    contentElement.innerHTML = `
      <div class="md-body">${html}</div>
      <div class="page-nav">${previousLink}${nextLink}</div>
    `;
    window.scrollTo(0, 0);
  } catch (error) {
    renderError(error.message);
  }
}

async function route() {
  const hash = getHash();
  if (!hash) {
    renderHome();
    return;
  }

  await renderChapter(hash);
}

function goHome() {
  if (location.hash) {
    location.hash = '';
    return;
  }

  renderHome();
  window.scrollTo(0, 0);
}

async function bootstrap() {
  try {
    chapters = await discoverChapters();
    await route();
  } catch (error) {
    renderError(error.message);
  }
}

homeButtonElement.addEventListener('click', goHome);
window.addEventListener('hashchange', () => {
  void route();
});

void bootstrap();