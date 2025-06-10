
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
    <div key="skill-synergies-block" className={cn((htmlContentBlock) && "mt-3")}>
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
    <div key="skill-calculation-block" className={cn(((htmlContentBlock && !synergyBlock) || synergyBlock) && "mt-3")}>
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

  const contentBlocksToRender = [htmlContentBlock, synergyBlock, calculationBlock].filter(Boolean);

  if (contentBlocksToRender.length === 0) {
    return null;
  }

  return (
    <>
      {contentBlocksToRender.map((block, index) => (
        <React.Fragment key={index}>
          {block}
          {index < contentBlocksToRender.length - 1 && (
            <Separator className="my-2" />
          )}
        </React.Fragment>
      ))}
    </>
  );
};
// SkillModifierBreakdownContentDisplay.displayName = 'SkillModifierBreakdownContentDisplayComponent';

