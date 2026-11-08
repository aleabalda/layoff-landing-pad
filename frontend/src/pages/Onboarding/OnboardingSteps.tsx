import {
  LinkInputs,
  ResumePicker,
} from "../../components/ResumeAndLinksFields";
import TagPicker, { toggleInList } from "../../components/TagPicker";
import {
  EXPERIENCE_LEVELS,
  FIELDS,
  INITIAL_FEELINGS,
  JOB_END_REASONS,
  URGENT_NEEDS,
} from "../../profileOptions";
import { formatBytes, type LinkKind, type Links } from "../../resume";
import { ChoiceGroup, StepHeading, TextField } from "./OnboardingFields";
import type { Answers, SetAnswer } from "./useOnboardingForm";

type StepProps = {
  answers: Answers;
  set: SetAnswer;
};

export function AboutYouStep({ answers, set }: StepProps) {
  return (
    <>
      <StepHeading
        title="Welcome. Let's get you set up."
        subtitle="A few questions so we can build your plan and find people going through the same thing. Takes about two minutes."
      />
      <TextField
        id="display-name"
        label="What should we call you?"
        value={answers.displayName}
        onChange={(value) => set("displayName", value)}
        autoComplete="given-name"
        required
      />
      <TextField
        id="city"
        label="Where are you based? (optional)"
        hint="So we can point you to local resources."
        value={answers.city}
        onChange={(value) => set("city", value)}
        autoComplete="address-level2"
        placeholder="e.g. Calgary"
      />
    </>
  );
}

export function WhatHappenedStep({ answers, set }: StepProps) {
  return (
    <>
      <StepHeading
        title="What happened?"
        subtitle="There's no wrong answer. This only shapes your plan."
      />
      <ChoiceGroup
        legend="How did your last job end?"
        options={JOB_END_REASONS}
        value={answers.jobEndReason}
        onChange={(value) => set("jobEndReason", value)}
      />
      <ChoiceGroup
        legend="How are you feeling about it?"
        options={INITIAL_FEELINGS}
        value={answers.initialFeeling}
        onChange={(value) => set("initialFeeling", value)}
        columns={3}
      />
      <ChoiceGroup
        legend="What feels most urgent right now?"
        options={URGENT_NEEDS}
        value={answers.urgentNeed}
        onChange={(value) => set("urgentNeed", value)}
      />
    </>
  );
}

export function YourWorkStep({ answers, set }: StepProps) {
  return (
    <>
      <StepHeading
        title="Your work"
        subtitle="We'll put you in a crew with people from the same field."
      />
      <ChoiceGroup
        legend="Which field were you working in?"
        options={FIELDS}
        value={answers.field}
        onChange={(value) => set("field", value)}
      />
      <ChoiceGroup
        legend="How much experience do you have?"
        options={EXPERIENCE_LEVELS}
        value={answers.experienceLevel}
        onChange={(value) => set("experienceLevel", value)}
      />
    </>
  );
}

export function TagsStep({ answers, set }: StepProps) {
  return (
    <>
      <StepHeading
        title="Pick anything that fits"
        subtitle="We use these to match you with people in a similar spot. Choose as many as you like, or skip this."
      />
      <TagPicker
        selected={answers.tags}
        onToggle={(tag) => set("tags", toggleInList(answers.tags, tag))}
      />
    </>
  );
}

export function ResumeStep({
  resume,
  onResumeChange,
  links,
  linkErrors,
  onLinkChange,
}: {
  resume: File | null;
  onResumeChange: (file: File | null) => void;
  links: Links;
  linkErrors: Partial<Links>;
  onLinkChange: (kind: LinkKind, value: string) => void;
}) {
  return (
    <>
      <StepHeading
        title="Your resume and links"
        subtitle="Add whatever you have handy. It all stays private to you, and you can skip this."
      />

      <div className="mt-6">
        <ResumePicker
          fileName={resume?.name ?? null}
          fileDetail={resume ? formatBytes(resume.size) : undefined}
          onChoose={onResumeChange}
          onClear={() => onResumeChange(null)}
        />
      </div>
      <LinkInputs links={links} errors={linkErrors} onChange={onLinkChange} />
    </>
  );
}
