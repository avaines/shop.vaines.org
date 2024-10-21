# Visit [shop.vaines.org](https://shop.vaines.org) to buy my stuff...please

## A Hugo e-commerce site, backed by Square payment gateway, supported by Cloudflare workers for dynamic product inventory

This repository contains the source code for an e-commerce website hosted on **Cloudflare Pages** (frontend) and a **Cloudflare Worker** backend. The frontend is built using the **Hugo static site generator**, and the backend fetches product data and hosted checkout payment links from the **Square API** with basic caching using **Cloudflare KV**.


### Frontend (Hugo)

The frontend is a static website generated using **Hugo** and hosted on **Cloudflare Pages**. Content is written in Markdown and managed in the `frontend/content/` directory. When deployed, Hugo generates the static files in the `frontend/public/` directory, which is then uploaded to Cloudflare Pages.

### Backend (Cloudflare Worker)

The backend is a **Cloudflare Worker** that interacts with the **Square API** to fetch product data. It uses **Cloudflare KV** for caching the API responses to avoid rate limits and reduce API calls.

## Caching

The backend Worker caches product data from the Square API in Cloudflare KV for the amount of time specified by CACHE_EXPIRATION_MINUTES. This reduces API calls and avoids rate-limiting.


## Deployment

### Prerequisites

- **Node.js** (v20 or later)
- **npm** (Node package manager)
- **Serverless Framework**: Install globally with `npm install -g serverless`
- **Hugo**: Install Hugo to build the frontend, `brew install hugo` if you have `brew` available, otherwise visit the [Hugo website](https://gohugo.io/getting-started/installing/).


### Environment Variables

This project uses environment variables for sensitive data like API tokens. You'll need to set the following environment variables in a `.env` file for local development, or configure them as **GitHub Secrets** for deployment.

| Variable Name              | Description                          |
|----------------------------|--------------------------------------|
| `CLOUDFLARE_ACCOUNT_ID`    | Your Cloudflare account ID           |
| `CLOUDFLARE_API_TOKEN`     | API token for Cloudflare API         |
| `SQUARE_ACCESS_TOKEN`      | Square API access token              |
| `SQUARE_API_BASE_URL`      | Base URL for the Square API          |
| `CACHE_EXPIRATION_MINUTES` | Cache expiration time (in minutes)   |
| `CACHE_KEY`                | The Cloudflare KV item key           |
| `DEBUG`                    | Enable debug logs on the worker      |


### Deploying with Serverless Framework

This project is set up to use the **Serverless Framework** for managing deployments. The `serverless.yml` file configures deployment for both the backend (Worker) and frontend (Cloudflare Pages).

#### Deployment Stages

You can deploy to different stages, such as `dev` (for previews) or `prod` (for production), depending on the branch you're deploying from.

- **Production**: The `main` branch deploys to production.
- **Development**: The `dev` branch deploys to a preview cloudflare environment and uses the Sandbox API key/URLs for Square.

#### To Deploy

1. Install dependencies:
   ```bash
   npm install

    Build the Hugo static site:

    bash

hugo --source ./frontend

Deploy using Serverless Framework:

bash

    sls deploy --stage dev   # For development
    sls deploy --stage prod  # For production

GitHub Actions CI/CD

This repository uses GitHub Actions for automated CI/CD. When you push changes to the main or dev branch, the deployment process will trigger automatically.

    Main branch: Deploys the frontend and backend to production.
    Dev branch: Deploys the frontend and backend to the development preview environment.

You can find the workflow configuration in .github/workflows/deploy.yml.
Testing Locally

To test the Cloudflare Worker locally, use the Wrangler CLI:

    Install Wrangler:

    bash

npm install -g @cloudflare/wrangler

Run the Worker locally:

bash

    wrangler dev backend/index.js

Visit http://localhost:8787 to view your API locally.
