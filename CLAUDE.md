# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Jekyll-based GitHub Pages personal website that serves as a teaching portfolio and project showcase. The site includes:
- Teaching resources (particularly for CTI, CSC, and CTS courses)
- Student project examples (including "Terrible AI-Generated Products")
- Professional development materials
- Personal memorial page

## Jekyll Structure

The site uses Jekyll with the `hacker` theme configured in `_config.yml`:
- Main theme: `pages-themes/hacker@v0.2.0`
- Posts are in `_posts/` directory
- Custom layouts in `_layouts/`
- Default markdown files are converted to HTML automatically

## Common Development Tasks

### Building and Testing Locally

While no local build files are present, the site is built automatically on GitHub Pages. To test locally, standard Jekyll commands would apply:
```bash
bundle install
bundle exec jekyll serve
```

However, this repository appears to be edited primarily through GitHub directly, with no local development setup.

### Adding New Posts

Posts follow the Jekyll naming convention:
- Format: `YYYY-MM-DD-title.md`
- Located in `_posts/` directory
- Can be organized in subdirectories by year

### Key Directories

- `_posts/`: Blog posts and teaching materials
- `projects/`: Student and demonstration projects
- `cti110/`, `dev-blog/`, `dr_norris/`: Special sections with their own content

## Architecture Notes

- The site uses Jekyll's automatic markdown-to-HTML conversion
- No custom build scripts or package.json present
- Some directories (like `projects/grate-guard/`) contain standalone HTML/CSS/JS projects
- Voiceflow chat widget is integrated via script at the bottom of `index.md`

## Content Organization

- Main landing page: `index.md`
- Individual project pages typically have their own `index.md` or `index.html`
- Some projects contain multimedia resources (images, audio, video)
- Teaching materials include PDFs and HTML versions of markdown files