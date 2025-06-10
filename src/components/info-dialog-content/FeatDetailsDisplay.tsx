
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

  const labelStyle = "font-bold text-muted-foreground mr-1";

  let benefitContent = featDef.description || "";
  if (benefitContent.toLowerCase().startsWith("<b>benefit:</b>")) {
    benefitContent = benefitContent.substring("<b>Benefit:</b>".length).trimStart();
  } else if (benefitContent.toLowerCase().startsWith("benefit:")) {
     benefitContent = benefitContent.substring("Benefit:".length).trimStart();
  }


  return (
    <div className="space-y-1">
      {benefitContent && (
        <div className="text-sm">
          <span className={labelStyle}>{uiStrings.featBenefitLabel || "Benefit:"}</span>
          <span dangerouslySetInnerHTML={{ __html: benefitContent }} />
        </div>
      )}

      {prereqMessages.length > 0 && (
        <div className="text-sm">
          <span className={labelStyle}>{uiStrings.featPrerequisitesLabel || "Prerequisites:"}</span>
          {prereqMessages.map((msg, index) => (
            <React.Fragment key={index}>
              <span className={cn(!msg.isMet && "text-destructive")} dangerouslySetInnerHTML={{ __html: msg.text }} />
              {index < prereqMessages.length - 1 && ', '}
            </React.Fragment>
          ))}
        </div>
      )}

      {featDef.effectsText && (
        <div className="text-sm">
          <span className={labelStyle}>{(uiStrings.featEffectsLabel || "Effects:").replace(/<\/?b>/g, '')}</span>
          <span>{featDef.effectsText}</span>
        </div>
      )}
    </div>
  );
};
