---
name: fix-markdown-rendering
description: 'Fix Markdown rendering issues caused by HTML tags (like <font>) being wrapped in backticks. Use when: markdown files fail to render colors/HTML correctly, or user complains about "rendering failed".'
---

# Fix Markdown HTML Rendering

## Issue Description
Markdown rendering engines cannot process HTML tags (such as `<font color="...">`) if they are wrapped in Markdown inline code syntax (backticks `` ` ``). This often happens when AI or formatters generate text and wrap tags in backticks, causing raw HTML tags to be displayed as text instead of applying styling.

## When to Use
- You encounter Markdown files containing `` `<font color="...">` `` or `` `</font>` ``.
- The user reports "rendering failed" (渲染失败), "colors not showing", or "HTML tag visible format issue" in `.md` files.

## Procedure
1. Identify the problematic Markdown file(s).
2. Look for the instances where HTML tags are wrapped inside backticks, e.g., `` `<font color="...">` **Text** `</font>` ``.
3. Remove the backticks around the HTML formatting tags. Use replacement tools (`sed` in terminal or `replace_string_in_file`). 
   - **Terminal `sed` example:**
     ```bash
     sed -i 's/`<font color="\([^"]*\)">`/<font color="\1">/g' file.md && sed -i 's/`<\/font>`/<\/font>/g' file.md
     ```
4. Verify the changes using the terminal (e.g., `cat file.md | head -n 10`) to confirm the backticks have been cleanly stripped (e.g. `<font color="#808080">**Text**</font>`).

## Best Practices
- **Do NOT** strip backticks globally or randomly. Only target backticks immediately wrapping the HTML styling tags that need to be evaluated.
- Preserves backticks used for legitimate inline code blocks.