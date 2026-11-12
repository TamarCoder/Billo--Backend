# Billo — Backend (REST API)

Billo is an app for creating and tracking invoices. A company keeps its
issuers, client companies and invoice templates in one place, and creates
monthly invoices in a few clicks.

This repository is the API. The web and desktop app is here:
[TamarCoder/Billo](https://github.com/TamarCoder/Billo).

## The problem

<!-- TODO: write your own story here, in 3–5 sentences.
     What did you do by hand before? What went wrong? Why did you build Billo? -->

## Features

- Organization accounts with session login and a login rate limit
- Admin area with its own guard
- Issuers, companies, invoice forms (templates) and invoices
- Monthly invoice history
- Health check endpoint for deployments

## Tech stack

- **NestJS** + **TypeScript**
- **PostgreSQL** with **TypeORM** and migrations
- **Vitest** for tests
- **Docker** / **docker-compose** for local runs
- **Kubernetes** manifests (`k8s/`) with an AWS EKS overlay

## Project structure

```
src/
  auth/           login, sessions, guards, decorators
  admin/          admin endpoints and admin guard
  organizations/  organization accounts
  issuers/        who issues the invoice
  companies/      who receives the invoice
  invoice-forms/  invoice templates
  invoices/       invoices
  settings/       organization settings
  health/         health check
  database/       data source, migrations, seed scripts
k8s/              Kubernetes base + local and EKS overlays
```

## Run locally

```bash
cp .env.example .env      # then fill in the values
docker compose up -d      # starts PostgreSQL
npm ci
npm run migration:run
npm run start:dev
```

The API runs on `http://localhost:4000` by default.

## Tests

```bash
npm test
```

## License

[MIT](LICENSE)
