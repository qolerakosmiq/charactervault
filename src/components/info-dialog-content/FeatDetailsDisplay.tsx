
'use client';

import React from 'react';
import type {
  Character,
  FeatDefinitionJsonData,
  SkillDefinitionJsonData,
  DndClassOption,
  DndRaceOption,
  AbilityName,
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { checkFeatPrerequisites } from '@/types/character';
import { cn } from '@/lib/utils';

interface FeatDetailsDisplayProps {
  featId: string;
  character: Character;
  allFeats: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  allPredefinedSkills: readonly SkillDefinitionJsonData[];
  allCustomSkills: readonly CustomSkillDefinition[];
  allClasses: readonly DndClassOption[];
  allRaces: readonly DndRaceOption[];
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  alignmentPrereqOptions: readonly { value: string; label: string }[];
  uiStrings: Record<string, string>;
}

export const FeatDetailsDisplay: React.FC<FeatDetailsDisplayProps> = ({
  featId,
  character,
  allFeats,
  allPredefinedSkills,
  allCustomSkills,
  allClasses,
  allRaces,
  abilityLabels,
  alignmentPrereqOptions,
  uiStrings,
}) => {
  const featDef = allFeats.find(f => f.value === featId);
  if (!featDef) {
    return <p className="text-sm text-muted-foreground">{uiStrings.infoDialogFeatNotFound || "Feat details not found."}</p>;
  }

  const prereqMessages = checkFeatPrerequisites(
    featDef,
    character,
    allFeats,
    allPredefinedSkills,
    allCustomSkills,
    allClasses,
    allRaces,
    abilityLabels,
    alignmentPrereqOptions,
    uiStrings
  );

  return (
    <>
      {featDef.description && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: featDef.description }}
        />
      )}
      {prereqMessages.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-muted-foreground">{uiStrings.featPrerequisitesLabel || "Prerequisites:"}</p>
          <ul className="list-disc list-inside text-sm">
            {prereqMessages.map((msg, index) => (
              <li key={index} className={cn(!msg.isMet && "text-destructive")}>
                <span dangerouslySetInnerHTML={{ __html: msg.text }}></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {featDef.effectsText && (
        <div className="mt-3">
          <p
            className="text-sm font-medium text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: uiStrings.featEffectsLabel || "<b>Effects:</b>" }}
          />
          <p className="text-sm">{featDef.effectsText}</p>
        </div>
      )}
    </>
  );
};

