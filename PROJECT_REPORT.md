# Visual Product Finder - Project Report

**Agentic AI Engineering Bootcamp**
**Authors:** Maja Grubic
**Date:** April 2026

---

## 1. Problem Statement

Every day, people encounter products they want to buy but cannot identify -- a chair in a coffee shop, shoes someone is wearing, a lamp in a hotel lobby. Google Lens handles over 20 billion visual searches per month, with 20% being shopping-related. Existing solutions like Google Lens, Amazon StyleSnap, and Pinterest Lens are embedded in large ecosystems and are not easily customizable or transparent in how they work.

**Our goal:** Build a standalone web application where a user uploads a photo of any product, AI identifies what it is (brand, category, material, style), and a web search returns 3-5 matching products with prices and purchase links -- all in a single, streamlined flow.

---

## 2. Problem-First Approach

Rather than starting with technology choices, we began with the user journey:

1. **User sees a product** they want to identify and purchase.
2. **User uploads a photo** -- this must be frictionless (drag-and-drop, click to browse).
3. **AI analyzes the image** -- the system must identify product name, category, brand, materials, and style.
4. **Search engine finds purchase links** -- results must come from real retailers with actual prices.
5. **Results are displayed clearly** -- as actionable product cards with direct purchase links.

This user-centric flow drove every architectural decision. The two-step pipeline (vision AI then web search) mirrors how a human would approach the problem: first identify what you're looking at, then search for where to buy it.

---

## 3. Architecture and Tech Stack

### Chosen Stack
| Component        | Technology                     | Justification                                                                 |
|------------------|--------------------------------|-------------------------------------------------------------------------------|
| Frontend         | Next.js 16 + TypeScript        | Server-side API routes + React frontend in one project; type safety           |
| Styling          | Tailwind CSS 4                 | Rapid UI iteration; utility-first approach ideal for custom designs           |
| Vision AI        | Google Gemini (gemini-3.1-flash-lite-preview) | Free tier, multimodal (image + text), structured JSON output    |
| Web Search       | Tavily API                     | Purpose-built for AI applications; scoped to retail domains; extracts content |
| Database         | SQLite (better-sqlite3)        | Zero-config, file-based, perfect for local search history; no external DB     |
| Deployment       | Vercel                         | Native Next.js hosting; automatic deploys from GitHub                         |

### System Architecture

```
User Browser
    |
    v
[Next.js Frontend (page.tsx)]
    |
    |-- POST /api/identify --> Google Gemini Vision API
    |       Returns: { name, category, description, brand, searchQuery }
    |
    |-- POST /api/search --> Tavily Search API
    |       Input: optimized search query from Gemini
    |       Returns: [{ title, url, snippet, price, source }]
    |
    |-- POST /api/history --> SQLite Database
    |       Stores: image, product info, search results
    |
    v
[Product Cards UI with purchase links]
```

### Why Gemini Over Other Vision Models

- **Free tier availability**: No credit card required, generous quota for development and demos.
- **Multimodal native**: Gemini processes images and text in a single prompt, unlike models requiring separate vision preprocessing.
- **Structured output**: With careful prompting, Gemini returns parseable JSON with product attributes and an optimized search query.
- **Model flexibility**: When we hit rate limits on `gemini-2.0-flash`, we switched to `gemini-3.1-flash-lite-preview` with zero code changes beyond the model name.

### Why Tavily Over Direct Google Search

- **AI-optimized**: Returns clean, structured content rather than raw HTML.
- **Domain scoping**: We restricted results to major retailers (Amazon, Walmart, Target, IKEA, Wayfair, Best Buy, etc.) to ensure purchase-relevant results.
- **Price extraction**: Content returned by Tavily contains pricing information that we regex-extract for display.
- **Free tier**: 1,000 searches/month is sufficient for development and demonstration.

---

## 4. Development Process with Claude Code

The entire application was built interactively using Claude Code (CLI) powered by Claude Opus. Below is a chronological account of the prompts and iterations.

### Stage 1: Project Scaffolding
**Prompt approach:** Provided the full project brief including problem statement, tech stack requirements, and definition of done.

Claude Code:
- Scaffolded a Next.js 16 project with TypeScript and Tailwind CSS using `create-next-app`.
- Installed the `@google/generative-ai` SDK.
- Created `.env.local` with API key placeholders.
- Built three core files: the main page, the identify API route, and the search API route.
- Verified the build passed before presenting the result.

### Stage 2: Gemini Integration and Debugging
**Iterative fixes:**
- Initial model (`gemini-2.0-flash`) hit rate limits. Switched to `gemini-2.0-flash-lite`, then to `gemini-3.1-flash-lite-preview` at user request.
- Gemini returned JSON with trailing commas and occasional markdown code fences. Fixed the parser to strip code fences, remove trailing commas, and extract JSON via regex from surrounding text.
- Added logic to detect when Gemini cannot identify a product (returns "None" or "Unknown") and skip the Tavily search, showing a user-friendly message instead.

### Stage 3: UI/UX Design with Frontend Design Skill
**Skill used:** `/frontend-design` -- a Claude Code skill that guides creation of distinctive, production-grade frontend interfaces.

**Design direction chosen:** Dark editorial luxury -- inspired by high-end fashion magazines. Key choices:
- **Typography:** Instrument Serif (display headings) + DM Sans (body text) -- replacing generic system fonts.
- **Color palette:** Deep charcoal background (#0c0a09), warm amber accent (#d4a373), lime green for prices (#a3e635).
- **Atmosphere:** Subtle film grain overlay via SVG noise texture, ambient radial glow, gradient fades on images.
- **Animations:** Staggered fade-up reveals on page load, dual-orbit spinner for loading states, hover lift effects on product cards with amber glow shadows.
- **Layout:** Asymmetric 3:2 grid (image vs. identification panel), camera viewfinder corner accents on the upload zone.

### Stage 4: Iterative UI Polish
Based on visual feedback (screenshots provided by the user):
- Made the "Identify & Find Product" button more prominent with larger padding, bolder font, and amber glow shadow.
- Fixed CSS animation spinners that weren't rotating (moved from inline styles to CSS classes).
- Generated a custom SVG favicon matching the app's branding (camera lens icon in amber on dark background).
- Added a footer with attribution.
- Fixed layout so footer stays at viewport bottom using flexbox.
- Replaced inline camera SVG header icon with the favicon for brand consistency.
- Made the logo clickable (links to home).
- Filtered out empty/null brand badges from product identification cards.

### Stage 5: SQLite Search History
Added persistent search history stored in SQLite:
- **Database schema:** Two tables -- `searches` (stores image, mime type, all Gemini-returned fields) and `search_results` (stores each Tavily result linked to its search via foreign key).
- **API routes:** `GET/POST /api/history` for listing and saving; `GET /api/history/[id]` for fetching full details including image.
- **History page:** Accordion-style list with thumbnails, expandable to show full product description, uploaded image, and all purchase links.
- **Conditional visibility:** History tab only visible on localhost, hidden in production (since SQLite doesn't persist on serverless platforms like Vercel).

### Stage 6: Deployment
- Created a GitHub repository (`majagrubic/visual-product-finder`).
- Pushed code (with `.env*` and `*.db` gitignored).
- Deployed to Vercel with environment variables configured.
- Automatic redeployment on push to main branch.

---

## 5. Claude Code Plugins and Skills Used

| Skill/Plugin        | Purpose                                                                 |
|---------------------|-------------------------------------------------------------------------|
| `frontend-design`   | Guided the UI redesign with distinctive dark editorial luxury aesthetic  |
| Playwright (available) | Available for browser testing but not used in this project           |

The `frontend-design` skill was particularly valuable. It enforced creative constraints that prevented the UI from falling into generic "AI slop" aesthetics -- pushing for distinctive typography choices, atmospheric backgrounds, and intentional color palettes rather than default purple gradients on white.

---

## 6. Analysis of Results

### What Works Well
- **End-to-end flow completes in ~5 seconds:** Image upload to purchase links.
- **Gemini identification is surprisingly accurate:** Correctly identified nesting coffee tables including material (metal/painted wood), finish (matte cream), and style (minimalist modern).
- **Tavily returns relevant results:** Scoping to major retail domains ensures actionable purchase links rather than blog posts or reviews.
- **UI is polished and distinctive:** The dark editorial aesthetic gives the app a premium feel appropriate for a product discovery tool.
- **Graceful degradation:** When Gemini can't identify a product (e.g., a landscape photo), the app skips the search and shows a helpful message.

### Limitations
- **Price extraction is regex-based:** Only finds prices in the format `$X.XX` within Tavily snippets. Misses prices in other formats or when not present in the excerpt.
- **No image similarity matching:** Results are text-search based on Gemini's description, not visual similarity. A red chair might return blue chairs if the text query isn't specific enough.
- **SQLite doesn't work in production (Vercel):** Serverless functions have ephemeral filesystems. History only works locally.
- **Large images increase API latency:** Full base64 images are sent to Gemini. No client-side resizing or compression.
- **Single product per image:** The system identifies one product. Photos with multiple products may get confused.

---

## 7. Broader Implications

### Accessibility of Visual Search
This project demonstrates that a functional visual product search can be built by an individual developer in a single session using:
- A free-tier vision AI model
- A free-tier search API
- An open-source web framework
- An AI coding assistant

What was once the domain of Google, Amazon, and Pinterest is now achievable at prototype scale with commodity APIs.

### The Two-Model Pipeline Pattern
The architecture -- vision model for understanding, search model for retrieval -- is a reusable pattern applicable beyond product search:
- **Medical:** Identify a plant/insect from a photo, search for care information.
- **Real estate:** Photograph a building, find listings.
- **Fashion:** Snap an outfit, find similar pieces across retailers.
- **Education:** Photograph a problem, search for explanations.

### AI-Assisted Development
Building this app with Claude Code demonstrated a productive human-AI collaboration pattern:
- **Human provides direction** (what to build, design preferences, feature requests).
- **AI handles implementation** (scaffolding, API integration, CSS, debugging).
- **Human provides visual feedback** (screenshots of issues).
- **AI iterates rapidly** (fix, rebuild, verify in seconds).

The total development time from empty directory to deployed application was approximately one session, producing ~1,140 lines of production code across 9 source files.

---

## 8. Potential Improvements

### Short-term
- **Client-side image compression** before upload to reduce API latency and payload size.
- **Streaming responses** so the user sees the product identification before the search completes.
- **Multiple product detection** allowing users to tap/select which product in a multi-object image.
- **Better price parsing** using Gemini to extract structured pricing from search snippets instead of regex.

### Medium-term
- **PostgreSQL or Turso** for production-ready search history that persists on serverless platforms.
- **Image similarity search** using embeddings (e.g., CLIP) to find visually similar products, not just text-matched ones.
- **User accounts** to save favorites and track price changes over time.
- **Camera integration** for mobile devices to photograph products directly in the app.

### Long-term
- **Price comparison engine** aggregating results across retailers for the same product.
- **AR overlay** showing purchase information when pointing a phone camera at products.
- **Browser extension** enabling right-click "Find this product" on any image on the web.
- **Affiliate integration** for monetization through purchase link referrals.

---

## 9. Repository and Live Demo

- **GitHub:** https://github.com/majagrubic/visual-product-finder
- **Live Demo:** https://visual-product-finder-r5xwygpt2-majagrubics-projects.vercel.app/
- **Tech:** Next.js 16 | TypeScript | Tailwind CSS 4 | Gemini Vision | Tavily Search | SQLite

---

## 10. Conclusion

The Visual Product Finder successfully demonstrates that complex, multi-API AI applications can be rapidly prototyped using modern tools and AI-assisted development. The problem-first approach ensured every technical decision served the user journey. The combination of Gemini's multimodal understanding with Tavily's structured web search creates a pipeline that transforms a photo into actionable purchase links in seconds.

The project validates the bootcamp's thesis: that agentic AI tools (Claude Code) combined with accessible AI APIs (Gemini, Tavily) dramatically lower the barrier to building sophisticated applications that would have required large teams and significant infrastructure just a few years ago.
