---
title: Quack
emoji: 🦆
app_file: dist/index.html
sdk: static
---

# Quack

Quack is a tool for exploring and querying datasets using DuckDB embedded in the browser.

## Assets

Build artifacts are committed directly to the repo.
The latest build artifacts are deployed automatically to [https://huggingface.co/spaces/cephalization/quack](https://huggingface.co/spaces/cephalization/quack)

## Development

```bash
npm i -g pnpm
pnpm i
pnpm run dev
```
## To-do 

- [ ] Implement [content-visibility](https://web.dev/articles/content-visibility#skipping_rendering_work_with_content-visibility) to virtualize large result tables
- [ ] Integrate webllm for in browser text to sql capability
- [ ] Actually design the app. Tabs, tooltips, data hierarchy, better table
- [ ] Add more example datasets in a dropdown
- [ ] Dataset history
- [ ] pwa
