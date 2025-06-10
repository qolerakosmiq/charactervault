
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

  const badgeClass = "font-normal h-5 px-1.5 py-0.5 align-baseline whitespace-nowrap";

  const synergyBlock = (synergyInfoList && synergyInfoList.length > 0) ? (
    <div key="skill-synergies-block" className={cn((htmlContentBlock) && "mt-3")}>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSynergiesSectionTitle || "Synergies"}</h3>
      <ul className={cn("space-y-0.5 mt-2", calculationBlock ? "mb-3" : "")}> {/* Added mb-3 if calculationBlock follows */}
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
                    className={badgeClass}
                    style={{ fontSize: '0.875rem' }}
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
                      className: cn((child.props.className || ''), badgeClass, 'text-sm'), // Ensure text-sm for badges in synergy
                      style: { ...child.props.style, fontSize: '0.875rem' },
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
                style={{ marginTop: '0.05rem' }}
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

  const calculationBlock = skillModifierBreakdown ? (
    <div key="skill-calculation-block" className={cn(((htmlContentBlock && !synergyBlock) || synergyBlock) && "mt-3")}>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm mt-2">
        {skillModifierBreakdown.keyAbilityName && (
          <div className="flex justify-between">
            <span className="inline-flex items-baseline">
              {uiStrings.infoDialogKeyAbilityLabel || "Key Ability"}
              <Badge variant="outline" className="ml-1.5 text-sm font-normal px-1.5 py-0.5 whitespace-nowrap">
                {skillModifierBreakdown.keyAbilityName}
              </Badge>
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
            <span>{uiStrings.infoDialogCustomModifierLabel || "Misc Modifier"}</span>
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

  const contentBlocksToRender: React.ReactNode[] = [];
  if (htmlContentBlock) contentBlocksToRender.push(htmlContentBlock);
  if (synergyBlock) contentBlocksToRender.push(synergyBlock);
  if (calculationBlock) contentBlocksToRender.push(calculationBlock);


  if (contentBlocksToRender.length === 0) {
    return <p className="text-sm text-muted-foreground">{uiStrings.infoDialogNoSkillDescription || "No details available for this skill."}</p>;
  }

  return (
    <>
      {contentBlocksToRender.map((block, index) => (
        <React.Fragment key={`content-block-${index}`}>
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

