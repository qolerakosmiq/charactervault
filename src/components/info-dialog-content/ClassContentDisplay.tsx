
'use client';

import React from 'react';
import type {
  Character,
  AbilityName,
  FeatDefinitionJsonData,
  SkillDefinitionJsonData,
  DndClassOption,
  DndRaceOption,
  ClassAttribute
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { ExpandableDetailWrapper, sectionHeadingClass } from './dialog-utils';
import { FeatDetailsDisplay } from './FeatDetailsDisplay';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ClassContentDisplayProps {
  htmlContent?: string; // This will become generalDescription
  loreAttributes?: ClassAttribute[]; // Added
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  detailsList?: Array<{ label: string; value: string | number; isBold?: boolean }>; // For Hit Dice, Saves
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

export const ClassContentDisplay = ({
  htmlContent, // Will now be classData.generalDescription
  loreAttributes, // New prop
  grantedFeats,
  detailsList, // For Hit Dice, Saves
  translations,
  allCombinedFeatDefinitions,
  customSkillDefinitions,
  character,
  expandedItems,
  toggleExpanded,
}: ClassContentDisplayProps) => {
  const { UI_STRINGS, ABILITY_LABELS, DND_CLASSES, DND_RACES, ALIGNMENT_PREREQUISITE_OPTIONS, SKILL_DEFINITIONS } = translations;
  const outputBlocks: React.ReactNode[] = [];

  if (htmlContent) {
    outputBlocks.push(
      <div
        key="class-general-description-block"
        className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  if (loreAttributes && loreAttributes.length > 0) {
     if (outputBlocks.length > 0) {
      outputBlocks.push(<Separator key="sep-after-general-desc" className="my-3" />);
    }
    outputBlocks.push(
      <div key="class-lore-attributes-section" className="space-y-2">
        {loreAttributes.map((attr, index) => (
          <div key={`lore-attr-${index}`}>
            <h4 className="text-sm font-medium text-muted-foreground mt-2 mb-0.5">{attr.key}</h4>
            <p className="text-sm text-foreground">{attr.value}</p>
          </div>
        ))}
      </div>
    );
  }


  const classSpecificsAndFeatsExist = (detailsList && detailsList.length > 0) || (grantedFeats && grantedFeats.length > 0);

  if (classSpecificsAndFeatsExist && outputBlocks.length > 0) {
    // Add separator if there was general description or lore attributes before class specifics/feats
    outputBlocks.push(<Separator key="sep-before-specifics-feats" className="my-3" />);
  }


  if (detailsList && detailsList.length > 0) {
    outputBlocks.push(
      <div key="class-details-list-section">
        <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogClassSpecificsListHeading || "Class Specifics"}</h3>
        <div className="mt-2" key="details-list-content">
          <div className="space-y-0.5 text-sm mb-2">
            {detailsList.map((detail, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-foreground">{detail.label}</span>
                <span className={cn("text-sm font-semibold text-foreground", detail.isBold && "font-bold")}>{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (grantedFeats && grantedFeats.length > 0) {
    if (detailsList && detailsList.length > 0) {
         outputBlocks.push(<Separator key="sep-between-specifics-feats" className="my-3" />);
    }
    outputBlocks.push(
      <div key="class-granted-feats-section">
        <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogGrantedFeaturesAndFeats || "Granted Features & Feats"}</h3>
        <ul className="list-none space-y-0.5 text-sm mt-2" key="granted-feats-list">
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
                        "text-sm font-normal h-5 whitespace-nowrap shrink-0 justify-center",
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
        // This mapping is to avoid double separators if some blocks are empty.
        // A separator is added before a block if the block is not the first one AND the previous block was also rendered.
        <React.Fragment key={`class-display-root-block-${index}`}>
          {/* Separator logic is now handled by pushing Separator components directly into outputBlocks */}
          {block}
        </React.Fragment>
      ))}</div> : null;
};
