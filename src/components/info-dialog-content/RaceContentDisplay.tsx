
'use client';

import React from 'react';
import type {
  Character,
  AbilityName,
  FeatDefinitionJsonData,
  SkillDefinitionJsonData,
  DndClassOption,
  DndRaceOption,
  SpeedType,
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { renderModifierValue, ExpandableDetailWrapper, sectionHeadingClass } from './dialog-utils';
import { FeatDetailsDisplay } from './FeatDetailsDisplay';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RaceContentDisplayProps {
  htmlContent?: string;
  abilityModifiers?: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
  skillBonuses?: Array<{ skillId: string; skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
  speeds?: Partial<Record<SpeedType, number>>;
  translations: {
    UI_STRINGS: Record<string, string>;
    ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
    DND_CLASSES: readonly DndClassOption[];
    DND_RACES: readonly DndRaceOption[];
    ALIGNMENT_PREREQUISITE_OPTIONS: readonly { value: string; label: string }[];
    SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[];
  };
  allCombinedFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  customSkillDefinitions: readonly CustomSkillDefinition[];
  character: Character;
  expandedItems: Set<string>;
  toggleExpanded: (itemId: string) => void;
}

export const RaceContentDisplay = ({
  htmlContent,
  abilityModifiers,
  skillBonuses,
  grantedFeats,
  bonusFeatSlots,
  speeds,
  translations,
  allCombinedFeatDefinitions,
  customSkillDefinitions,
  character,
  expandedItems,
  toggleExpanded,
}: RaceContentDisplayProps) => {
  const { UI_STRINGS, ABILITY_LABELS, DND_CLASSES, DND_RACES, ALIGNMENT_PREREQUISITE_OPTIONS, SKILL_DEFINITIONS } = translations;
  const speedUnit = UI_STRINGS.speedUnit || "ft.";
  const outputBlocks: React.ReactNode[] = [];

  if (htmlContent) {
    outputBlocks.push(
      <div
        key="race-html-content-block"
        className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  const generalTraitsSubSections: React.ReactNode[] = [];
  if (abilityModifiers && abilityModifiers.length > 0) {
    generalTraitsSubSections.push(
      <div className="mt-2" key="ability-modifiers-section">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogAbilityScoreAdjustments || "Ability Score Adjustments"}</h4>
        <div className="space-y-0.5 text-sm mb-2 ml-4">
          {abilityModifiers.map(mod => (
            <div key={mod.ability} className="flex justify-between">
              <span className="text-sm text-foreground">{ABILITY_LABELS.find(al => al.value === mod.ability)?.label || mod.ability}</span>
              <span className="text-sm font-semibold">{renderModifierValue(mod.change)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (skillBonuses && skillBonuses.length > 0) {
    generalTraitsSubSections.push(
      <div className="mt-2" key="skill-bonuses-section">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogRacialSkillBonuses || "Racial Skill Bonuses"}</h4>
        <div className="space-y-0.5 text-sm mb-2 ml-4">
          {skillBonuses.map(bonus => (
            <div key={bonus.skillId} className="flex justify-between">
              <span className="text-sm text-foreground">{bonus.skillName}</span>
              <span className="text-sm font-semibold">{renderModifierValue(bonus.bonus)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (speeds && Object.keys(speeds).filter(k => (speeds as any)[k] !== undefined && (speeds as any)[k] > 0).length > 0) {
    generalTraitsSubSections.push(
       <div className="mt-2" key="base-speeds-section">
        <h4 className="text-sm text-muted-foreground font-medium mb-1">{UI_STRINGS.infoDialogBaseSpeeds || "Base Speeds"}</h4>
         <div className="space-y-0.5 text-sm mb-2 ml-4">
          {Object.entries(speeds).filter(([, speedVal]) => speedVal !== undefined && speedVal > 0)
            .map(([type, speedVal]) => {
            const speedTypeKey = `speedLabel${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof UI_STRINGS;
            const speedName = UI_STRINGS[speedTypeKey] || type;
            return (
              <div key={type} className="flex justify-between">
                <span className="text-sm text-foreground">{speedName}</span>
                <span className="text-sm font-semibold text-foreground">{speedVal} {speedUnit}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (bonusFeatSlots !== undefined && bonusFeatSlots > 0) {
    generalTraitsSubSections.push(
      <div key="bonus-feat-slots-item" className="flex justify-between text-sm mt-2">
        <span className="text-sm text-foreground">{UI_STRINGS.infoDialogBonusFeatSlots || "Bonus Feat Slots"}</span>
        <span className="text-sm font-semibold text-foreground">{renderModifierValue(bonusFeatSlots)}</span>
      </div>
    );
  }

  if (generalTraitsSubSections.length > 0) {
    outputBlocks.push(
      <div key="race-general-traits-section">
        <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogGeneralTraitsHeading || "General Traits"}</h3>
        {generalTraitsSubSections}
      </div>
    );
  }
  
  if (grantedFeats && grantedFeats.length > 0) {
    outputBlocks.push(
      <div key="race-granted-feats-section">
        <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogGrantedFeaturesAndFeats || "Granted Features & Feats"}</h3>
        <ul className="list-none space-y-0.5 text-sm mt-2" key="race-granted-feats-list">
          {grantedFeats.map(feat => {
            const uniqueKey = feat.featId + (feat.note || '') + (feat.levelAcquired || '');
            return (
               <li key={uniqueKey} className="group">
                  <div
                    className="flex items-baseline gap-2 p-1 -mx-1 rounded transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(uniqueKey)}
                    role="button"
                    aria-expanded={expandedItems.has(uniqueKey)}
                    aria-controls={`feat-details-${uniqueKey}`}
                  >
                    {feat.levelAcquired !== undefined && (
                      <Badge variant="outline" className={cn(
                        "whitespace-nowrap shrink-0 justify-center",
                        "min-w-[5rem]"
                      )}>
                        {(UI_STRINGS.levelLabel || "Level")} {feat.levelAcquired}
                      </Badge>
                    )}
                     <div className="flex-grow">
                        <strong className="text-foreground leading-tight transition-colors">{feat.name}</strong>
                        {feat.note && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {feat.note}
                          </p>
                        )}
                     </div>
                  </div>
                  {expandedItems.has(uniqueKey) && (
                   <div id={`feat-details-${uniqueKey}`} className="my-1 mb-1">
                      <ExpandableDetailWrapper>
                        <FeatDetailsDisplay
                            featId={feat.featId}
                            character={character}
                            allFeats={allCombinedFeatDefinitions}
                            allPredefinedSkills={SKILL_DEFINITIONS}
                            allCustomSkills={customSkillDefinitions}
                            allClasses={DND_CLASSES}
                            allRaces={DND_RACES}
                            abilityLabels={ABILITY_LABELS}
                            alignmentPrereqOptions={ALIGNMENT_PREREQUISITE_OPTIONS}
                            uiStrings={UI_STRINGS}
                        />
                      </ExpandableDetailWrapper>
                   </div>
                  )}
                </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return outputBlocks.length > 0 ? <div className="space-y-3">{outputBlocks.map((block, index, arr) => (
        <React.Fragment key={`race-display-block-${index}`}>
          {block}
          {index < arr.length - 1 && <Separator className="my-3" />}
        </React.Fragment>
      ))}</div> : null;
};
