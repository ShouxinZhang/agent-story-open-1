function normalizeChapter(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const file = typeof entry.file === 'string' ? entry.file.trim() : '';
  const number = Number.parseInt(entry.number, 10);
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';

  if (!file || !Number.isInteger(number) || number < 1) {
    return null;
  }

  return {
    file,
    number,
    title: title || `第${number}章`,
  };
}

export async function discoverChapters() {
  const response = await fetch('chapters.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`章节清单加载失败：${response.status}`);
  }

  const manifest = await response.json();
  if (!Array.isArray(manifest)) {
    throw new Error('章节清单格式不正确');
  }

  return manifest
    .map((entry) => normalizeChapter(entry))
    .filter(Boolean)
    .sort((leftChapter, rightChapter) => leftChapter.number - rightChapter.number);
}

export async function getChapterMarkdown(file) {
  const response = await fetch(file, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`章节加载失败：${response.status}`);
  }

  return response.text();
}