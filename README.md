# NOLX Open Lab

**NOLX Open Lab** is a free, browser-based prototype for exploring and editing website templates. It was separated from the earlier commercial NOLX Pages concept to create a version that can be inspected and tried without a purchase flow, wallet, or user account.

## What the prototype currently does

- Lists the templates registered in `templates/catalog.json`.
- Shows a public preview of a selected template.
- Opens a visual editor where a user can modify text, colors, and page elements.
- Saves edits locally in the browser using `localStorage`.
- Exports the edited page as a ZIP archive.

The current repository contains **one template**. The catalog is intentionally explicit: add a template JSON file and register its ID and filename in `templates/catalog.json`.

## Run locally

The project uses static HTML, CSS, and JavaScript. Run it through a local HTTP server so the browser can load JSON files:

```bash
python -m http.server 8000
```

Then open:

- `http://localhost:8000/`
- `http://localhost:8000/store.html`

Do not open the HTML files directly with a `file://` URL; browser fetch restrictions can prevent the catalog and template JSON from loading.

## Privacy and architecture

- No login or account is required.
- There is no payment gateway, credit balance, wallet, or purchase restriction.
- The public version does not load the former visit-tracking script.
- Editing state is stored in the current browser profile. It is not uploaded to a server.
- Export is generated in the browser and downloaded to the user's device.
- Fonts, icons, and the ZIP library are currently loaded from public CDNs.

## Repository structure

```text
index.html                 Landing page
store.html                 Public template library
preview.html               Open template preview
editor.html                Visual editor and ZIP export
templates/catalog.json     List of available templates
templates/template1.json   Template definition and HTML
```

## Research status

This repository is a **software prototype**, not a completed scientific study. A competitive science-fair submission still needs a clearly stated research question, a documented design rationale, reproducible tests, comparison against a baseline, measured results, limitations, and a discussion of what is genuinely new. No performance or user-study results are claimed in this repository.

## Licensing

The prototype is publicly accessible and has no payment or account gate. A formal open-source/content license has **not** been assigned yet. Before inviting reuse or redistribution, the project author should verify rights to every included template, image, font, icon, and dependency, then choose suitable licenses for original code and creative assets.
