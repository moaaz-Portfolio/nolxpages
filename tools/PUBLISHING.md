# NOLX local GitHub publisher

This helper publishes the edited template as a new public GitHub repository and asks GitHub Pages to serve it.

## Requirements

- Node.js 22 or newer.
- A GitHub Personal Access Token (classic) with the `repo` scope.
- Keep the token private. Do not paste it into HTML, JavaScript, chat, or a committed file.

## Start it from PowerShell

Run these commands from the repository root:

```powershell
$secure = Read-Host "GitHub token" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $env:NOLX_GITHUB_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
node .\tools\publisher-server.mjs
```

Keep this terminal open. Then open this exact address:

`http://127.0.0.1:4173/editor.html?id=1`

Use the **نشر على GitHub** button in the editor and enter a new repository name. Each publish creates a new public repository; choose a name that has not been used before. It commits the generated site as `index.html` and requests GitHub Pages activation.

## Important

- This local server binds only to `127.0.0.1`; it is not a public backend.
- The token remains in the Node process environment. It is not stored in this repository or included in browser JavaScript.
- GitHub Pages deployment may take a short time after GitHub accepts the Pages configuration.
- If GitHub refuses Pages activation, the HTML is still committed. Open the new repository's **Settings → Pages**, select the main branch and root folder, then save.
- A published repository is public. Do not publish private data, passwords, access tokens, or information you do not want public.
