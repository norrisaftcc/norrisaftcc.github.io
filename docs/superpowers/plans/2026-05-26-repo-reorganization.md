# Repository Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the `norrisaftcc.github.io` Jekyll site into a clean, dated, self-documenting taxonomy; preserve public URLs with manual stubs (except `/games`); and add `README.md` + revised `CLAUDE.md`.

**Architecture:** Pure file reorganization on a GitHub Pages site. All moves use `git mv` to preserve history. Old public URLs get tiny meta-refresh stub pages at their original paths. No code changes, no Jekyll plugins, theme unchanged. GitHub Pages rebuilds automatically on push, so "tests" here are structural checks (`find`, `git status`, `grep`), not a test runner.

**Tech Stack:** Jekyll (remote theme `pages-themes/hacker`), GitHub Pages, Markdown/HTML.

**Reference spec:** `docs/superpowers/specs/2026-05-26-repo-reorganization-design.md`

**Conventions for every task:**
- Use `git mv` (never plain `mv`) so history follows the file.
- Quote paths containing spaces.
- After each task, the working tree should be committable with no accidental deletions — verify with `git status` before committing.

---

### Task 1: Create new top-level skeleton + 2026 course slugs

**Files:**
- Create dirs: `courses/`, `professional-development/`, `terrible-ai-products/`, `games/`, `memorial/`, `projects/code-samples/`
- Create: `courses/2026-spring-capstone/index.md`
- Create: `courses/2026-summer-ai-1/index.md`

- [ ] **Step 1: Create the directory skeleton**

```bash
cd /Users/norrisa/Documents/dev/github/norrisaftcc.github.io
mkdir -p courses/2026-spring-capstone courses/2026-summer-ai-1 \
         professional-development terrible-ai-products games memorial \
         projects/code-samples
```

- [ ] **Step 2: Write the 2026 Spring Capstone slug**

File `courses/2026-spring-capstone/index.md`:

```markdown
---
title: 2026 Spring Programming Capstone
---

# 2026 Spring Programming Capstone

Course details coming soon.
```

- [ ] **Step 3: Write the 2026 Summer AI I slug**

File `courses/2026-summer-ai-1/index.md`:

```markdown
---
title: 2026 Summer Artificial Intelligence I
---

# 2026 Summer Artificial Intelligence I

Course details coming soon.
```

- [ ] **Step 4: Verify the skeleton exists**

Run: `find courses professional-development terrible-ai-products games memorial -type d | sort`
Expected: lists all six (plus the two 2026 course dirs).

- [ ] **Step 5: Commit**

```bash
git add courses/2026-spring-capstone/index.md courses/2026-summer-ai-1/index.md
git commit -m "Add top-level skeleton and 2026 course slug placeholders"
```

---

### Task 2: Move course material into `courses/`

**Files:**
- Move: `cti110/` → `courses/cti110/`
- Move: `wlab1/` → `courses/cti110/wlab1/`
- Move: `csc113/` → `courses/csc113/`
- Move: `_posts/2024/usingllms101/index.md` → `courses/using-llms-101/index.md`
- Move: `_posts/2023/cti110.md` → `courses/cti110/examples/demo-page.md` (+ `devitachu.jpg`)
- Move: `_posts/2023/cool.md`, `index_test.md`, `index_test.html` → `courses/cti110/examples/`

- [ ] **Step 1: Move the existing course folders**

```bash
git mv cti110 courses/cti110
git mv csc113 courses/csc113
mkdir -p courses/cti110/wlab1
git mv wlab1/beale.jpg wlab1/map.jpg wlab1/waterfront.jpg wlab1/page1.html courses/cti110/wlab1/
rmdir wlab1
```

- [ ] **Step 2: Move Using LLMs 101**

```bash
mkdir -p courses/using-llms-101
git mv _posts/2024/usingllms101/index.md courses/using-llms-101/index.md
rmdir _posts/2024/usingllms101
```

- [ ] **Step 3: Move the CTI110 example/demo pages**

```bash
mkdir -p courses/cti110/examples
git mv _posts/2023/cti110.md courses/cti110/examples/demo-page.md
git mv _posts/2023/devitachu.jpg courses/cti110/examples/devitachu.jpg
git mv _posts/2023/cool.md courses/cti110/examples/cool.md
git mv _posts/2023/index_test.md courses/cti110/examples/index_test.md
git mv _posts/2023/index_test.html courses/cti110/examples/index_test.html
```

- [ ] **Step 4: Verify moves and no untracked stragglers**

Run: `git status --short && echo "---" && find courses -type f | sort`
Expected: all changes shown as `R` (renames); `courses/` contains cti110 (incl. wlab1/ + examples/), csc113, using-llms-101, and the two 2026 slugs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Move CTI110/CSC113/Using-LLMs-101 material into courses/"
```

---

### Task 3: Move professional-development material + drop duplicate PDFs

**Files:**
- Move: `_posts/2024/2024pd/` → `professional-development/2024-my-dinner-with-claude/` (minus dupes)
- Delete: `_posts/2024/2024pd/March 2024 AI Reference Sheet Appendix 1 - Dillinger for PDFs(2).md`
- Delete: `_posts/2024/2024pd/March 2024 AI Reference Sheet.md(1).html`
- Move: `projects/25febaipd.md` → `professional-development/2025-02-ai-bits-and-bobs/index.md`
- Move: `projects/25febaipd.pdf` → `professional-development/2025-02-ai-bits-and-bobs/25febaipd.pdf`
- Delete: `projects/25febaipd_old.pdf`
- Move: `projects/25may_ai.html` → `professional-development/2025-05-bits-bytes/index.html`

- [ ] **Step 1: Remove the two duplicate derivatives from 2024pd**

```bash
git rm "_posts/2024/2024pd/March 2024 AI Reference Sheet Appendix 1 - Dillinger for PDFs(2).md"
git rm "_posts/2024/2024pd/March 2024 AI Reference Sheet.md(1).html"
```

- [ ] **Step 2: Move the rest of 2024pd**

```bash
mkdir -p professional-development/2024-my-dinner-with-claude
git mv _posts/2024/2024pd/* professional-development/2024-my-dinner-with-claude/
rmdir _posts/2024/2024pd _posts/2024
```

- [ ] **Step 3: Move the Feb 2025 lunch & learn**

```bash
mkdir -p professional-development/2025-02-ai-bits-and-bobs
git mv projects/25febaipd.md professional-development/2025-02-ai-bits-and-bobs/index.md
git mv projects/25febaipd.pdf professional-development/2025-02-ai-bits-and-bobs/25febaipd.pdf
git rm projects/25febaipd_old.pdf
```

- [ ] **Step 4: Move the May 2025 lunch & learn**

```bash
mkdir -p professional-development/2025-05-bits-bytes
git mv projects/25may_ai.html professional-development/2025-05-bits-bytes/index.html
```

- [ ] **Step 5: Verify**

Run: `find professional-development -type f | sort && echo "--- _posts now ---" && find _posts -type f | sort`
Expected: three PD subfolders populated; `_posts/` now contains only the two root welcome posts (no `2024/` dir).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Consolidate lunch & learns / AI reference sheets into professional-development/"
```

---

### Task 4: Move the Terrible AI Products (dated)

**Files:**
- Move: `projects/grate-guard/` → `terrible-ai-products/2023-grate-guard/`
- Move: `projects/brush-n-tune/` → `terrible-ai-products/2024-brush-n-tune/`
- Move: `projects/pucatub/` → `terrible-ai-products/2024-pucatub/`
- Move: `projects/cashincinerator3000/` → `terrible-ai-products/2025-cash-incinerator-3000/`
- Move: `_posts/2023/vtuber.md` → `terrible-ai-products/2022-vtuber/index.md` (+ `vtuber1.png`)

- [ ] **Step 1: Move the four project-style terrible products**

```bash
git mv projects/grate-guard terrible-ai-products/2023-grate-guard
git mv projects/brush-n-tune terrible-ai-products/2024-brush-n-tune
git mv projects/pucatub terrible-ai-products/2024-pucatub
git mv projects/cashincinerator3000 terrible-ai-products/2025-cash-incinerator-3000
```

- [ ] **Step 2: Move the 2022 VTuber page**

```bash
mkdir -p terrible-ai-products/2022-vtuber
git mv _posts/2023/vtuber.md terrible-ai-products/2022-vtuber/index.md
git mv _posts/2023/vtuber1.png terrible-ai-products/2022-vtuber/vtuber1.png
```

- [ ] **Step 3: Verify**

Run: `find terrible-ai-products -maxdepth 1 -type d | sort`
Expected: the five dated product folders.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Move annual Terrible AI Products into dated terrible-ai-products/"
```

---

### Task 5: Reorganize `projects/` (working projects only)

**Files:**
- Rename: `projects/peoples_calc/` → `projects/peoples-calc/`
- Move loose code/demos → `projects/code-samples/`: `NumberProcessor.java`, `NumberProcessor2.java`, `NumberProcessor_0002.java`, `NumberProcessor_5h01.java`, `javafeb.html`, `javafeb2.html`, `textadv_25apr.html`
- Move: `_posts/2023/evil_resume.md` → `projects/misc/evil_resume.md`
- `projects/pokesense/` stays put.

- [ ] **Step 1: Rename peoples_calc → peoples-calc**

```bash
git mv projects/peoples_calc projects/peoples-calc
```

- [ ] **Step 2: Move loose Java + HTML demos into code-samples/**

```bash
git mv projects/NumberProcessor.java projects/NumberProcessor2.java \
       projects/NumberProcessor_0002.java projects/NumberProcessor_5h01.java \
       projects/javafeb.html projects/javafeb2.html projects/textadv_25apr.html \
       projects/code-samples/
```

- [ ] **Step 3: Move the Evil Knievel resume into projects/misc/**

```bash
git mv _posts/2023/evil_resume.md projects/misc/evil_resume.md
```

- [ ] **Step 4: Verify projects/ root is clean**

Run: `find projects -maxdepth 1 | sort`
Expected: only `projects/`, `projects/code-samples`, `projects/misc`, `projects/peoples-calc`, `projects/pokesense` — no loose `.java`/`.html`/`.pdf` files at the root.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Tidy projects/: rename peoples-calc, gather code-samples, relocate evil_resume"
```

---

### Task 6: Move games / creative content (NO stubs)

**Files:**
- Move: `fayettevillego.md` → `games/fayetteville-go/index.md`
- Move: `FayGo_Wood.JPG` → `games/fayetteville-go/FayGo_Wood.JPG`
- Move: `genna.html` → `games/genna/index.html`
- Move: `game/` → `games/rpg/`

- [ ] **Step 1: Move Fayetteville Go (page + its image)**

```bash
mkdir -p games/fayetteville-go
git mv fayettevillego.md games/fayetteville-go/index.md
git mv FayGo_Wood.JPG games/fayetteville-go/FayGo_Wood.JPG
```

- [ ] **Step 2: Fix the image path inside the Fayetteville Go page**

In `games/fayetteville-go/index.md`, the image tag `<img src="FayGo_Wood.JPG" width="560">` still resolves (image moved alongside it), so no change needed. Confirm with:
Run: `grep -n "FayGo_Wood" games/fayetteville-go/index.md`
Expected: one line; `src="FayGo_Wood.JPG"` (relative, still valid).

- [ ] **Step 3: Move Genna and the RPG game**

```bash
mkdir -p games/genna
git mv genna.html games/genna/index.html
git mv game games/rpg
```

- [ ] **Step 4: Verify**

Run: `find games -type f | sort`
Expected: `games/fayetteville-go/` (index.md + FayGo_Wood.JPG), `games/genna/index.html`, `games/rpg/` (index.md, infiltrator.md, influencer.md, nomad.md).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Move interactive/creative content into games/ (no URL stubs per spec)"
```

---

### Task 7: Move the memorial

**Files:**
- Move: `dr_norris/` → `memorial/`

- [ ] **Step 1: Move dr_norris into memorial/**

```bash
git mv dr_norris/* memorial/
rmdir dr_norris
```

- [ ] **Step 2: Verify**

Run: `find memorial -type f | sort`
Expected: index.html, making_of.md, mementoshare.md, norris_tree.png, and the five family photos.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Move Dr. Larry Norris memorial into memorial/"
```

---

### Task 8: Remove remaining cruft and orphaned media (confirm first)

**Files (delete):**
- `_config copy.yml` (duplicate config)
- `_posts/2023/index.md.md` (double-extension; content is a half-finished "Study 100" pitch — **confirm with user before deleting; otherwise preserve as `terrible-ai-products/2023-study-100/index.md`**)
- `bad-sharepoint.jpg` (root orphan, referenced nowhere)
- `gobook.png` (root orphan, referenced nowhere)
- `_posts/2023/duende_studio_ghibli1.jpg` (orphan, referenced nowhere)
- `_posts/2023/task_ees.pdf` (orphan, referenced nowhere)

- [ ] **Step 1: Re-confirm the orphans are truly unreferenced**

Run: `git grep -l -e "bad-sharepoint" -e "gobook" -e "duende" -e "task_ees" -e "index.md.md"`
Expected: no output (no references). If any path appears, stop and reassess that file.

- [ ] **Step 2: Delete the confirmed cruft**

```bash
git rm "_config copy.yml"
git rm bad-sharepoint.jpg gobook.png
git rm _posts/2023/duende_studio_ghibli1.jpg _posts/2023/task_ees.pdf
git rm _posts/2023/index.md.md   # only if user confirmed deletion
```

- [ ] **Step 3: Remove now-empty _posts/2023**

```bash
rmdir _posts/2023 2>/dev/null || true
find _posts -type f | sort
```
Expected: only `_posts/2022-11-02 Welcome.md` and `_posts/2022-11-7 Adding-Posts.md` remain.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove duplicate config, double-extension file, and orphaned media"
```

---

### Task 9: Create meta-refresh stub pages at old public URLs

Stub template (replace `NEW/PATH`):

```html
<!doctype html>
<title>Page moved</title>
<meta http-equiv="refresh" content="0; url=/NEW/PATH/">
<link rel="canonical" href="/NEW/PATH/">
<p>This page moved to <a href="/NEW/PATH/">/NEW/PATH/</a>.</p>
```

**Files to create (old path → redirect target):**

- [ ] **Step 1: Stub the four Terrible AI Product project pages**

```bash
mkdir -p projects/grate-guard projects/brush-n-tune projects/pucatub projects/cashincinerator3000
```
Then create each `index.html` with the template above pointing to:
- `projects/grate-guard/index.html` → `/terrible-ai-products/2023-grate-guard/`
- `projects/brush-n-tune/index.html` → `/terrible-ai-products/2024-brush-n-tune/`
- `projects/pucatub/index.html` → `/terrible-ai-products/2024-pucatub/`
- `projects/cashincinerator3000/index.html` → `/terrible-ai-products/2025-cash-incinerator-3000/`

- [ ] **Step 2: Stub peoples_calc and the PD pages**

```bash
mkdir -p projects/peoples_calc
```
Create:
- `projects/peoples_calc/index.html` → `/projects/peoples-calc/`
- `projects/25febaipd.html` → `/professional-development/2025-02-ai-bits-and-bobs/`
- `projects/25may_ai.html` → `/professional-development/2025-05-bits-bytes/`
- `projects/javafeb.html` → `/projects/code-samples/javafeb.html`
- `projects/textadv_25apr.html` → `/projects/code-samples/textadv_25apr.html`

(These are single files at the old `projects/` root paths.)

- [ ] **Step 3: Stub the old `_posts/...` URLs and the memorial**

```bash
mkdir -p _posts/2024/2024pd _posts/2024/usingllms101 dr_norris
```
Create:
- `_posts/2024/2024pd/index.html` → `/professional-development/2024-my-dinner-with-claude/`
- `_posts/2024/usingllms101/index.html` → `/courses/using-llms-101/`
- `dr_norris/index.html` → `/memorial/`

- [ ] **Step 4: Verify every stub points at a real destination**

Run:
```bash
for f in projects/grate-guard/index.html projects/brush-n-tune/index.html \
  projects/pucatub/index.html projects/cashincinerator3000/index.html \
  projects/peoples_calc/index.html projects/25febaipd.html projects/25may_ai.html \
  projects/javafeb.html projects/textadv_25apr.html \
  _posts/2024/2024pd/index.html _posts/2024/usingllms101/index.html dr_norris/index.html; do
    url=$(grep -o 'url=[^"]*' "$f" | sed 's/url=//;s#^/##;s#/$##'); \
    test -e "$url" -o -e "$url.html" -o -e "$url/index.html" -o -e "$url/index.md" \
      && echo "OK  $f -> /$url" || echo "BAD $f -> /$url"; done
```
Expected: every line prints `OK`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add meta-refresh stubs preserving old public URLs (games excluded)"
```

---

### Task 10: Rewrite `index.md`

**Files:**
- Modify: `index.md` (full rewrite of the body; keep the Voiceflow `<script>` block verbatim at the end)

- [ ] **Step 1: Replace the landing page body**

Write `index.md` with this structure (2026 slugs first, then a categorized index mirroring the new folders). Use these exact, corrected links:

```markdown
# norrisaftcc's homepage

## Coming in 2026
- [2026 Spring Programming Capstone](courses/2026-spring-capstone/) — details coming soon
- [2026 Summer Artificial Intelligence I](courses/2026-summer-ai-1/) — details coming soon

---

## Courses
- [CTI 110](courses/cti110/) — intro examples and labs
- [CSC 113 AI Fundamentals](courses/csc113/) — including the [Survivor's Guide](courses/csc113/survivors_guide.html)
- [Using LLMs 101](courses/using-llms-101/) (Summer 2024)
- CSC 134 demos live in the [CSC-134_25SP repo](https://github.com/norrisaftcc/CSC-134_25SP/blob/main/README.md)

## Terrible AI-Generated Products
Every year since 2022 we build a deliberately terrible idea with generative AI:
- [Cash Incinerator 3000 (2025)](terrible-ai-products/2025-cash-incinerator-3000/)
- [Pucatub Racing Club (2024)](terrible-ai-products/2024-pucatub/) — mascot, gacha game, and snack
- [Brush-N-Tune (2024)](terrible-ai-products/2024-brush-n-tune/) — a toothbrush that processes DMCA requests
- [Grate Guard (2023)](terrible-ai-products/2023-grate-guard/) — a phone case that's also a cheese grater
- [VTuber Name (2022)](terrible-ai-products/2022-vtuber/) — text-davinci-003 + DALL·E 2, pre-ChatGPT

## Projects That Actually Work
- [PokeSense](projects/pokesense/) — a Pokémon API demo
- [The People's Calculator](projects/peoples-calc/) — CTS285 creative brief
- [Code samples](projects/code-samples/) — Java input-format demos, C++ text adventure
- [Misc](projects/misc/) — the Repo Breakdown audio and Evil Knievel's (semi-fictional) résumé

## Games & Creative
- [Fayetteville Go!](games/fayetteville-go/)
- [Meet Genna 🎓🦙](games/genna/) — our mascot
- [RPG character classes](games/rpg/) — Infiltrator, Influencer, Nomad

## Professional Development
- [My Dinner with Claude (2024)](professional-development/2024-my-dinner-with-claude/)
- [AI: Bits, Bytes, Bits, and Bobs — Part 1 (Feb 2025)](professional-development/2025-02-ai-bits-and-bobs/)
- [AI: Bits, Bytes — Part 2 (May 2025)](professional-development/2025-05-bits-bytes/)

## In Memoriam
- [Remembering Dr. Larry Norris](memorial/) — and [how it was made with AI](memorial/making_of.html)

## Useful Links
- [Markdown Tutorial](https://www.w3schools.io/file/markdown-introduction)
- [GitHub Pages Quickstart](https://pages.github.com)
```

Then append the existing Voiceflow `<script>` block (lines 139–152 of the current `index.md`) **unchanged** at the very bottom.

- [ ] **Step 2: Verify no broken internal links remain**

Run:
```bash
grep -oE '\]\(([a-zA-Z0-9_./-]+)\)' index.md | sed 's/](//;s/)//' \
  | while read p; do p="${p%/}"; \
      test -e "$p" -o -e "$p.html" -o -e "$p.md" -o -e "$p/index.html" -o -e "$p/index.md" \
      && echo "OK  $p" || echo "BAD $p"; done
```
Expected: every relative link prints `OK` (external `http(s)` links are skipped by the pattern). Fix any `BAD` line before committing.

- [ ] **Step 3: Confirm the Voiceflow widget survived**

Run: `grep -c "voiceflow.chat.load" index.md`
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add index.md
git commit -m "Rewrite index.md: pin 2026 slugs, categorize by new taxonomy, fix dead links"
```

---

### Task 11: Write the new `README.md`

**Files:**
- Modify: `README.md` (replace the 2-line stub)

- [ ] **Step 1: Write README.md**

```markdown
# norrisaftcc.github.io

The personal site and teaching portfolio of norrisaftcc (Teacherbot) — a Jekyll site
published via GitHub Pages using the `hacker` remote theme. It collects course material,
student/demo projects, the annual "Terrible AI Product," professional-development decks,
interactive games, and a family memorial.

## Directory map

```
.
├── _config.yml              Jekyll config (hacker remote theme)
├── _layouts/                custom layouts
├── _posts/                  genuine dated blog posts only
├── index.md                 landing page
├── courses/                 teaching material
│   ├── cti110/              intro course + examples/ + wlab1/
│   ├── csc113/              AI Fundamentals + survivor's guide
│   ├── using-llms-101/      Summer 2024 course
│   ├── 2026-spring-capstone/  (slug — TBD)
│   └── 2026-summer-ai-1/      (slug — TBD)
├── professional-development/  lunch & learns, AI reference sheets (dated)
├── terrible-ai-products/    one deliberately bad AI product per year (dated)
├── projects/                projects that actually work
│   ├── pokesense/  peoples-calc/  code-samples/  misc/
├── games/                   interactive / creative (fayetteville-go, genna, rpg)
└── memorial/                in memoriam: Dr. Larry Norris
```

## Catalog

| Folder | Contains | Entry page |
|--------|----------|------------|
| `courses/` | Course pages, labs, demos | `courses/<code>/index.*` |
| `professional-development/` | AI PD decks & reference sheets | dated subfolders |
| `terrible-ai-products/` | The annual bad-idea showcase | `terrible-ai-products/<year>-<name>/` |
| `projects/` | Working demos + code samples | `projects/<name>/` |
| `games/` | Interactive/creative pages | `games/<name>/` |
| `memorial/` | Memorial site | `memorial/index.html` |

## Conventions

- **Dated folders** for annual/recurring content (`terrible-ai-products/`, `professional-development/`)
  use a `YYYY[-MM]-slug` prefix.
- **Course folders** use the course code; upcoming courses get a slug folder with a placeholder
  `index.md` until detailed.
- **Old URLs** from before the 2026 reorg are preserved with small meta-refresh stub pages at
  their original paths (the `/games` section is exempt — those use the new URLs directly).
  No redirect plugins are used.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

The live site builds automatically on push to `main` via GitHub Pages.
```

- [ ] **Step 2: Verify README renders the tree (no tab/format errors)**

Run: `grep -c "Directory map" README.md`
Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Replace README stub with directory map, catalog, and conventions"
```

---

### Task 12: Revise `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` — replace the "Key Directories" and "Content Organization" sections; add a "Reorganization conventions" note. Keep the Jekyll/build guidance.

- [ ] **Step 1: Replace the "Key Directories" section**

Find the `### Key Directories` block and replace its bullet list with:

```markdown
### Key Directories

- `_posts/`: genuine dated blog posts only (Jekyll convention)
- `_layouts/`: custom layouts
- `courses/`: teaching material, one folder per course code (plus `using-llms-101/` and 2026 slugs)
- `professional-development/`: dated PD decks and AI reference sheets
- `terrible-ai-products/`: the annual deliberately-bad AI product, dated `YYYY-<name>/`
- `projects/`: projects that actually work — `pokesense/`, `peoples-calc/`, `code-samples/`, `misc/`
- `games/`: interactive/creative pages — `fayetteville-go/`, `genna/`, `rpg/`
- `memorial/`: the Dr. Larry Norris memorial
```

- [ ] **Step 2: Replace the "Architecture Notes" / "Content Organization" sections**

Replace the `## Content Organization` section body with:

```markdown
## Content Organization

- Main landing page: `index.md` (2026 course slugs pinned at top, then a categorized index)
- Each project/course/product has its own `index.md` or `index.html`
- Annual content (`terrible-ai-products/`, `professional-development/`) is organized in dated
  folders using a `YYYY[-MM]-slug` prefix
- Upcoming courses get a slug folder with a placeholder `index.md` until detailed
- The Voiceflow chat widget is integrated via a `<script>` at the bottom of `index.md`

## URL preservation

After the 2026 reorganization, pages that moved leave a small meta-refresh stub at their old
path so existing bookmarks/links keep working. The `/games` section is exempt (it uses the new
URLs directly). No redirect plugins are used — stubs are plain HTML.
```

- [ ] **Step 3: Verify CLAUDE.md still documents the build commands**

Run: `grep -c "bundle exec jekyll serve" CLAUDE.md`
Expected: `1` (the build guidance was preserved).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md to describe the reorganized taxonomy and URL stubs"
```

---

### Task 13: Final whole-repo verification

- [ ] **Step 1: Confirm the top-level taxonomy**

Run: `find . -maxdepth 1 -type d -not -path './.git*' | sort`
Expected: `courses`, `docs`, `games`, `memorial`, `professional-development`, `projects`, `terrible-ai-products`, `_layouts`, `_posts` (plus `.`).

- [ ] **Step 2: Confirm no loose code/media at root or projects/ root**

Run: `ls *.java *.JPG *.png *.jpg *.jfif 2>/dev/null; ls projects/*.java projects/*.html 2>/dev/null; echo "exit:$?"`
Expected: no stray files listed (only the intended ones remain inside subfolders).

- [ ] **Step 3: Re-run the index.md link check from Task 10 Step 2**

Expected: all `OK`.

- [ ] **Step 4: Confirm git history was preserved on a sample move**

Run: `git log --follow --oneline -- terrible-ai-products/2023-grate-guard/index.html | tail -2`
Expected: shows commits predating this reorg (history followed the rename).

- [ ] **Step 5: Final status check**

Run: `git status`
Expected: clean working tree; all reorg commits present.

---

## Notes for the executor

- If any verification step prints `BAD` or an unexpected deletion appears in `git status`, **stop and fix before committing** — do not proceed with a broken move.
- `_posts/2023/index.md.md` deletion in Task 8 is gated on user confirmation; if preserving, create `terrible-ai-products/2023-study-100/index.md` from it instead and add it to the `index.md` list.
- GitHub Pages will rebuild on push; there is no local test suite. The structural checks in each task are the verification.
