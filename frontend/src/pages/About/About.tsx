import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Link } from "react-router";
import Footer from "../Landing/Footer";
import Header from "../Landing/Header";
import { FOCUS_RING } from "../Landing/styles";

// Sources are linked to their official pages. Keep the wording here to what
// each source actually says.
const EVIDENCE = [
  {
    label: "Canada · 2024",
    finding:
      "Losing work affects mental health through more than money: it can also take away social connection, daily structure and a sense of identity.",
    detail:
      "The Public Health Agency of Canada looked at how employment, income and other social conditions shape mental health and well-being across Canada, and how those gaps have changed over time.",
    source:
      "Public Health Agency of Canada, Inequalities in Mental Health, Well-Being and Wellness in Canada (2024)",
    links: [
      {
        label: "Read the report",
        href: "https://publications.gc.ca/site/eng/9.939125/publication.html",
      },
    ],
  },
  {
    label: "Research review · 2025",
    finding:
      "Unemployment was linked to more depression, anxiety and psychological distress, and symptoms tended to ease after people found work again.",
    detail:
      "A systematic review and meta-analysis pooled long-term studies that followed people through job loss and re-employment over time.",
    source: "Sterud et al., Occupational and Environmental Medicine (2025)",
    links: [
      {
        label: "Read the paper",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12505101/",
      },
    ],
  },
];

const PILLARS = [
  {
    name: "Steady",
    color: "bg-teal-600",
    text: "Daily check-ins, ways to manage stress, a routine to lean on, and room to make sense of what happened.",
  },
  {
    name: "Rebuild",
    color: "bg-amber-500",
    text: "The admin checklist, finding skill gaps, telling your story, and getting your resume ready.",
  },
  {
    name: "Crew",
    color: "bg-violet-600",
    text: "A small group going through the same thing, for accountability and slowly rebuilding your network.",
  },
];

const PEOPLE = [
  {
    situation: "Laid off",
    name: "Jordan, 34",
    story:
      "A tech company cut 20% of its staff, and Jordan found out by email. Shocked, worried about money, and stuck on “why me?”",
    needs: "Get organized fast, and hear that it wasn't personal.",
  },
  {
    situation: "Let go",
    name: "Sam, 27",
    story:
      "Let go from a retail management job over performance. Feels ashamed, avoids telling people, and dreads “why did you leave?”",
    needs: "Reframe what happened, with a script for explaining it.",
  },
  {
    situation: "Quit",
    name: "Aisha, 41",
    story:
      "Quit nursing because of burnout. Relieved and guilty at the same time, and not sure what comes next.",
    needs: "Recover first, and explore other careers before rushing back.",
  },
];

const PRINCIPLES = [
  {
    title: "Calm, not urgent",
    text: "Soft colours and lots of white space. No red badges and no “you're behind!” guilt.",
  },
  {
    title: "Small steps",
    text: "Each day has a few tasks sized to your energy. Rest counts as progress too.",
  },
  {
    title: "Fits how your job ended",
    text: "Being laid off, let go or quitting each feel different, so your plan starts from your situation.",
  },
  {
    title: "Yours to share",
    text: "Moods and notes stay private. Your crew only sees what you choose to share.",
  },
];

function About() {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    const previous = document.title;
    document.title = "About us · Layoff Landing Pad";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        {/* Intro */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
          <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">
            About us
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            The first 30 days after losing your job decide a lot. Nobody should
            go through them alone.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-slate-600">
            We're{" "}
            <span className="font-semibold text-slate-900">CozyFleece</span>,
            two fifth-year university students. We built Landing Pad because
            most job-search tools only help with one part of losing a job:
            finding the next one.
          </p>
        </section>

        {/* Why */}
        <section
          aria-labelledby="why-heading"
          className="border-y border-slate-200 bg-white py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2
                id="why-heading"
                className="text-3xl font-semibold tracking-tight text-balance"
              >
                Why we're building this
              </h2>
              <p className="mt-4 text-pretty text-slate-600">
                Losing a job knocks out your income, your routine, your sense of
                who you are and your work friendships all at once. The research
                backs up what people going through it already know.
              </p>
            </div>

            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {EVIDENCE.map((item) => (
                <li
                  key={item.source}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-pretty text-slate-900">
                    {item.finding}
                  </p>
                  <p className="mt-3 text-sm text-pretty text-slate-600">
                    {item.detail}
                  </p>
                  <div className="mt-auto pt-5 text-sm">
                    <p className="text-slate-500">{item.source}</p>
                    {item.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2 inline-flex items-center gap-1 rounded font-medium text-teal-800 underline-offset-4 hover:underline ${FOCUS_RING}`}
                      >
                        {link.label}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-2xl text-pretty text-slate-600">
              That last part matters to us: things get better when people get
              back to work. So Landing Pad helps people{" "}
              <span className="font-medium text-slate-900">
                steady themselves first, then rebuild, then relaunch
              </span>
              , with a personalized 30-day plan and a small crew going through
              the same thing.
            </p>
          </div>
        </section>

        {/* What */}
        <section aria-labelledby="pillars-heading" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="pillars-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              Three things, together
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-slate-600">
              Everything in Landing Pad fits under one of these.
            </p>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {PILLARS.map((pillar) => (
                <li
                  key={pillar.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 w-10 rounded-full ${pillar.color}`}
                  />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">
                    {pillar.name}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-slate-600">
                    {pillar.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Who */}
        <section
          aria-labelledby="who-heading"
          className="border-y border-slate-200 bg-white py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="who-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              Who it's for
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-slate-600">
              Every job loss feels different, so the app adapts to how yours
              ended.
            </p>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {PEOPLE.map((person) => (
                <li
                  key={person.name}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <p className="self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-200">
                    {person.situation}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {person.name}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-slate-600">
                    {person.story}
                  </p>
                  <p className="mt-auto pt-4 text-sm text-pretty text-slate-800">
                    <span className="font-medium">What helps:</span>{" "}
                    {person.needs}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-slate-500">
              Jordan, Sam and Aisha are examples to show how the app adapts, not
              real people.
            </p>
          </div>
        </section>

        {/* How */}
        <section aria-labelledby="principles-heading" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="principles-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              How we design it
            </h2>
            <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title}>
                  <dt className="font-semibold text-slate-900">
                    {principle.title}
                  </dt>
                  <dd className="mt-2 text-sm text-pretty text-slate-600">
                    {principle.text}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 p-8 text-white sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready when you are
              </h2>
              <p className="mt-2 max-w-xl text-pretty text-teal-50">
                Start with a few questions about what happened. Your plan and
                your crew take it from there.
              </p>
            </div>
            <Link
              to={isAuthenticated ? "/home" : "/register"}
              className="shrink-0 rounded-lg bg-white px-5 py-2.5 font-medium text-teal-900 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isAuthenticated ? "Go to your home" : "Get started"}
            </Link>
          </div>
        </section>

        {/* Sources */}
        <section
          aria-labelledby="sources-heading"
          className="mx-auto max-w-6xl px-4 pb-8 sm:px-6"
        >
          <h2
            id="sources-heading"
            className="text-sm font-semibold tracking-wide text-slate-500 uppercase"
          >
            Sources
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-pretty text-slate-600">
            <li>
              Public Health Agency of Canada. (2024).{" "}
              <cite>
                Inequalities in Mental Health, Well-Being and Wellness in
                Canada: Social Determinants and Changes Over Time
              </cite>
              . Government of Canada.{" "}
              <a
                href="https://publications.gc.ca/site/eng/9.939125/publication.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-800 underline"
              >
                publications.gc.ca
              </a>
            </li>
            <li>
              Sterud, T., et al. (2025). Mental health effects of unemployment
              and re-employment: a systematic review and meta-analysis of
              longitudinal studies.{" "}
              <cite>Occupational and Environmental Medicine</cite>, 82(7).{" "}
              <a
                href="https://doi.org/10.1136/oemed-2025-110194"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-800 underline"
              >
                doi:10.1136/oemed-2025-110194
              </a>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
