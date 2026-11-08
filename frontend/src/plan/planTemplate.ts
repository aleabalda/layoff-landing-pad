// The 30-day plan template. When someone finishes onboarding, buildPlan()
// picks tasks for each day based on how their job ended (exit type) and what
// feels most urgent (need), and the result is saved as their own tasks.
//
// How a day is filled:
// - Every day has 3 tasks for everyone (exitTypes and needs both ["all"]).
//   They're listed most important first.
// - Tailored tasks for that day come first, then the general ones, up to
//   MAX_TASKS_PER_DAY. So a day always has 3 or 4 tasks.
// - Keep tailored tasks to at most one per exit type and one per need on any
//   given day, so they don't crowd out the general ones.
//
// Exit types and needs must match frontend/src/profileOptions.ts. Categories
// must match the check in supabase/migrations/20261108010000_thirty_day_plan.sql.
// Keys and titles must be unique. `npm run check:plan` checks all
// of this.

export type ExitType = "laid_off" | "let_go" | "quit" | "complicated";
export type Need = "money" | "next_job" | "mental_health" | "figuring_out";
export type Category = "steady" | "rebuild" | "crew";
export type Energy = "low" | "medium" | "high";

export type TemplateTask = {
  key: string;
  week: 1 | 2 | 3 | 4;
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  category: Category;
  energy: Energy;
  title: string;
  exitTypes: (ExitType | "all")[];
  needs: (Need | "all")[];
  link?: string;
};

// A task as it's sent to create_plan().
export type PlannedTask = {
  key: string;
  week: number;
  day: number;
  position: number;
  category: Category;
  energy: Energy;
  title: string;
  link_url: string | null;
};

export const PLAN_WEEKS = [
  {
    week: 1,
    theme: "Land",
    description:
      "Take care of urgent admin, tell the people who matter, rest, and set a basic routine.",
  },
  {
    week: 2,
    theme: "Reflect",
    description:
      "Look at what you liked and didn't about your old job, your strengths, and what you want next.",
  },
  {
    week: 3,
    theme: "Rebuild",
    description:
      "Close skill gaps, update your resume and LinkedIn, and practise telling your story.",
  },
  {
    week: 4,
    theme: "Relaunch",
    description:
      "Send targeted applications, have networking conversations, and practise interviewing.",
  },
] as const;

export const PLAN_WEEK_COUNT = PLAN_WEEKS.length;
export const DAYS_PER_WEEK = 7;
export const PLAN_LENGTH_DAYS = PLAN_WEEK_COUNT * DAYS_PER_WEEK;
export const MAX_TASKS_PER_DAY = 4;

export const CATEGORY_LABELS: Record<Category, string> = {
  steady: "Steady",
  rebuild: "Rebuild",
  crew: "Crew",
};

export const ENERGY_LABELS: Record<Energy, string> = {
  low: "Gentle",
  medium: "Some focus",
  high: "Bigger push",
};

const LINKS = {
  ei: "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit.html",
  jobBank: "https://www.jobbank.gc.ca",
  help211: "https://211.ca",
  crisis988: "https://988.ca",
};

const ALL: ["all"] = ["all"];

export const PLAN_TEMPLATE: TemplateTask[] = [
  // -------------------------------------------------------------------------
  // Week 1: Land
  // -------------------------------------------------------------------------

  // Day 1
  { key: "w1d1-facts", week: 1, day: 1, category: "rebuild", energy: "low",
    title: "Write down your last day, final pay date, and anything you signed",
    exitTypes: ALL, needs: ALL },
  { key: "w1d1-tell-one", week: 1, day: 1, category: "crew", energy: "low",
    title: "Tell one person you trust what happened",
    exitTypes: ALL, needs: ALL },
  { key: "w1d1-sleep", week: 1, day: 1, category: "steady", energy: "low",
    title: "Go to bed at your usual time tonight",
    exitTypes: ALL, needs: ALL },
  { key: "money-final-pay", week: 1, day: 1, category: "rebuild", energy: "low",
    title: "Check what your final pay should include, like vacation pay and overtime",
    exitTypes: ALL, needs: ["money"] },
  { key: "mental-988", week: 1, day: 1, category: "steady", energy: "low",
    title: "Save 9-8-8 in your phone, just in case",
    exitTypes: ALL, needs: ["mental_health"], link: LINKS.crisis988 },
  { key: "complicated-what-happened", week: 1, day: 1, category: "steady", energy: "low",
    title: "Write down what happened in a few sentences, just for you",
    exitTypes: ["complicated"], needs: ALL },

  // Day 2
  { key: "w1d2-admin-list", week: 1, day: 2, category: "rebuild", energy: "medium",
    title: "List every account, bill and benefit that was tied to your job",
    exitTypes: ALL, needs: ALL },
  { key: "w1d2-walk", week: 1, day: 2, category: "steady", energy: "low",
    title: "Take a 20-minute walk",
    exitTypes: ALL, needs: ALL },
  { key: "w1d2-meal", week: 1, day: 2, category: "steady", energy: "low",
    title: "Eat one proper meal away from a screen",
    exitTypes: ALL, needs: ALL },
  { key: "money-subscriptions", week: 1, day: 2, category: "rebuild", energy: "low",
    title: "Pause any subscriptions you don't need right now",
    exitTypes: ALL, needs: ["money"] },
  { key: "mental-feelings", week: 1, day: 2, category: "steady", energy: "low",
    title: "Write down how you're feeling, without trying to fix it",
    exitTypes: ALL, needs: ["mental_health"] },
  { key: "laid-off-severance", week: 1, day: 2, category: "rebuild", energy: "medium",
    title: "Read your severance offer carefully before signing anything",
    exitTypes: ["laid_off"], needs: ALL },
  { key: "let-go-notes", week: 1, day: 2, category: "rebuild", energy: "low",
    title: "Write down what you were told while it's still fresh",
    exitTypes: ["let_go"], needs: ALL },
  { key: "burnout", week: 1, day: 2, category: "steady", energy: "low",
    title: "Schedule a full rest day, guilt-free",
    exitTypes: ["quit"], needs: ALL },

  // Day 3
  { key: "w1d3-ei", week: 1, day: 3, category: "rebuild", energy: "medium",
    title: "Apply for Employment Insurance (EI), or check whether you qualify",
    exitTypes: ALL, needs: ALL, link: LINKS.ei },
  { key: "w1d3-wake", week: 1, day: 3, category: "steady", energy: "low",
    title: "Pick a wake-up time and keep it for the rest of the week",
    exitTypes: ALL, needs: ALL },
  { key: "w1d3-reply", week: 1, day: 3, category: "crew", energy: "low",
    title: "Reply to one message you've been putting off",
    exitTypes: ALL, needs: ALL },
  { key: "job-alerts", week: 1, day: 3, category: "rebuild", energy: "low",
    title: "Set up job alerts for two job titles you'd want",
    exitTypes: ALL, needs: ["next_job"], link: LINKS.jobBank },
  { key: "laid-off-hr-questions", week: 1, day: 3, category: "rebuild", energy: "low",
    title: "Ask HR what happens to your pension, stock or RRSP matching",
    exitTypes: ["laid_off"], needs: ALL },
  { key: "quit-ei-just-cause", week: 1, day: 3, category: "rebuild", energy: "low",
    title: "Read how EI works when you quit (look for \"just cause\")",
    exitTypes: ["quit"], needs: ALL, link: LINKS.ei },

  // Day 4
  { key: "w1d4-costs", week: 1, day: 4, category: "rebuild", energy: "medium",
    title: "Write down the costs you have to pay every month",
    exitTypes: ALL, needs: ALL },
  { key: "w1d4-hands", week: 1, day: 4, category: "steady", energy: "low",
    title: "Spend 30 minutes doing something with your hands: cook, fix, draw or garden",
    exitTypes: ALL, needs: ALL },
  { key: "w1d4-friend", week: 1, day: 4, category: "crew", energy: "low",
    title: "Text a friend about something that isn't work",
    exitTypes: ALL, needs: ALL },
  { key: "money-budget", week: 1, day: 4, category: "rebuild", energy: "medium",
    title: "Build a bare-bones monthly budget",
    exitTypes: ALL, needs: ["money"] },
  { key: "mental-breathing", week: 1, day: 4, category: "steady", energy: "low",
    title: "Try a 5-minute breathing exercise",
    exitTypes: ALL, needs: ["mental_health"] },
  { key: "let-go-rights", week: 1, day: 4, category: "rebuild", energy: "low",
    title: "If something felt unfair, look up your province's employment standards",
    exitTypes: ["let_go"], needs: ALL },
  { key: "complicated-legal-clinic", week: 1, day: 4, category: "rebuild", energy: "low",
    title: "If how it ended felt unfair, look up a free legal clinic near you",
    exitTypes: ["complicated"], needs: ALL },

  // Day 5
  { key: "w1d5-benefits", week: 1, day: 5, category: "rebuild", energy: "low",
    title: "Check when your health and dental benefits end",
    exitTypes: ALL, needs: ALL },
  { key: "w1d5-outside", week: 1, day: 5, category: "steady", energy: "low",
    title: "Get outside before noon",
    exitTypes: ALL, needs: ALL },
  { key: "w1d5-one-liner", week: 1, day: 5, category: "crew", energy: "medium",
    title: "Decide how you'll tell people what happened, in one sentence",
    exitTypes: ALL, needs: ALL },
  { key: "money-bank-call", week: 1, day: 5, category: "rebuild", energy: "medium",
    title: "If you need it, ask your bank about lower minimum payments",
    exitTypes: ALL, needs: ["money"] },
  { key: "figuring-no-big-decisions", week: 1, day: 5, category: "steady", energy: "low",
    title: "Give yourself permission not to decide anything big this week",
    exitTypes: ALL, needs: ["figuring_out"] },
  { key: "quit-why-i-left", week: 1, day: 5, category: "steady", energy: "low",
    title: "Write down why you left, so you can reread it on hard days",
    exitTypes: ["quit"], needs: ALL },

  // Day 6
  { key: "w1d6-routine", week: 1, day: 6, category: "steady", energy: "medium",
    title: "Plan a simple routine for next week: wake up, move, one task, rest",
    exitTypes: ALL, needs: ALL },
  { key: "w1d6-samples", week: 1, day: 6, category: "rebuild", energy: "medium",
    title: "Save copies of the work samples and reviews you're allowed to keep",
    exitTypes: ALL, needs: ALL },
  { key: "w1d6-move", week: 1, day: 6, category: "steady", energy: "low",
    title: "Move your body for 20 minutes, any way you like",
    exitTypes: ALL, needs: ALL },
  { key: "job-reference", week: 1, day: 6, category: "crew", energy: "medium",
    title: "Ask a former manager or colleague to be a reference while it's fresh",
    exitTypes: ALL, needs: ["next_job"] },
  { key: "mental-counselling", week: 1, day: 6, category: "steady", energy: "low",
    title: "Look up free or low-cost counselling near you",
    exitTypes: ALL, needs: ["mental_health"], link: LINKS.help211 },
  { key: "laid-off-not-a-verdict", week: 1, day: 6, category: "steady", energy: "low",
    title: "Remind yourself: a layoff is a business decision, not a verdict on you",
    exitTypes: ["laid_off"], needs: ALL },

  // Day 7
  { key: "w1d7-rest", week: 1, day: 7, category: "steady", energy: "low",
    title: "Take the whole day off from job stuff",
    exitTypes: ALL, needs: ALL },
  { key: "w1d7-got-through", week: 1, day: 7, category: "steady", energy: "low",
    title: "Write down three things you got through this week",
    exitTypes: ALL, needs: ALL },
  { key: "w1d7-connect", week: 1, day: 7, category: "crew", energy: "low",
    title: "Spend time with someone, in person or on a call",
    exitTypes: ALL, needs: ALL },
  { key: "let-go-feel-it", week: 1, day: 7, category: "steady", energy: "low",
    title: "Let yourself feel whatever you feel. Being let go stings.",
    exitTypes: ["let_go"], needs: ALL },

  // -------------------------------------------------------------------------
  // Week 2: Reflect
  // -------------------------------------------------------------------------

  // Day 1
  { key: "w2d1-liked", week: 2, day: 1, category: "steady", energy: "low",
    title: "List what you liked most about your last job",
    exitTypes: ALL, needs: ALL },
  { key: "w2d1-drained", week: 2, day: 1, category: "steady", energy: "low",
    title: "List what drained you about your last job",
    exitTypes: ALL, needs: ALL },
  { key: "w2d1-walk", week: 2, day: 1, category: "steady", energy: "low",
    title: "Go for a walk and notice three things around you",
    exitTypes: ALL, needs: ALL },
  { key: "mental-hardest-time", week: 2, day: 1, category: "steady", energy: "low",
    title: "Notice what time of day feels hardest, and plan something gentle for then",
    exitTypes: ALL, needs: ["mental_health"] },

  // Day 2
  { key: "w2d2-strengths", week: 2, day: 2, category: "steady", energy: "medium",
    title: "Write down five things you're good at, in or out of work",
    exitTypes: ALL, needs: ALL },
  { key: "w2d2-ask-colleague", week: 2, day: 2, category: "crew", energy: "medium",
    title: "Ask a former colleague what they think you're great at",
    exitTypes: ALL, needs: ALL },
  { key: "w2d2-wake", week: 2, day: 2, category: "steady", energy: "low",
    title: "Stick to your wake-up time today",
    exitTypes: ALL, needs: ALL },
  { key: "money-runway", week: 2, day: 2, category: "rebuild", energy: "medium",
    title: "Work out how many months your savings, severance and EI will cover",
    exitTypes: ALL, needs: ["money"] },
  { key: "figuring-curious-jobs", week: 2, day: 2, category: "steady", energy: "medium",
    title: "List jobs you've been curious about, however unlikely they seem",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 3
  { key: "w2d3-reflect", week: 2, day: 3, category: "steady", energy: "medium",
    title: "Write a private reflection on how the job ended. Nobody else will read it.",
    exitTypes: ALL, needs: ALL },
  { key: "w2d3-fun", week: 2, day: 3, category: "steady", energy: "low",
    title: "Do something just for fun for an hour",
    exitTypes: ALL, needs: ALL },
  { key: "w2d3-old-team", week: 2, day: 3, category: "crew", energy: "low",
    title: "Check in with one person from your old team",
    exitTypes: ALL, needs: ALL },
  { key: "job-target-roles", week: 2, day: 3, category: "rebuild", energy: "medium",
    title: "Write down five roles you'd be happy to land",
    exitTypes: ALL, needs: ["next_job"] },
  { key: "quit-toward", week: 2, day: 3, category: "steady", energy: "medium",
    title: "Ask yourself: am I moving away from something, or toward something?",
    exitTypes: ["quit"], needs: ALL },
  { key: "complicated-control", week: 2, day: 3, category: "steady", energy: "medium",
    title: "Sort what happened into what was in your control and what wasn't",
    exitTypes: ["complicated"], needs: ALL },

  // Day 4
  { key: "w2d4-ideal", week: 2, day: 4, category: "rebuild", energy: "medium",
    title: "Describe your ideal next role in three sentences",
    exitTypes: ALL, needs: ALL },
  { key: "w2d4-musts", week: 2, day: 4, category: "rebuild", energy: "medium",
    title: "Write your must-haves and deal-breakers for your next job",
    exitTypes: ALL, needs: ALL },
  { key: "w2d4-stretch", week: 2, day: 4, category: "steady", energy: "low",
    title: "Stretch or move for 15 minutes",
    exitTypes: ALL, needs: ALL },
  { key: "mental-limit-scrolling", week: 2, day: 4, category: "steady", energy: "low",
    title: "Keep job news and LinkedIn scrolling to 15 minutes today",
    exitTypes: ALL, needs: ["mental_health"] },
  { key: "figuring-values", week: 2, day: 4, category: "steady", energy: "low",
    title: "Take a free career or values quiz and note what surprises you",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 5
  { key: "w2d5-browse", week: 2, day: 5, category: "rebuild", energy: "low",
    title: "Read five job postings to learn, not to apply",
    exitTypes: ALL, needs: ALL, link: LINKS.jobBank },
  { key: "w2d5-skills", week: 2, day: 5, category: "rebuild", energy: "medium",
    title: "Note which skills keep showing up in those postings",
    exitTypes: ALL, needs: ALL },
  { key: "w2d5-cook", week: 2, day: 5, category: "steady", energy: "low",
    title: "Cook something you really enjoy",
    exitTypes: ALL, needs: ALL },
  { key: "money-211", week: 2, day: 5, category: "rebuild", energy: "low",
    title: "Look up local support you might qualify for through 211",
    exitTypes: ALL, needs: ["money"], link: LINKS.help211 },

  // Day 6
  { key: "w2d6-why-leave", week: 2, day: 6, category: "rebuild", energy: "medium",
    title: "Draft an honest answer to \"Why did you leave?\"",
    exitTypes: ALL, needs: ALL },
  { key: "w2d6-say-it", week: 2, day: 6, category: "rebuild", energy: "low",
    title: "Say your answer out loud once",
    exitTypes: ALL, needs: ALL },
  { key: "w2d6-outside", week: 2, day: 6, category: "steady", energy: "low",
    title: "Get outside for at least 30 minutes",
    exitTypes: ALL, needs: ALL },
  { key: "job-work-samples", week: 2, day: 6, category: "rebuild", energy: "medium",
    title: "Gather your best work samples into one folder",
    exitTypes: ALL, needs: ["next_job"] },
  { key: "laid-off-restructuring", week: 2, day: 6, category: "rebuild", energy: "low",
    title: "Practise saying \"My role was eliminated in a restructuring\"",
    exitTypes: ["laid_off"], needs: ALL },
  { key: "let-go-neutral-answer", week: 2, day: 6, category: "rebuild", energy: "medium",
    title: "Write a calm, one-line answer about why you left",
    exitTypes: ["let_go"], needs: ALL },
  { key: "quit-forward-answer", week: 2, day: 6, category: "rebuild", energy: "medium",
    title: "Make your answer about what you're moving toward, not what you left",
    exitTypes: ["quit"], needs: ALL },
  { key: "complicated-shape-story", week: 2, day: 6, category: "crew", energy: "medium",
    title: "Ask someone you trust to help you shape your story",
    exitTypes: ["complicated"], needs: ALL },

  // Day 7
  { key: "w2d7-rest", week: 2, day: 7, category: "steady", energy: "low",
    title: "Rest day. Do nothing productive, on purpose.",
    exitTypes: ALL, needs: ALL },
  { key: "w2d7-learned", week: 2, day: 7, category: "steady", energy: "low",
    title: "Write down one thing you learned about yourself this week",
    exitTypes: ALL, needs: ALL },
  { key: "w2d7-plans", week: 2, day: 7, category: "crew", energy: "low",
    title: "Make plans with someone for next week",
    exitTypes: ALL, needs: ALL },

  // -------------------------------------------------------------------------
  // Week 3: Rebuild
  // -------------------------------------------------------------------------

  // Day 1
  { key: "w3d1-resume", week: 3, day: 1, category: "rebuild", energy: "high",
    title: "Add your most recent role to your resume",
    exitTypes: ALL, needs: ALL },
  { key: "w3d1-skill-gap", week: 3, day: 1, category: "rebuild", energy: "medium",
    title: "Pick one skill gap to work on this week",
    exitTypes: ALL, needs: ALL },
  { key: "w3d1-walk", week: 3, day: 1, category: "steady", energy: "low",
    title: "Take a 20-minute walk before you start",
    exitTypes: ALL, needs: ALL },
  { key: "job-salary", week: 3, day: 1, category: "rebuild", energy: "low",
    title: "Look up typical pay for the role you're aiming for",
    exitTypes: ALL, needs: ["next_job"], link: LINKS.jobBank },

  // Day 2
  { key: "w3d2-linkedin", week: 3, day: 2, category: "rebuild", energy: "medium",
    title: "Rewrite your LinkedIn headline and About section",
    exitTypes: ALL, needs: ALL },
  { key: "w3d2-course", week: 3, day: 2, category: "rebuild", energy: "medium",
    title: "Spend 30 minutes on a free course or tutorial for your skill gap",
    exitTypes: ALL, needs: ALL },
  { key: "w3d2-open-to-work", week: 3, day: 2, category: "rebuild", energy: "low",
    title: "Turn on \"Open to work\" on LinkedIn, if you're comfortable with it",
    exitTypes: ALL, needs: ALL },
  { key: "money-side-income", week: 3, day: 2, category: "rebuild", energy: "medium",
    title: "Think about short-term or part-time work to ease the pressure",
    exitTypes: ALL, needs: ["money"] },
  { key: "figuring-chat", week: 3, day: 2, category: "crew", energy: "medium",
    title: "Talk to someone who works in a field you're curious about",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 3
  { key: "w3d3-numbers", week: 3, day: 3, category: "rebuild", energy: "medium",
    title: "Add two accomplishments with numbers to your resume",
    exitTypes: ALL, needs: ALL },
  { key: "w3d3-feedback", week: 3, day: 3, category: "crew", energy: "medium",
    title: "Ask someone to read your resume and give honest feedback",
    exitTypes: ALL, needs: ALL },
  { key: "w3d3-lunch", week: 3, day: 3, category: "steady", energy: "low",
    title: "Take a proper lunch break away from your screen",
    exitTypes: ALL, needs: ALL },
  { key: "mental-look-forward", week: 3, day: 3, category: "steady", energy: "low",
    title: "Book one thing to look forward to this week",
    exitTypes: ALL, needs: ["mental_health"] },
  { key: "let-go-references", week: 3, day: 3, category: "crew", energy: "medium",
    title: "Line up two references who can speak to your strengths",
    exitTypes: ["let_go"], needs: ALL },

  // Day 4
  { key: "w3d4-story", week: 3, day: 4, category: "rebuild", energy: "medium",
    title: "Practise telling your career story in two minutes",
    exitTypes: ALL, needs: ALL },
  { key: "w3d4-ten-people", week: 3, day: 4, category: "crew", energy: "medium",
    title: "Make a list of 10 people you could reach out to",
    exitTypes: ALL, needs: ALL },
  { key: "w3d4-exercise", week: 3, day: 4, category: "steady", energy: "low",
    title: "Do 20 minutes of exercise you like",
    exitTypes: ALL, needs: ALL },
  { key: "job-ask-intro", week: 3, day: 4, category: "crew", energy: "medium",
    title: "Ask one person to refer you or introduce you to someone",
    exitTypes: ALL, needs: ["next_job"] },
  { key: "figuring-experiment", week: 3, day: 4, category: "rebuild", energy: "medium",
    title: "Try a small experiment: a short course, a volunteer shift, or a side project",
    exitTypes: ALL, needs: ["figuring_out"] },
  { key: "laid-off-connect", week: 3, day: 4, category: "crew", energy: "low",
    title: "Connect on LinkedIn with others affected by the same layoff",
    exitTypes: ["laid_off"], needs: ALL },

  // Day 5
  { key: "w3d5-course", week: 3, day: 5, category: "rebuild", energy: "medium",
    title: "Spend another 30 minutes on your skill gap",
    exitTypes: ALL, needs: ALL },
  { key: "w3d5-cover", week: 3, day: 5, category: "rebuild", energy: "high",
    title: "Write a short cover letter you can adapt for each application",
    exitTypes: ALL, needs: ALL },
  { key: "w3d5-kind", week: 3, day: 5, category: "steady", energy: "low",
    title: "Do something kind for yourself today",
    exitTypes: ALL, needs: ALL },
  { key: "money-budget-review", week: 3, day: 5, category: "rebuild", energy: "low",
    title: "Look over your budget and adjust anything that isn't working",
    exitTypes: ALL, needs: ["money"] },

  // Day 6
  { key: "w3d6-companies", week: 3, day: 6, category: "rebuild", energy: "medium",
    title: "Make a list of 10 companies you'd like to work for",
    exitTypes: ALL, needs: ALL },
  { key: "w3d6-hello", week: 3, day: 6, category: "crew", energy: "medium",
    title: "Message two people from your list just to say hello",
    exitTypes: ALL, needs: ALL },
  { key: "w3d6-outdoors", week: 3, day: 6, category: "steady", energy: "low",
    title: "Spend an hour outdoors",
    exitTypes: ALL, needs: ALL },
  { key: "mental-talk", week: 3, day: 6, category: "crew", energy: "medium",
    title: "Tell someone you trust how you're really doing",
    exitTypes: ALL, needs: ["mental_health"] },
  { key: "figuring-three-paths", week: 3, day: 6, category: "rebuild", energy: "medium",
    title: "Write down three possible paths, and one next step for each",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 7
  { key: "w3d7-rest", week: 3, day: 7, category: "steady", energy: "low",
    title: "Take the day off. You've earned it.",
    exitTypes: ALL, needs: ALL },
  { key: "w3d7-review", week: 3, day: 7, category: "steady", energy: "low",
    title: "Look back at your week and note what worked",
    exitTypes: ALL, needs: ALL },
  { key: "w3d7-social", week: 3, day: 7, category: "crew", energy: "low",
    title: "Do something social, even something small",
    exitTypes: ALL, needs: ALL },

  // -------------------------------------------------------------------------
  // Week 4: Relaunch
  // -------------------------------------------------------------------------

  // Day 1
  { key: "w4d1-apply", week: 4, day: 1, category: "rebuild", energy: "high",
    title: "Apply to one role that genuinely excites you",
    exitTypes: ALL, needs: ALL },
  { key: "w4d1-track", week: 4, day: 1, category: "rebuild", energy: "low",
    title: "Add it to your job search on the Profile page",
    exitTypes: ALL, needs: ALL },
  { key: "w4d1-walk", week: 4, day: 1, category: "steady", energy: "low",
    title: "Go for a walk after you hit submit",
    exitTypes: ALL, needs: ALL },
  { key: "job-weekly-goal", week: 4, day: 1, category: "rebuild", energy: "low",
    title: "Set a weekly application goal you can actually keep",
    exitTypes: ALL, needs: ["next_job"] },

  // Day 2
  { key: "w4d2-coffee", week: 4, day: 2, category: "crew", energy: "medium",
    title: "Ask someone for a 20-minute coffee chat",
    exitTypes: ALL, needs: ALL },
  { key: "w4d2-tailor", week: 4, day: 2, category: "rebuild", energy: "medium",
    title: "Tailor your resume to one specific posting",
    exitTypes: ALL, needs: ALL },
  { key: "w4d2-routine", week: 4, day: 2, category: "steady", energy: "low",
    title: "Keep your morning routine going",
    exitTypes: ALL, needs: ALL },
  { key: "money-credit-counselling", week: 4, day: 2, category: "rebuild", energy: "medium",
    title: "If debt is worrying you, talk to a nonprofit credit counsellor",
    exitTypes: ALL, needs: ["money"], link: LINKS.help211 },
  { key: "figuring-pick-path", week: 4, day: 2, category: "rebuild", energy: "medium",
    title: "Pick the path you want to try first",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 3
  { key: "w4d3-interview", week: 4, day: 3, category: "rebuild", energy: "medium",
    title: "Practise answers to three common interview questions",
    exitTypes: ALL, needs: ALL },
  { key: "w4d3-apply", week: 4, day: 3, category: "rebuild", energy: "high",
    title: "Apply to two more roles",
    exitTypes: ALL, needs: ALL },
  { key: "w4d3-fun", week: 4, day: 3, category: "steady", energy: "low",
    title: "Do something fun that has nothing to do with work",
    exitTypes: ALL, needs: ALL },
  { key: "job-research-company", week: 4, day: 3, category: "rebuild", energy: "medium",
    title: "Research one company in depth before you talk to them",
    exitTypes: ALL, needs: ["next_job"] },

  // Day 4
  { key: "w4d4-follow-up", week: 4, day: 4, category: "crew", energy: "medium",
    title: "Follow up on an application or a conversation",
    exitTypes: ALL, needs: ALL },
  { key: "w4d4-questions", week: 4, day: 4, category: "rebuild", energy: "medium",
    title: "Write three questions you'd ask an interviewer",
    exitTypes: ALL, needs: ALL },
  { key: "w4d4-exercise", week: 4, day: 4, category: "steady", energy: "low",
    title: "Get 20 minutes of exercise",
    exitTypes: ALL, needs: ALL },
  { key: "mental-rejection-plan", week: 4, day: 4, category: "steady", energy: "medium",
    title: "Plan how you'll look after yourself if you get a rejection",
    exitTypes: ALL, needs: ["mental_health"] },

  // Day 5
  { key: "w4d5-mock", week: 4, day: 5, category: "crew", energy: "high",
    title: "Do a mock interview with a friend",
    exitTypes: ALL, needs: ALL },
  { key: "w4d5-apply", week: 4, day: 5, category: "rebuild", energy: "high",
    title: "Apply to one more role",
    exitTypes: ALL, needs: ALL },
  { key: "w4d5-celebrate", week: 4, day: 5, category: "steady", energy: "low",
    title: "Celebrate one win from this week, however small",
    exitTypes: ALL, needs: ALL },
  { key: "job-thank-you", week: 4, day: 5, category: "crew", energy: "low",
    title: "Send a thank-you note after any interview or chat",
    exitTypes: ALL, needs: ["next_job"] },
  { key: "figuring-training", week: 4, day: 5, category: "rebuild", energy: "medium",
    title: "Look up what training or certification your chosen path needs",
    exitTypes: ALL, needs: ["figuring_out"] },

  // Day 6
  { key: "w4d6-routine", week: 4, day: 6, category: "rebuild", energy: "medium",
    title: "Write a weekly job-search routine to keep going after this plan",
    exitTypes: ALL, needs: ALL },
  { key: "w4d6-thanks", week: 4, day: 6, category: "crew", energy: "low",
    title: "Thank someone who helped you this month",
    exitTypes: ALL, needs: ALL },
  { key: "w4d6-offline", week: 4, day: 6, category: "steady", energy: "low",
    title: "Spend an afternoon offline",
    exitTypes: ALL, needs: ALL },
  { key: "money-check-in", week: 4, day: 6, category: "rebuild", energy: "low",
    title: "Put a monthly money check-in on your calendar",
    exitTypes: ALL, needs: ["money"] },

  // Day 7
  { key: "w4d7-look-back", week: 4, day: 7, category: "steady", energy: "low",
    title: "Think about where you were four weeks ago",
    exitTypes: ALL, needs: ALL },
  { key: "w4d7-note", week: 4, day: 7, category: "steady", energy: "low",
    title: "Write a note to yourself for the weeks ahead",
    exitTypes: ALL, needs: ALL },
  { key: "w4d7-rest", week: 4, day: 7, category: "steady", energy: "low",
    title: "Rest. You made it through your first month.",
    exitTypes: ALL, needs: ALL },
];

function fits<T extends string>(allowed: (T | "all")[], value: string | null) {
  return allowed.includes("all") || (value !== null && allowed.includes(value as T));
}

// Tailored tasks go first: matched on both, then on one, then general.
function specificity(task: TemplateTask) {
  return (
    (task.exitTypes.includes("all") ? 0 : 1) + (task.needs.includes("all") ? 0 : 1)
  );
}

// Picks this person's tasks for every day of the plan.
export function buildPlan(
  exitType: string | null,
  need: string | null,
): PlannedTask[] {
  const plan: PlannedTask[] = [];

  for (let week = 1; week <= PLAN_WEEK_COUNT; week++) {
    for (let day = 1; day <= DAYS_PER_WEEK; day++) {
      const chosen = PLAN_TEMPLATE.filter(
        (task) =>
          task.week === week &&
          task.day === day &&
          fits(task.exitTypes, exitType) &&
          fits(task.needs, need),
      )
        // sort() is stable, so ties keep the template's order.
        .sort((a, b) => specificity(b) - specificity(a))
        .slice(0, MAX_TASKS_PER_DAY);

      chosen.forEach((task, position) =>
        plan.push({
          key: task.key,
          week,
          day,
          position,
          category: task.category,
          energy: task.energy,
          title: task.title,
          link_url: task.link ?? null,
        }),
      );
    }
  }

  return plan;
}
