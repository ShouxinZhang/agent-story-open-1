from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOY_DIR = ROOT / "deploy"
CHAPTER_PATTERN = re.compile(r"^\d+\.md$")
TITLE_PATTERN = re.compile(r"^#\s+(.+)$", re.MULTILINE)


def chapter_paths() -> list[Path]:
    return sorted(
        [path for path in ROOT.iterdir() if path.is_file() and CHAPTER_PATTERN.match(path.name)],
        key=lambda path: int(path.stem),
    )


def chapter_title(markdown: str, chapter_number: int) -> str:
    matched = TITLE_PATTERN.search(markdown)
    if matched:
        return matched.group(1).strip()
    return f"第{chapter_number}章"


def clear_generated_chapters() -> None:
    for path in DEPLOY_DIR.glob("*.md"):
        if path.stem.isdigit():
            path.unlink()


def build() -> None:
    DEPLOY_DIR.mkdir(parents=True, exist_ok=True)
    clear_generated_chapters()

    chapters = []
    for source_path in chapter_paths():
        markdown = source_path.read_text(encoding="utf-8")
        target_path = DEPLOY_DIR / source_path.name
        target_path.write_text(markdown, encoding="utf-8")
        chapters.append(
            {
                "file": source_path.name,
                "number": int(source_path.stem),
                "title": chapter_title(markdown, int(source_path.stem)),
            }
        )

    chapters_path = DEPLOY_DIR / "chapters.json"
    chapters_path.write_text(
        json.dumps(chapters, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    build()