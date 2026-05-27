# ForexOS Static Front-End Deployment Guide (100% Free)

As a senior software engineer, I have designed ForexOS to run entirely client-side. The authentication context, date conversions, and user-isolated trade logs persist securely inside the browser (`localStorage`), which means **the application requires absolutely zero expensive back-end servers or databases to run!**

This architecture allows you to deploy and host the entire platform for **100% FREE** with high performance, globally distributed CDN nodes, automatic SSL, and zero maintenance.

Below are the step-by-step guides for the top free hosting platforms.

---

## Option 1: Vercel (Recommended - Fastest & Easiest)
Vercel is the premier cloud platform for hosting static Vite + React applications. The free tier includes automatic deployment on every git commit, SSL, and huge bandwidth capacity.

### Step-by-Step Setup:
1. **Push your code to GitHub:**
   - Initialize a local git repository: `git init`
   - Add files and commit: `git add . && git commit -m "feat: complete forexos build"`
   - Create a repository on GitHub and push: `git remote add origin <your-repo-url> && git push -u origin main`
2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com) and sign up for a **free Hobby account** using your GitHub credentials.
   - Click **Add New** > **Project**.
   - Import your newly created repository from the list.
3. **Configure Build Settings:**
   - Vercel automatically detects that the project is built in **Vite**.
   - Make sure **Build Command** is set to `npm run build` (or `npx -w web npm run build` inside the monorepo).
   - Make sure **Output Directory** is set to `dist` (specifically `apps/web/dist` if importing the whole monorepo).
   - Click **Deploy**.
4. **Complete:** Your site is live on a custom sub-domain (e.g. `yourproject.vercel.app`) in under 30 seconds!

---

## Option 2: Netlify (Alternative)
Netlify is another outstanding developer platform offering a massive, fully free static hosting tier.

### Step-by-Step Setup:
1. **GitHub Push:** (Same as Step 1 above).
2. **Sign in to Netlify:**
   - Go to [Netlify](https://www.netlify.com) and log in using your GitHub account.
   - Click **Add new site** > **Import an existing project**.
   - Select **GitHub** and authorize.
3. **Import Project:**
   - Select your ForexOS repository.
   - Set the build settings:
     - **Build Command**: `npm run build`
     - **Publish Directory**: `apps/web/dist`
   - Click **Deploy site**.
4. **Complete:** Your terminal is live with a free SSL certificate!

---

## Option 3: Local Single-Command Offline Preview (Zero Setup)
If you want to run the fully optimized production bundle locally on your computer completely offline (without pushing to any server or signing up anywhere):

1. From the `apps/web` root directory, build the project:
   ```bash
   npm run build
   ```
2. Spin up a lightweight local production preview server using Vite:
   ```bash
   npm run preview
   ```
3. Open `http://localhost:4173` in your browser to experience the lightning-fast production bundle instantly!
