from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DEPLOY_MODULE_DIR = ROOT / "deploy"
DEPLOY_OUTPUT_DIR = ROOT / ".build" / "deploy"
PUBLIC_DIR = DEPLOY_MODULE_DIR / ".build" / "public"
PUBLIC_CHAPTER_DIR = PUBLIC_DIR / "chapters"
PUBLIC_MANIFEST = PUBLIC_DIR / "chapters.json"
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
    PUBLIC_CHAPTER_DIR.mkdir(parents=True, exist_ok=True)

    for path in PUBLIC_CHAPTER_DIR.glob("*.md"):
        if path.stem.isdigit():
            path.unlink()

    if PUBLIC_MANIFEST.exists():
        PUBLIC_MANIFEST.unlink()


def npm_command() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def build_frontend() -> None:
    subprocess.run([npm_command(), "run", "build"], cwd=DEPLOY_MODULE_DIR, check=True)


def build() -> None:
    clear_generated_chapters()

    chapters = []
    for source_path in chapter_paths():
        markdown = source_path.read_text(encoding="utf-8")
        target_path = PUBLIC_CHAPTER_DIR / source_path.name
        target_path.write_text(markdown, encoding="utf-8")
        chapters.append(
            {
                "file": source_path.name,
                "number": int(source_path.stem),
                "title": chapter_title(markdown, int(source_path.stem)),
            }
        )

    PUBLIC_MANIFEST.write_text(
        json.dumps(chapters, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    DEPLOY_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_frontend()


if __name__ == "__main__":
    build()