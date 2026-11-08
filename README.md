# Layoff Landing Pad

> The first 30 days after losing your job decide a lot. Nobody should go through them alone.

Losing a job knocks out your income, your routine, your sense of who you are and your work friendships all at once. Most job-search tools only deal with finding the next job. Landing Pad helps people **steady themselves first, then rebuild, then relaunch**, with a personalized 30-day plan and a small crew going through the same thing.

Built by **CozyFleece**, two fifth-year university students.

Landing Pad supports people through a hard time, but it isn't therapy.

https://layoff-landing-pad-seven.vercel.app/

## Features

| Area | What it does |
| --- | --- |
| **Onboarding** | A short intake about how the job ended, how you're feeling and what's most urgent. Your answers shape your plan. |
| **Today** | Daily mood check-in, today's plan tasks, Crew pulse, people in a similar spot, and a calendar with moods, events and follow-up reminders. |
| **30-day plan** | Four weekly themes (Land, Reflect, Rebuild, Relaunch) with small daily tasks, plus optional AI personalization. |
| **Confidence Room** | AI mock interviews for a real job, with feedback on each answer and an overall review. |
| **Job search** | Opens searches on Indeed, LinkedIn, Job Bank and Google Jobs, and tracks postings from saved through to offer. |
| **Crews** | Public crews anyone can join, and private crews joined by invite code. |
| **Workrooms** | Video rooms for each crew, with screen sharing, chat and a shared focus timer. |
| **Messages** | Live direct messages between friends and crew chats, with image and PDF attachments. |
| **Profile** | Your details, bio, friends, small-win streaks and privacy settings. |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router
- **Login:** Auth0
- **Database, storage and live updates:** Supabase (Postgres with row-level security, Storage, Realtime, Edge Functions)
- **AI:** Google Gemini, called from Vercel serverless functions
- **Video:** LiveKit
- **Hosting:** Vercel

## Project structure

```text
frontend/
  api/                  Vercel functions for the AI features
  scripts/              Checks, such as validating the plan template
  src/
    components/         Shared UI (header, footer, cards)
    pages/              One folder per page
    plan/               30-day plan template and logic
supabase/
  migrations/           Database changes, numbered in run order
  functions/workroom/   Edge Function that issues LiveKit passes
  checks/               SQL script that tests the privacy rules
  seed.sql              Test people, crews and activity
```

## Privacy

- Row-level security limits each person to their own data.
- Other people only see a person's name, field, experience, city, bio and tags. How a job ended, moods and check-ins stay private.
- Message attachments are in a private bucket and open through links that expire.
- Crew pulse shares career milestones only, never company names or job titles, and people can turn it off.
- Workroom calls aren't recorded.

## Known issues

- **Leftover attachments:** files stay in Storage if a message fails to send or its conversation is deleted.

## Research behind the project

- Public Health Agency of Canada (2024). [*Inequalities in Mental Health, Well-Being and Wellness in Canada: Social Determinants and Changes Over Time*](https://publications.gc.ca/site/eng/9.939125/publication.html).
- Sterud, T., et al. (2025). [Mental health effects of unemployment and re-employment: a systematic review and meta-analysis of longitudinal studies](https://doi.org/10.1136/oemed-2025-110194). *Occupational and Environmental Medicine*, 82(7).

---

© 2026 CozyFleece. All rights reserved.
