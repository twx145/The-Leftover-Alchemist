# The Leftover Alchemist

![Vercel Deploy](https://img.shields.io/badge/deploy-Vercel-blue?logo=vercel)
![TypeScript](https://img.shields.io/badge/code-TypeScript-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/build-Vite-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)
![Issues](https://img.shields.io/github/issues/twx145/The-Leftover-Alchemist)
![Stars](https://img.shields.io/github/stars/twx145/The-Leftover-Alchemist?style=social)

Turn your fridge into a recipe engine: take a photo of leftovers or ingredients, and an AI “chef” crafts tailored dishes, complete with saved history and favorites for quick recall.

---

## Overview

The Leftover Alchemist lets you snap your open fridge or upload an image of ingredients, then generates recipes using an AI backend. It’s designed for quick meal ideas and playful exploration, featuring sections like “Michelin Star,” “Hell Kitchen,” and “Popular Recipes” for inspiration. The project is built with TypeScript and Vite, and runs locally with Node.js; it uses a Gemini API key set via `.env.local` to power its AI capabilities.

---

## Live demo

- **Website:** https://the-leftover-alchemist.vercel.app/  
- **Repo:** https://github.com/twx145/The-Leftover-Alchemist

---

## Features

- **Image-to-recipe:** Upload or snap your fridge contents; the AI chef proposes recipes based on what it sees.
- **Quick inspiration:** Explore curated “Michelin Star,” “Hell Kitchen,” and “Popular Recipes” sections for ideas.
- **History and favorites:** Keep track of what you’ve tried; save your best results for next time.
- **Localization-ready:** Project includes translation scaffolding to support multi-language UI.

---

## Quick start

1. **Prerequisites:**  
   - **Node.js:** Ensure Node is installed.

2. **Install dependencies:**  
   - **Command:** `npm install`.

3. **Configure environment:**  
   - **Create:** `.env.local`  
   - **Set:** `GEMINI_API_KEY=<your_api_key>`.

4. **Run locally:**  
   - **Command:** `npm run dev`  
   - **Open:** development server as indicated by Vite output.

> The repository’s README outlines the same steps (Node.js, npm install, `.env.local` with `GEMINI_API_KEY`, and `npm run dev`).

---

## Tech stack and structure

- **Core stack:**  
  - **TypeScript + Vite:** Frontend app scaffold and dev server.  
  - **AI backend (Gemini):** Accessed via `GEMINI_API_KEY` in `.env.local`.

- **Key files & dirs:**  
  - **components/**: UI components for the app’s views and interactions.  
  - **services/**: Logic for AI calls and data handling.  
  - **translations.ts**: Base for multi-language strings.  
  - **App.tsx / index.tsx / index.html**: App entry points and mounting.  
  - **types.ts / tsconfig.json / vite.config.ts**: Types, TS config, and build/dev setup.

> Languages breakdown: TypeScript (~93.6%), HTML (~6.4%).

---

## Deployment

- **Vercel:** The project is deployed on Vercel (live demo above). You can fork the repo and import to Vercel; set `GEMINI_API_KEY` as a project environment variable, then deploy from main.

> The public demo is hosted at the provided Vercel URL; the Vercel dashboard requires login for deeper details.

---

## Roadmap

- **Improved vision prompts:** Enhance parsing of mixed leftovers and ambiguous items.  
- **Nutritional info:** Offer estimated macros per recipe.  
- **Dietary filters:** Gluten-free, vegan, halal, and allergy-aware suggestions.  
- **Offline caching:** Keep recent recipes accessible without network.  
- **More languages:** Expand translations beyond the current scaffold.

---

## Contributing

- **Issues & PRs:** Open an issue describing the change; link to relevant components/services.  
- **Code style:** TypeScript-first, clear types, small components, pure functions in services.  
- **Env safety:** Never commit keys. Use `.env.local`; rely on Vercel project env in production.

---

## License

- **Status:** No explicit license is set in the repository at this time; consider adding MIT or Apache-2.0 to encourage collaboration.

> Sources: 
