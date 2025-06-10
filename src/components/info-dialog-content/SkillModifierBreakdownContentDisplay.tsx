
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
  const outputBlocks: React.ReactNode[] = [];

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

  const finalRenderBlocks: React.ReactNode[] = [];
  if (htmlContentBlock) {
    finalRenderBlocks.push(htmlContentBlock);
  }

  if (synergyBlock) {
    if (finalRenderBlocks.length > 0) { // If description was present, add separator before synergies
      finalRenderBlocks.push(<Separator className="my-3" key="sep-before-synergy" />);
    }
    finalRenderBlocks.push(synergyBlock);
  }

  if (calculationBlock) {
    // Add separator before calculation ONLY if synergy block was NOT present AND description (or any previous block) was.
    // If synergy block WAS present, we do NOT add a separator here, grouping synergy and calculation.
    if (!synergyBlock && finalRenderBlocks.length > 0) {
      finalRenderBlocks.push(<Separator className="my-3" key="sep-before-calc-no-synergy" />);
    } else if (synergyBlock && finalRenderBlocks.length > 0) {
      // This line ensures if Synergy block was present, it IS separated from calculation.
      // To group them (remove separator), this line should be commented out or made conditional.
      // Based on user wanting fewer separators around synergy, this implies
      // if synergy is there, it should be grouped with calculation, removing this specific separator.
      // The image shows: Desc --- Syn --- Calc.
      // If user means "don't insert 2 separators" as in, remove one of these two,
      // removing the one between Syn and Calc is a common visual grouping.
      // Let's keep the separator if synergy block was present to match current behavior but ensure only one.
       finalRenderBlocks.push(<Separator className="my-3" key="sep-before-calc-with-synergy" />);
    }
    finalRenderBlocks.push(calculationBlock);
  }
  
  if (finalRenderBlocks.length === 0) return null;

  // This mapping adds separators *between* the items in finalRenderBlocks.
  // The logic above explicitly pushes separators *into* finalRenderBlocks.
  // We need to choose one method. Let's use the explicit pushing.

  // The bug might be if finalRenderBlocks contains separators, and then this map adds more.
  // Let's reconstruct finalRenderBlocks to only contain content, and add separators in the map.

  const contentOnlyBlocks = [htmlContentBlock, synergyBlock, calculationBlock].filter(Boolean);
  if (contentOnlyBlocks.length === 0) return null;

  return contentOnlyBlocks.map((block, index) => (
    <React.Fragment key={(block as React.ReactElement)?.key || `content-block-${index}`}>
      {block}
      {/* Add separator after this block if it's not the last one */}
      {/* AND if the current block is description AND next is synergy */}
      {/* OR if current block is synergy AND next is calculation */}
      {/* This ensures a single separator between the main sections. */}
      {index < contentOnlyBlocks.length - 1 && (
        <Separator className="my-3" />
      )}
    </React.Fragment>
  ));
};
// SkillModifierBreakdownContentDisplay.displayName = 'SkillModifierBreakdownContentDisplayComponent';

