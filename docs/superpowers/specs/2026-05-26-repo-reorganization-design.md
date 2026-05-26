# Repository Reorganization — Design Spec

**Date:** 2026-05-26
**Repo:** `norrisaftcc.github.io` (live Jekyll / GitHub Pages site, `hacker` remote theme)
**Goal:** Catalog and reorganize a neglected portfolio site into a clean, self-documenting
taxonomy; add a contributor-facing `README.md`; revise `CLAUDE.md`; and stub in placeholders
for two upcoming 2026 courses.

---

## 1. Motivation

The site has accumulated ~100 files over four years with no consistent organization:

- Loose files at root (`genna.html`, `fayettevillego.md`, big images, stray `_config copy.yml`).
- Loose `.java` and `.html` demo files dumped directly in `projects/`.
- Course material scattered across `cti110/`, `csc113/`, `wlab1/`, and `_posts/2024/...`.
- The annual "Terrible AI Products" tradition mixed in with projects that actually work.
- Cruft: duplicate config, double-extension files (`index.md.md`), duplicate PDFs.
- Several broken internal links in `index.md` (`cti110.html`, `/_posts_2023/vtuber.html`).
- `README.md` is a 2-line stub; `CLAUDE.md` describes the old layout.

The site distinguishes its own content categories in prose; this spec formalizes those
categories into a directory taxonomy.

## 2. Decisions (locked)

- **Scope:** Full restructure (not docs-only or light cleanup).
- **Old-URL preservation:** Manual meta-refresh stub pages at publicly-linked entry points
  **— EXCEPT** for anything that moves into `/games`. Game-page audiences are reachable via the
  new URLs, so no stubs there.
- **No Jekyll plugins** added for redirects (manual stubs were chosen over `jekyll-redirect-from`).

## 3. Target directory structure

```
.
├── _config.yml                 # keep; delete the stray "_config copy.yml"
├── _layouts/                   # keep (Jekyll convention)
├── _posts/                     # keep ONLY true blog posts (see §6)
├── index.md                    # slimmed; 2026 slugs pinned at top
├── README.md                   # NEW — directory map + catalog (contributor-facing)
├── CLAUDE.md                   # revised to match this structure
│
├── courses/
│   ├── cti110/                 # current cti110/* + absorbs root-level wlab1/ (a CTI110 web lab)
│   ├── csc113/                 # AI Fundamentals + survivors guide
│   ├── using-llms-101/         # from _posts/2024/usingllms101/
│   ├── 2026-spring-capstone/   # SLUG — placeholder index.md, details TBD
│   └── 2026-summer-ai-1/       # SLUG — placeholder index.md, details TBD
│
├── professional-development/
│   ├── 2024-my-dinner-with-claude/   # from _posts/2024/2024pd/
│   ├── 2025-02-ai-bits-and-bobs/     # from projects/25febaipd*
│   └── 2025-05-bits-bytes/           # from projects/25may_ai.html
│
├── terrible-ai-products/
│   ├── 2022-vtuber/            # from _posts/2023/vtuber*
│   ├── 2023-grate-guard/       # from projects/grate-guard/
│   ├── 2024-brush-n-tune/      # from projects/brush-n-tune/
│   ├── 2024-pucatub/           # from projects/pucatub/
│   └── 2025-cash-incinerator-3000/   # from projects/cashincinerator3000/
│
├── projects/                   # projects that actually work
│   ├── pokesense/              # from projects/pokesense/
│   ├── peoples-calc/           # from projects/peoples_calc/
│   └── code-samples/           # loose NumberProcessor*.java + javafeb*.html + textadv_25apr.html
│
├── games/                      # interactive / creative  (NO stubs — see §4)
│   ├── fayetteville-go/        # fayettevillego.md + FayGo_Wood.JPG (image travels with page)
│   ├── genna/                  # genna.html
│   └── rpg/                    # game/ (index, infiltrator, influencer, nomad)
│
└── memorial/                   # from dr_norris/
```

Notes:
- **No `assets/` folder.** `FayGo_Wood.JPG` is local to the Fayetteville Go page and moves with it.
  `bad-sharepoint.jpg` and `gobook.png` are referenced nowhere (verified via grep) → propose
  deletion in the plan (confirm before deleting).
- `wlab1/` at root is a CTI110-style web lab ("Memphis" page); it folds into `courses/cti110/`.

## 4. Stub strategy (old-URL preservation)

For each **publicly-linked entry point** that moves, leave a tiny HTML file at the OLD path that
meta-refreshes to the NEW path:

```html
<!doctype html>
<meta http-equiv="refresh" content="0; url=/NEW/PATH/">
<link rel="canonical" href="/NEW/PATH/">
<p>This page moved to <a href="/NEW/PATH/">/NEW/PATH/</a>.</p>
```

**Stub these old paths** (linked from `index.md` and/or externally):
- `projects/grate-guard/` → `terrible-ai-products/2023-grate-guard/`
- `projects/brush-n-tune/` → `terrible-ai-products/2024-brush-n-tune/`
- `projects/pucatub/` → `terrible-ai-products/2024-pucatub/`
- `projects/cashincinerator3000/` → `terrible-ai-products/2025-cash-incinerator-3000/`
- `projects/peoples_calc/` → `projects/peoples-calc/`
- `projects/25febaipd.html` → `professional-development/2025-02-ai-bits-and-bobs/`
- `projects/25may_ai.html` → `professional-development/2025-05-bits-bytes/`
- `projects/javafeb.html`, `projects/textadv_25apr.html` → `projects/code-samples/...`
- `_posts/2024/2024pd/` → `professional-development/2024-my-dinner-with-claude/`
- `_posts/2024/usingllms101/` → `courses/using-llms-101/`
- `dr_norris/` → `memorial/`

**Do NOT stub** (moves into `/games`): `fayettevillego.md`, `genna.html`, `game/*`.
Per decision §2, game audiences reach the new URLs directly.

Final stub list to be confirmed during planning by grepping `index.md` and the repo for each old
path; only create stubs for paths that are actually referenced or plausibly bookmarked.

## 5. Cruft removal (confirm each in the plan, do not delete blindly)

- `_config copy.yml` — duplicate of `_config.yml`.
- `_posts/2023/index.md.md` — double extension.
- Duplicate PDFs/derivatives in 2024pd: `...Appendix 1 ... (2).md`, `...Sheet.md(1).html`,
  `25febaipd_old.pdf`.
- Orphaned root images (unreferenced): `bad-sharepoint.jpg`, `gobook.png`.

## 6. `_posts/` handling

`_posts/` is Jekyll-special. Keep only genuine dated blog posts there
(`2022-11-02 Welcome.md`, `2022-11-7 Adding-Posts.md`). Content currently mis-filed under
`_posts/2023/` and `_posts/2024/` (course material, PD decks, the VTuber project) moves to its
proper home per §3. Stub the old `_posts/...` directory URLs that were linked publicly.

## 7. `index.md` rewrite

- Pin a **2026** section at the very top with two slugs:
  - 2026 Spring Programming Capstone → `courses/2026-spring-capstone/`
  - 2026 Summer Artificial Intelligence I → `courses/2026-summer-ai-1/`
  (Both marked "details coming soon.")
- Collapse the chronological pile into a tight, categorized index that mirrors the new folders.
- Fix/remove broken links (`cti110.html`, `/_posts_2023/vtuber.html`, `2024pd/`, etc.).
- Preserve the Voiceflow chat widget `<script>` block at the bottom.

## 8. `README.md` (new, contributor-facing)

- One-paragraph description of the site's purpose.
- A directory map (the §3 tree).
- A catalog table: each top-level folder → what it contains → notable entry pages.
- Local Jekyll build/serve instructions (already in CLAUDE.md; mirror briefly).
- A short "conventions" note (dated folders for annual content, slugs for upcoming courses).

## 9. `CLAUDE.md` revision

- Replace the "Key Directories" / "Content Organization" sections with the new taxonomy.
- Document the conventions: `terrible-ai-products/` is dated by year; `courses/` uses course
  codes; manual meta-refresh stubs preserve old URLs (except `/games`); no redirect plugins.
- Keep the existing Jekyll/build guidance.

## 10. Success criteria

- `find . -type d` reflects the §3 taxonomy; no loose code/HTML demos at `projects/` root.
- No duplicate-config / double-extension / orphaned-image files remain.
- Every old public URL listed in §4 resolves (via stub) to its new location; `/games` pages
  resolve at their new URLs with no stubs.
- `index.md` shows the 2026 slugs first and has no broken internal links.
- `README.md` and `CLAUDE.md` both describe the new structure accurately.
- Site still builds on GitHub Pages (no plugin additions; theme unchanged).

## 11. Out of scope

- Rewriting page *content* (only moving files + fixing links/front-matter as needed).
- Detailing the two 2026 courses (slugs only).
- Adding redirect plugins, CI, or a local build harness.
- Touching the external repos linked from the site (CSC-134_25SP, etc.).
