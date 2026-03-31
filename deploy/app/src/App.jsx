import { useEffect, useState } from 'react';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const chapterCache = new Map();

function getHashChapter() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ''));
}

function normalizeChapter(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const file = typeof entry.file === 'string' ? entry.file.trim() : '';
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';
  const number = Number.parseInt(entry.number, 10);

  if (!file || !title || !Number.isInteger(number) || number < 1) {
    return null;
  }

  return { file, title, number };
}

async function fetchManifest() {
  const response = await fetch('chapters.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`章节清单加载失败：${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('章节清单格式不正确');
  }

  return data.map((entry) => normalizeChapter(entry)).filter(Boolean);
}

async function fetchChapter(file) {
  if (chapterCache.has(file)) {
    return chapterCache.get(file);
  }

  const response = await fetch(`chapters/${file}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`章节加载失败：${response.status}`);
  }

  const markdown = await response.text();
  chapterCache.set(file, markdown);
  return markdown;
}

function App() {
  const [chapters, setChapters] = useState([]);
  const [manifestState, setManifestState] = useState({ loading: true, error: '' });
  const [activeFile, setActiveFile] = useState(getHashChapter());
  const [chapterState, setChapterState] = useState({ loading: false, html: '', error: '' });

  useEffect(() => {
    let disposed = false;

    async function loadManifest() {
      try {
        const manifest = await fetchManifest();
        if (disposed) {
          return;
        }

        setChapters(manifest);
        setManifestState({ loading: false, error: '' });
      } catch (error) {
        if (!disposed) {
          setManifestState({ loading: false, error: error.message });
        }
      }
    }

    void loadManifest();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setActiveFile(getHashChapter());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    async function loadChapter() {
      if (!activeFile) {
        setChapterState({ loading: false, html: '', error: '' });
        return;
      }

      if (!chapters.length) {
        return;
      }

      const activeChapter = chapters.find((chapter) => chapter.file === activeFile);
      if (!activeChapter) {
        setChapterState({ loading: false, html: '', error: '' });
        return;
      }

      setChapterState({ loading: true, html: '', error: '' });

      try {
        const markdown = await fetchChapter(activeChapter.file);
        if (disposed) {
          return;
        }

        setChapterState({
          loading: false,
          html: marked.parse(markdown),
          error: '',
        });
      } catch (error) {
        if (!disposed) {
          setChapterState({ loading: false, html: '', error: error.message });
        }
      }
    }

    void loadChapter();

    return () => {
      disposed = true;
    };
  }, [activeFile, chapters]);

  const activeIndex = chapters.findIndex((chapter) => chapter.file === activeFile);
  const activeChapter = activeIndex >= 0 ? chapters[activeIndex] : null;
  const previousChapter = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const nextChapter = activeIndex >= 0 && activeIndex < chapters.length - 1 ? chapters[activeIndex + 1] : null;
  const missingChapter = Boolean(activeFile) && !manifestState.loading && chapters.length > 0 && !activeChapter;

  function goHome() {
    window.location.hash = '';
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />
      <div className="grid-overlay" />

      <header className="topbar">
        <button className="brand" type="button" onClick={goHome}>
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__text">多元宇宙系统</span>
        </button>

        <nav className="chapter-nav" aria-label="章节导航">
          {chapters.map((chapter) => (
            <a
              key={chapter.file}
              className={chapter.file === activeFile ? 'chapter-nav__link active' : 'chapter-nav__link'}
              href={`#${chapter.file}`}
            >
              第{chapter.number}章
            </a>
          ))}
        </nav>
      </header>

      <main className="page-frame">
        {manifestState.error ? (
          <section className="panel panel--error">
            <p className="panel__eyebrow">MANIFEST FAILURE</p>
            <h1>章节清单加载失败</h1>
            <p>{manifestState.error}</p>
          </section>
        ) : activeChapter ? (
          <>
            <section className="chapter-hero panel">
              <div className="chapter-hero__meta">
                <span>第 {String(activeChapter.number).padStart(2, '0')} 章</span>
              </div>
              <h1>{activeChapter.title}</h1>
            </section>

            <section className="reader panel">
              {chapterState.loading ? (
                <div className="reader-loading">
                  <div className="reader-loading__orb" />
                  <p>正在加载章节...</p>
                </div>
              ) : chapterState.error ? (
                <div className="panel panel--error panel--inline">
                  <p className="panel__eyebrow">READ FAILURE</p>
                  <h2>章节内容加载失败</h2>
                  <p>{chapterState.error}</p>
                </div>
              ) : (
                <article className="md-body" dangerouslySetInnerHTML={{ __html: chapterState.html }} />
              )}
            </section>

            <footer className="pager panel">
              {previousChapter ? (
                <a className="pager__link" href={`#${previousChapter.file}`}>
                  <span className="pager__label">上一章</span>
                  <strong>{previousChapter.title}</strong>
                </a>
              ) : (
                <span className="pager__link pager__link--disabled">
                  <span className="pager__label">上一章</span>
                  <strong>已是第一章</strong>
                </span>
              )}

              <button className="pager__home" type="button" onClick={goHome}>
                返回目录
              </button>

              {nextChapter ? (
                <a className="pager__link" href={`#${nextChapter.file}`}>
                  <span className="pager__label">下一章</span>
                  <strong>{nextChapter.title}</strong>
                </a>
              ) : (
                <span className="pager__link pager__link--disabled">
                  <span className="pager__label">下一章</span>
                  <strong>已是最新章节</strong>
                </span>
              )}
            </footer>
          </>
        ) : (
          <>
            <section className="hero">
              <div className="hero__copy">
                <h1>多元宇宙系统</h1>
                <p className="hero__lede">星际联邦 · 基因觉醒 · 万界征途</p>
              </div>
            </section>

            {missingChapter ? (
              <section className="panel panel--error panel--inline panel--notice">
                <p className="panel__eyebrow">ROUTE MISS</p>
                <h2>未找到对应章节</h2>
                <p>当前哈希没有匹配到可用章节，已回退到目录页。</p>
              </section>
            ) : null}

            <section className="chapter-listing">
              {manifestState.loading ? (
                <div className="reader-loading reader-loading--compact panel">
                  <div className="reader-loading__orb" />
                  <p>正在加载目录...</p>
                </div>
              ) : (
                chapters.map((chapter) => (
                  <a key={chapter.file} className="chapter-card panel" href={`#${chapter.file}`}>
                    <div className="chapter-card__index">{String(chapter.number).padStart(2, '0')}</div>
                    <div className="chapter-card__body">
                      <h2>{chapter.title}</h2>
                    </div>
                  </a>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
