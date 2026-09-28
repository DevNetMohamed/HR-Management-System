<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# HR Management System

A multi-tenant, fully configurable **Human Resources Management System (HRMS)** built with **NestJS** and **PostgreSQL**.

## Introduction

Most HR tools force every company into the same fixed rules. This project takes the opposite approach: one platform that any company can adopt, where **policies are configuration, not code**. Working hours, grace periods, leave types, approval chains, payroll rules and notification rules are all defined per company (tenant) by an administrator, without touching the codebase.

The system covers the complete employee lifecycle, from the job requisition that leads to a hire, through onboarding, day-to-day attendance, leave, payroll and performance, to offboarding and final settlement. Every sensitive action is recorded in an immutable audit log, and every company's data is fully isolated from the others.

The project was started as part of an internship at eYouth and is planned from a backlog of **18 epics / 180 user stories**.

## Key Principles

- **Multi-tenancy:** every request runs inside a tenant context, and every query is tenant-scoped.
- **Configurable business rules:** policies live in the database and are editable by company admins.
- **Approval engine:** one generic, configurable approval workflow reused by leave, payroll, recruitment, offboarding and more.
- **Auditability:** append-only audit trail with before/after values for sensitive changes.
- **Clean Architecture:** each module is split into `domain`, `application`, `infrastructure` and `presentation` layers, with dependencies pointing inward only.

## Modules

| Area | Modules |
|---|---|
| Platform | Company Settings, Access Control, Approval Engine, Audit Log, Notifications |
| Organization & People | Organization, Employee Model |
| Time & Absence | Attendance Management, Leave Management |
| Money | Payroll, Employee Benefits |
| Talent | Recruitment, Onboarding, Performance, Learning & Development, Offboarding |
| Operations | Asset Management, Reports |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) (TypeScript) |
| Database | PostgreSQL |
| Package manager | pnpm |
| Testing | Jest |

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/installation)
- [PostgreSQL](https://www.postgresql.org/download/) 14 or later (local install or Docker)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/DevNetMohamed/HR-Management-System.git
cd HR-Management-System
```

### 2. Install dependencies

```bash
pnpm install
```

If pnpm reports ignored build scripts, run `pnpm approve-builds` and allow the listed packages.

### 3. Configure the environment

Create a `.env` file in the project root:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=hrms

JWT_SECRET=change-me
```

> Adjust these variable names to match your configuration module.

### 4. Create the database

```bash
createdb hrms
```

Or with Docker:

```bash
docker run --name hrms-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=hrms -p 5432:5432 -d postgres:16
```

### 5. Run the application

```bash
# development (watch mode)
pnpm start:dev

# production build
pnpm build
pnpm start:prod
```

The API runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Start in watch mode |
| `pnpm start` | Start once |
| `pnpm build` | Compile to `dist/` |
| `pnpm start:prod` | Run the compiled build |
| `pnpm lint` | Lint and fix |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | End-to-end tests |
| `pnpm test:cov` | Test coverage |

## Project Structure

```
src/
  shared/                  shared kernel: base classes, ports, common utilities
  modules/
    <module-name>/
      domain/              entities, value objects, domain services, events, repository interfaces
      application/         use cases, DTOs, ports
      infrastructure/      persistence (repositories, mappers), adapters
      presentation/        controllers, validators
```

Modules communicate through ports (interfaces), never by importing each other's internals.

## Roadmap

Development follows the backlog dependency order:

| Phase | Scope |
|---|---|
| 1 | Platform core: tenancy, audit log, notifications, company settings, roles |
| 2 | Security and governance: approval definitions, field-level access |
| 3 | Organization and employee backbone |
| 4 | Attendance and leave |
| 5 | Asset management |
| 6 | Payroll |
| 7 | Employee benefits |
| 8 | Performance and learning |
| 9 | Recruitment |
| 10 | Onboarding |
| 11 | Offboarding and access lifecycle |
| 12 | Reports and hardening |

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push the branch: `git push origin feature/your-feature`
4. Open a Pull Request

## Author

**Mohamed Adel** ([@DevNetMohamed](https://github.com/DevNetMohamed))

## License

Add a license for the project (for example MIT) and reference it here.
