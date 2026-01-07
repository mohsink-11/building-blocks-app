# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## PWA & Advanced Features ✅

- Progressive Web App: This project is PWA-enabled using `vite-plugin-pwa`. A service worker is generated at build time and an offline fallback (`/offline.html`) is provided.
  - In development, the PWA plugin's `devOptions` are enabled to help testing.
  - To test: run `npm run build` and `npm run preview`, then access the app and try "Add to Home Screen" or simulate offline mode in your browser devtools.
- Templates: The `Templates` page supports import/export (JSON), duplicate, edit, and delete. Templates are persisted to `localStorage` (key: `templates_v1`). Future work can add Supabase persistence.
- Batch processing: The `Upload` page now supports multi-file uploads and a simple background worker-based batch processor (simulated). Use "Process Batch" to run background processing for files that are ready.

---
## Authentication (Supabase) 🔐

This project uses Supabase Auth for user authentication. To enable auth locally:

1. Add the following environment variables to a `.env` file at the project root:
   - `VITE_SUPABASE_URL` - your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - your Supabase publishable anon key

2. Enable OAuth providers (Google, Microsoft, GitHub, etc.) in your Supabase project's Authentication > Providers settings and set the redirect URI to `http://localhost:5173/` (or your dev origin).

3. The `Login` and `Register` pages use the Supabase client in `src/integrations/supabase/client.ts`. Social sign-in buttons will open the provider consent flow (you may be redirected back to `/dashboard` after successful sign-in).

---

## AI Suggestions & File Processing 🤖

This project includes a Supabase Edge Function (`ai-suggest-mappings`) that calls the OpenAI API to generate mapping suggestions from detected columns.

Environment variables required:
- `OPENAI_API_KEY` - OpenAI API key used by the Edge Function

Deploying the function (Supabase CLI):

1. Install and login to the Supabase CLI: `npm i -g supabase` then `supabase login`.
2. From the repository root, deploy the function: `supabase functions deploy ai-suggest-mappings --project-ref <your-project-ref>`.
3. Ensure `OPENAI_API_KEY` is set in your Supabase project's Environment Variables (Dashboard > Settings > Environment Variables) or set it when running the function locally.

Local dev notes:
- The Upload page will call `ai-suggest-mappings` when a file has been validated and columns are detected. If the function or key is not available, the app gracefully falls back to local simulation.

---
If you'd like, I can add end-to-end tests for PWA installability and offline behavior, or persist templates to Supabase. Let me know which you'd prefer next.
