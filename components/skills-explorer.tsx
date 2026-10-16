"use client";

import { useState } from "react";
import { ALL_GROUPS, filterSkillGroups, type SkillGroup } from "@/lib/skills";

type Props = {
  groups: readonly SkillGroup[];
  // Tag code to full name, e.g. { AA: "American Airlines role" }. Omit to hide tags and legend.
  legend?: Readonly<Record<string, string>>;
};

// Server-rendered with every group visible; the filter only narrows the view.
export function SkillsExplorer({ groups, legend }: Props) {
  const [choice, setChoice] = useState(ALL_GROUPS);
  const shown = filterSkillGroups(groups, choice);
  const options = [ALL_GROUPS, ...groups.map((g) => g.name)];

  return (
    <div>
      <div className="skills-filters" role="group" aria-label="Filter skills by group">
        <ul className="chips">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="chip"
                aria-pressed={choice === option}
                onClick={() => setChoice(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {shown.map((group) => (
        <div key={group.name} className="skill-group">
          <h3>{group.name}</h3>
          <ul className="skill-list">
            {group.skills.map((skill) => (
              <li key={skill.name} className="skill">
                {skill.name}
                {legend
                  ? skill.usedIn?.map((tag) => (
                      <span key={tag} className="skill-tag" title={legend[tag] ?? tag}>
                        {tag}
                      </span>
                    ))
                  : null}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {legend ? (
        <p className="skills-legend">
          {[
            ...Object.entries(legend).map(([code, label]) => `${code}: ${label.replace(/\.$/, "")}.`),
            "Skills without a tag are listed but not tied to a specific role or project.",
          ].join(" ")}
        </p>
      ) : null}
    </div>
  );
}
