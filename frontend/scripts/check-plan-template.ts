// Checks the 30-day plan template. Run with `npm run check:plan`.

import { JOB_END_REASONS, URGENT_NEEDS } from "../src/profileOptions.ts";
import {
  CATEGORY_LABELS,
  DAYS_PER_WEEK,
  ENERGY_LABELS,
  MAX_TASKS_PER_DAY,
  PLAN_TEMPLATE,
  PLAN_WEEK_COUNT,
  buildPlan,
} from "../src/plan/planTemplate.ts";

const MIN_TASKS_PER_DAY = 3;
const problems: string[] = [];

const exitTypes = JOB_END_REASONS.map((option) => option.value);
const needs = URGENT_NEEDS.map((option) => option.value);

function findDuplicates(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

for (const key of findDuplicates(PLAN_TEMPLATE.map((task) => task.key))) {
  problems.push(`Duplicate key: ${key}`);
}
for (const title of findDuplicates(PLAN_TEMPLATE.map((task) => task.title))) {
  problems.push(`Duplicate title: ${title}`);
}

for (const task of PLAN_TEMPLATE) {
  if (!(task.category in CATEGORY_LABELS)) {
    problems.push(`${task.key}: unknown category "${task.category}"`);
  }
  if (!(task.energy in ENERGY_LABELS)) {
    problems.push(`${task.key}: unknown energy "${task.energy}"`);
  }
  for (const value of task.exitTypes) {
    if (value !== "all" && !exitTypes.includes(value)) {
      problems.push(`${task.key}: unknown exit type "${value}"`);
    }
  }
  for (const value of task.needs) {
    if (value !== "all" && !needs.includes(value)) {
      problems.push(`${task.key}: unknown need "${value}"`);
    }
  }
}

// Each day needs enough general tasks to stand on its own.
for (let week = 1; week <= PLAN_WEEK_COUNT; week++) {
  for (let day = 1; day <= DAYS_PER_WEEK; day++) {
    const general = PLAN_TEMPLATE.filter(
      (task) =>
        task.week === week &&
        task.day === day &&
        task.exitTypes.includes("all") &&
        task.needs.includes("all"),
    );
    if (general.length < MIN_TASKS_PER_DAY) {
      problems.push(
        `Week ${week} day ${day}: only ${general.length} general tasks`,
      );
    }
  }
}

let shortest = Infinity;
let longest = 0;

for (const exitType of exitTypes) {
  for (const need of needs) {
    const plan = buildPlan(exitType, need);
    const tailored = plan.filter((task) => {
      const source = PLAN_TEMPLATE.find((t) => t.key === task.key)!;
      return !source.exitTypes.includes("all") || !source.needs.includes("all");
    });

    for (let week = 1; week <= PLAN_WEEK_COUNT; week++) {
      for (let day = 1; day <= DAYS_PER_WEEK; day++) {
        const count = plan.filter(
          (task) => task.week === week && task.day === day,
        ).length;
        if (count < MIN_TASKS_PER_DAY || count > MAX_TASKS_PER_DAY) {
          problems.push(
            `${exitType} + ${need}, week ${week} day ${day}: ${count} tasks`,
          );
        }
      }
    }

    // Every tailored task that matches should make it into the plan.
    const matching = PLAN_TEMPLATE.filter(
      (task) =>
        (task.exitTypes.includes(exitType) || task.needs.includes(need)) &&
        (task.exitTypes.includes("all") || task.exitTypes.includes(exitType)) &&
        (task.needs.includes("all") || task.needs.includes(need)),
    );
    for (const task of matching) {
      if (!tailored.some((t) => t.key === task.key)) {
        problems.push(`${exitType} + ${need}: tailored task ${task.key} was dropped`);
      }
    }

    shortest = Math.min(shortest, plan.length);
    longest = Math.max(longest, plan.length);
  }
}

if (problems.length) {
  console.error(`Plan template has ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Plan template OK: ${PLAN_TEMPLATE.length} template tasks, ` +
    `${exitTypes.length * needs.length} profiles, ${shortest}–${longest} tasks per plan.`,
);
