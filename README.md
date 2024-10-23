# Visit [shop.vaines.org](https://shop.vaines.org) to buy my stuff...please

## A Hugo e-commerce site, backed by Square payment gateway, supported by Cloudflare workers for dynamic product inventory.

This repository contains the source code for an e-commerce website hosted on **Cloudflare Pages** (frontend) and a **Cloudflare Worker** (backend). The frontend is built using the **Hugo static site generator**, and the backend fetches product data and hosted checkout payment links from the **Square API** with basic caching by way of **Cloudflare KV**. With a zero operating cost *(excluding Square transaction fees)*


### Frontend (Hugo)

The frontend is a static website generated using **Hugo** and hosted on **Cloudflare Pages**. Content is written in Markdown and managed in the `frontend/content/` directory. When deployed, Hugo generates the static files in the `frontend/public/` directory, which is then uploaded to Cloudflare Pages.

### Backend (Cloudflare Worker)

The backend is a **Cloudflare Worker** that interacts with the **Square API** to fetch product data. It uses **Cloudflare KV** for caching the API responses to avoid rate limits and reduce API calls.


## Deployment

### Prerequisites

- **Node.js** (v20 or later)
- **npm** (Node package manager)
- **Wrangler**: Install using `npm install wrangler --save-dev`
- **Hugo**: Install Hugo to build the frontend, `brew install hugo` if you have `brew` available, otherwise visit the [Hugo website](https://gohugo.io/getting-started/installing/).


### Environment Variables

This project uses environment variables for sensitive data like API tokens. You'll need to set the following environment variables in a `.env` file for local development, or configure them as **GitHub Secrets** for deployment.

| Variable Name              | Description                          |
|----------------------------|--------------------------------------|
| `CACHE_EXPIRATION_MINUTES` | Cache expiration time (in minutes)   |
| `CLOUDFLARE_ACCOUNT_ID`    | Your Cloudflare account ID           |
| `CLOUDFLARE_API_TOKEN`     | API token for Cloudflare API         |
| `DEBUG`                    | Enable debug logs on the worker      |
| `SQUARE_ACCESS_TOKEN`      | Square API access token              |
| `SQUARE_API_BASE_URL`      | Base URL for the Square API          |
| `LOCATION_ID`              | Square location ID for the products  |


#### Deployment Stages

#### To Deploy Frontend

**Frontend**
```bash
    cd frontend
    hugo dev # will build the Hugo static site and run on a local web server
    hugo build # will generate the public directory alone, for uploading to a webserver
```
Rather than hosting this through GitHub Pages like I usually would, i've just set this up in CloudFlare pages. Longer term I would prefer to have Wrangler or Serverless Framework config for setting this up automatically. but as its linked to GitHub it handles deployments automatically for me now anyway

**Backend**
    - Create a new KV store
```bash
    cd backend
    vi wrangler.toml # update the KV bindings with your KV store namespace ID
    cp 'example .dev.vars' .dev.vars
    vi .dev.vars # Now update the SQUARE_ACCESS_TOKEN & LOCATION_ID environmental variables you details
    npx wrangler login
    npx wrangler dev # will run the function in a local execution environment
    npx wrangler deploy # will deploy the worker to the cloudflare
```
    - Populate SQUARE_ACCESS_TOKEN & LOCATION_ID environmental variables
    - Set up the integration with Github for it to just keep deploying as you make changes.

I've just set this up in CloudFlare Workers and configured github integration. Longer term I would prefer to have Wrangler or Serverless Framework config for setting this up automatically.
