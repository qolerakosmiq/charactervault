
'use client';

import React from 'react';
import type { SkillModifierBreakdownDetails, SynergyInfoItem, AggregatedFeatEffectBase, SkillEffectDetail } from '@/components/InfoDisplayDialog'; // Added AggregatedFeatEffectBase, SkillEffectDetail
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillModifierBreakdownContentDisplayProps {
  htmlContent?: string;
  synergyInfoList?: SynergyInfoItem[];
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
  allSkillEffectDetails?: Array<SkillEffectDetail & AggregatedFeatEffectBase>; // Added
  uiStrings: Record<string, string>;
}

export const SkillModifierBreakdownContentDisplay = ({
  htmlContent,
  synergyInfoList,
  skillModifierBreakdown,
  allSkillEffectDetails, // Added
  uiStrings,
}: SkillModifierBreakdownContentDisplayProps) => {
  const htmlContentBlock = (htmlContent && htmlContent.trim() !== '' && htmlContent.trim() !== '<p></p>') ? (
    <div
      key="skill-html-content-block"
      className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  ) : null;

  const badgeClass = "align-baseline whitespace-nowrap";

  const hasCalculationBlock = !!skillModifierBreakdown;

  const activeFeatSkillEffects = allSkillEffectDetails?.filter(eff => eff.isActive && eff.skillId === skillModifierBreakdown?.skillName && typeof eff.value === 'number' && eff.value !== 0) || [];

  const synergyBlock = (synergyInfoList && synergyInfoList.length > 0) ? (
    <div key="skill-synergies-block" className={cn((htmlContentBlock) && "mt-3")}>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSynergiesSectionTitle || "Synergies"}</h3>
      <ul className={cn("space-y-0.5 mt-2", hasCalculationBlock ? "mb-3" : "")}>
        {synergyInfoList.map((synergyItem) => {
          const IconComponent = synergyItem.isActive ? CheckSquare : Square;
          const parts = typeof synergyItem.text === 'string' ? synergyItem.text.split(/({value}|{typeLabel})/g) : [];
          let textNode: React.ReactNode = synergyItem.text;

          if (typeof synergyItem.text === 'string' && parts.length > 1) {
            textNode = parts.map((part, index) => {
              if (part === "{value}" || part === "{typeLabel}") {
                const match = synergyItem.text?.toString().match(/\b\d+\b|\+\d+|\-\d+/g);
                return (
                  <Badge
                    key={`badge-${index}`}
                    variant="outline"
                    className={cn(badgeClass)}
                  >
                    {match ? match[0] : part}
                  </Badge>
                );
              }
              return part;
            });
          } else if (React.isValidElement(synergyItem.text)) {
            const styleBadgesInChildren = (children: React.ReactNode): React.ReactNode => {
              return React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  if (child.type === Badge) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                      className: cn((child.props.className || ''), badgeClass),
                    });
                  }
                  if (child.props.children) {
                    return React.cloneElement(child, {
                      children: styleBadgesInChildren(child.props.children),
                    });
                  }
                }
                return child;
              });
            };
            textNode = styleBadgesInChildren(synergyItem.text);
          }

          return (
            <li key={synergyItem.id} className="flex">
              <IconComponent
                className={cn("h-5 w-5 mr-2 shrink-0", synergyItem.isActive ? "text-emerald-500" : "text-muted-foreground")}
                style={{ marginTop: '0.1rem' }}
              />
              <span className={cn("text-sm", synergyItem.isActive ? "text-emerald-600" : "text-muted-foreground")}>
                {textNode}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  const calculationBlock = hasCalculationBlock ? (
    <div key="skill-calculation-block" className={cn(((htmlContentBlock && !synergyBlock) || synergyBlock) && "mt-3")}>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 mt-2">
        {skillModifierBreakdown!.keyAbilityName && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground inline-flex items-baseline">
              {uiStrings.infoDialogKeyAbilityLabel || "Key Ability"}
              <Badge variant="outline" className="ml-1.5">
                {skillModifierBreakdown!.keyAbilityName}
              </Badge>
            </span>
            {renderModifierValue(skillModifierBreakdown!.keyAbilityModifier)}
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogRanksLabel || "Ranks"}</span>
          {renderModifierValue(skillModifierBreakdown!.ranks)}
        </div>
        {skillModifierBreakdown!.sizeSpecificBonus !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.infoDialogSizeModifierLabel || "Size Modifier"}</span>
            {renderModifierValue(skillModifierBreakdown!.sizeSpecificBonus)}
          </div>
        )}
        {skillModifierBreakdown!.synergyBonus !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.infoDialogSynergyBonusLabel || "Synergy Bonus"}</span>
            {renderModifierValue(skillModifierBreakdown!.synergyBonus)}
          </div>
        )}

        {activeFeatSkillEffects.length > 0 && (
            <>
                <h4 className="text-sm font-bold text-muted-foreground pb-0.5">
                    {uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}
                </h4>
                {activeFeatSkillEffects.map((eff, idx) => (
                    <div key={`feat-skill-bonus-${idx}`} className="flex justify-between items-baseline text-sm ml-3">
                        <span className="text-foreground flex-shrink-0 mr-2">
                            {eff.sourceFeat || (uiStrings.infoDialogFeatBonusLabel || "Feat Bonus")}
                        </span>
                        {renderModifierValue(eff.value)}
                    </div>
                ))}
            </>
        )}

        {skillModifierBreakdown!.racialBonus !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.infoDialogRacialBonusLabel || "Racial Bonus"}</span>
            {renderModifierValue(skillModifierBreakdown!.racialBonus)}
          </div>
        )}
        {skillModifierBreakdown!.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.infoDialogCustomModifierLabel || "Misc Modifier"}</span>
            {renderModifierValue(skillModifierBreakdown!.miscModifier)}
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogTotalBonusLabel || "Total Bonus"}</span>
          <span className="font-bold text-accent">{renderModifierValue(skillModifierBreakdown!.totalBonus)}</span>
        </div>
      </div>
    </div>
  ) : null;

  const contentBlocksToRender: React.ReactNode[] = [];
  if (htmlContentBlock) contentBlocksToRender.push(htmlContentBlock);
  if (synergyBlock) contentBlocksToRender.push(synergyBlock);
  if (calculationBlock) contentBlocksToRender.push(calculationBlock);

  if (contentBlocksToRender.length === 0) {
    return <p className="text-sm text-muted-foreground">{uiStrings.infoDialogNoSkillDescription || "No details available for this skill."}</p>;
  }

  return (
    <>
      {contentBlocksToRender.map((block, index, arr) => (
        <React.Fragment key={`content-block-${index}`}>
          {block}
          {index < arr.length - 1 && (block || arr[index+1]) && (
            <Separator className="my-2" />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

