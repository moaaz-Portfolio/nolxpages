# NOLX PAGES — Public Prototype

NOLX PAGES is a browser-based prototype for browsing, previewing, and visually editing website templates.

## Current public behavior

- No user account or login is required.
- No prices, wallet, credits, purchase flow, recharge, or payment gateway.
- Templates are listed in `templates/catalog.json`.
- Users can preview a template, edit its content, save changes in the current browser, and export a ZIP archive.
- User edits remain local to the browser; they are not uploaded to a server.
- The former visit-notification script was removed from the deployed tree.

## Run locally

Use a local HTTP server because the browser must fetch JSON files:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`.

## Pages

- `index.html`: original NOLX landing page design.
- `store.html`: public free template library.
- `preview.html`: open template preview.
- `editor.html`: local visual editor and ZIP export.
- `dashboard.html`: local workspace overview.
- `my-templates.html`: locally saved work in this browser.
- `login.html` and `recharge.html`: compatibility pages explaining that accounts and payments are not required.
- `admin.html` and `admin2.html`: local-only admin information/tools; they do not provide server-side permissions or modify GitHub.

## Security notes

Static GitHub Pages cannot securely enforce private administrator permissions or store private API tokens. Do not put service-role keys, bot tokens, GitHub tokens, passwords, or private user data in client-side HTML/JavaScript. Any real remote admin workflow must be implemented behind authenticated server-side endpoints with verified access policies.

A Telegram bot token was previously exposed in the repository's Git history. Removing the file from the latest tree does not invalidate the old token or erase historical commits. Revoke/rotate that token in BotFather immediately.

## Research status

This is a software prototype, not a completed scientific study. An ISEF submission still needs a narrow research question, prior-work review, a specific technical contribution, reproducible tests, a meaningful baseline, measured results, limitations, and required approvals for any human-participant study. No research performance claims are made here.

## Licensing

The repository is publicly accessible and the prototype has no paywall. No formal open-source license is assigned yet because rights to all template, image, font, icon, and dependency assets must be verified first.
