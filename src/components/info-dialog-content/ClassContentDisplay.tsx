
'use client';

import React from 'react';
import type {
  Character,
  AbilityName,
  FeatDefinitionJsonData,
  SkillDefinitionJsonData,
  DndClassOption,
  DndRaceOption,
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { ExpandableDetailWrapper, sectionHeadingClass } from './dialog-utils';
import { FeatDetailsDisplay } from './FeatDetailsDisplay';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ClassContentDisplayProps {
  htmlContent?: string;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  detailsList?: Array<{ label: string; value: string | number; isBold?: boolean }>;
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

export const ClassContentDisplay: React.FC<ClassContentDisplayProps> = ({
  htmlContent,
  grantedFeats,
  detailsList,
  translations,
  allCombinedFeatDefinitions,
  customSkillDefinitions,
  character,
  expandedItems,
  toggleExpanded,
}) => {
  const { UI_STRINGS, ABILITY_LABELS, DND_CLASSES, DND_RACES, ALIGNMENT_PREREQUISITE_OPTIONS, SKILL_DEFINITIONS } = translations;
  const hasAnyBonusSection = grantedFeats?.length || detailsList?.length;

  let hasRenderedContentBlock = false;
  const renderSeparatorIfNeeded = () => {
    if (hasRenderedContentBlock) {
      return <div className="mt-2 mb-2"><Separator /></div>;
    }
    return null;
  };
  const markContentRendered = () => { hasRenderedContentBlock = true; };

  return (
    <>
      {htmlContent && (
        <>
          {renderSeparatorIfNeeded()}
          <div
            className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {markContentRendered()}
        </>
      )}

      {hasAnyBonusSection && (
        <>
          {renderSeparatorIfNeeded()}
          <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogClassSpecificsListHeading || "Class Specifics"}</h3>
          {markContentRendered()}
        </>
      )}

      {detailsList && detailsList.length > 0 && (
        <div className="mt-2">
          <div className="space-y-0.5 text-sm mb-2">
            {detailsList.map((detail, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-foreground">{detail.label}</span>
                <span className={detail.isBold ? "font-bold text-foreground" : "text-foreground"}>{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {grantedFeats && grantedFeats.length > 0 && (
         <div className="mt-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogGrantedFeaturesAndFeats}</h4>
          <ul className="list-none space-y-0.5 text-sm">
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
                        <Badge variant="outline" className="text-xs font-normal h-5 whitespace-nowrap">
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
      )}
    </>
  );
};
