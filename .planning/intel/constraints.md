# Technical Constraints

**Source:** PRD-v2.0.0.md

- **VLC Eradication:** Complete zero-tolerance constraint on VLC bindings, shared libraries, or mentions.
- **Anime Domain Isolation:** `src/services/anime/` must never import `src/services/tmdb.ts`.
- **API Key Fallback:** Must function gracefully offline or without an API key using `src/services/mockData.ts`.
- **Windows Desktop WebView2:** All webview APIs must operate within Microsoft WebView2 / Tauri 2 container.
- **Chunked DOM Rendering:** Series with >500 episodes must be chunked in DOM to prevent browser thread freeze.
- **Security Sandboxing:** Embed provider iframes must be sandboxed and intercepted by Rust navigation guard.
