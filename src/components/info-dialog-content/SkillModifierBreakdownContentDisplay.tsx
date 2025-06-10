
'use client';

import React from 'react';
import type { SkillModifierBreakdownDetails, SynergyInfoItem } from '@/components/InfoDisplayDialog';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillModifierBreakdownContentDisplayProps {
  htmlContent?: string;
  synergyInfoList?: SynergyInfoItem[];
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const SkillModifierBreakdownContentDisplay = ({
  htmlContent,
  synergyInfoList,
  skillModifierBreakdown,
  uiStrings,
}: SkillModifierBreakdownContentDisplayProps) => {
  const htmlContentBlock = (htmlContent && htmlContent.trim() !== '' && htmlContent.trim() !== '<p></p>') ? (
    <div
      key="skill-html-content-block"
      className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  ) : null;

  const synergyBlock = (synergyInfoList && synergyInfoList.length > 0) ? (
    <div key="skill-synergies-block">
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSynergiesSectionTitle || "Synergies"}</h3>
      <ul className="space-y-0.5 mt-2">
        {synergyInfoList.map((synergyItem) => {
          const IconComponent = synergyItem.isActive ? CheckSquare : Square;
          return (
            <li key={synergyItem.id} className="flex items-start text-sm">
              <IconComponent className={cn("h-4 w-4 mr-2 shrink-0 mt-1", synergyItem.isActive ? "text-emerald-500" : "text-muted-foreground")} />
              <span className={cn(synergyItem.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                {synergyItem.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  const calculationBlock = skillModifierBreakdown ? (
    <div key="skill-calculation-block">
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm mt-2">
        {skillModifierBreakdown.keyAbilityName && (
          <div className="flex justify-between">
            <span>
              {uiStrings.infoDialogKeyAbilityLabel || "Key Ability"}
              <span className="text-muted-foreground ml-1">({skillModifierBreakdown.keyAbilityName})</span>
            </span>
            {renderModifierValue(skillModifierBreakdown.keyAbilityModifier)}
          </div>
        )}
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogRanksLabel || "Ranks"}</span>
          {renderModifierValue(skillModifierBreakdown.ranks)}
        </div>
        {skillModifierBreakdown.sizeSpecificBonus !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.infoDialogSizeModifierLabel || "Size Modifier"}</span>
            {renderModifierValue(skillModifierBreakdown.sizeSpecificBonus)}
          </div>
        )}
        {skillModifierBreakdown.synergyBonus !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.infoDialogSynergyBonusLabel || "Synergy Bonus"}</span>
            {renderModifierValue(skillModifierBreakdown.synergyBonus)}
          </div>
        )}
        {skillModifierBreakdown.featBonus !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
            {renderModifierValue(skillModifierBreakdown.featBonus)}
          </div>
        )}
        {skillModifierBreakdown.racialBonus !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.infoDialogRacialBonusLabel || "Racial Bonus"}</span>
            {renderModifierValue(skillModifierBreakdown.racialBonus)}
          </div>
        )}
        {skillModifierBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.infoDialogMiscModifierLabel || "Misc Modifier"}</span>
            {renderModifierValue(skillModifierBreakdown.miscModifier)}
          </div>
        )}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogTotalBonusLabel || "Total Bonus"}</span>
          <span className="font-bold text-accent">{renderModifierValue(skillModifierBreakdown.totalBonus)}</span>
        </div>
      </div>
    </div>
  ) : null;

  const contentBlocks = [
    htmlContentBlock && { type: 'html', content: htmlContentBlock },
    synergyBlock && { type: 'synergy', content: synergyBlock },
    calculationBlock && { type: 'calculation', content: calculationBlock },
  ].filter(Boolean) as Array<{ type: string; content: React.ReactNode }>;

  if (contentBlocks.length === 0) return null;

  return (
    <>
      {contentBlocks.map((item, index) => (
        <React.Fragment key={item.type}>
          {item.content}
          {index < contentBlocks.length - 1 && (
            (() => {
              const currentBlockType = item.type;
              const nextBlockType = contentBlocks[index + 1].type;

              // Add separator between HTML and Calculation IFF Synergy is NOT present
              if (currentBlockType === 'html' && nextBlockType === 'calculation' && !synergyBlock) {
                return <Separator className="my-3" />;
              }
              // Add separator between Synergy and Calculation IFF HTML was NOT present
              if (currentBlockType === 'synergy' && nextBlockType === 'calculation' && !htmlContentBlock) {
                return <Separator className="my-3" />;
              }
              // Add separator between HTML and Synergy IFF Calculation is NOT present (and synergy is last)
              if (currentBlockType === 'html' && nextBlockType === 'synergy' && !calculationBlock) {
                 return <Separator className="my-3" />;
              }
              
              return null;
            })()
          )}
        </React.Fragment>
      ))}
    </>
  );
};
// SkillModifierBreakdownContentDisplay.displayName = 'SkillModifierBreakdownContentDisplayComponent';

