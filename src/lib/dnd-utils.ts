

import type { AbilityName, AbilityScores, CharacterClass, CharacterSize, Skill, DndClassOption, SavingThrowType } from '@/types/character';
import { SIZES, DND_CLASSES } from '@/types/character'; // Import SIZES to look up labels

export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getAbilityScoreByName(scores: AbilityScores, abilityName: AbilityName): number {
  return scores[abilityName];
}

export function getAbilityModifierByName(scores: AbilityScores, abilityName: AbilityName): number {
  const score = getAbilityScoreByName(scores, abilityName);
  return calculateAbilityModifier(score);
}

// BAB progression
export function getBab(classes: CharacterClass[]): number[] {
  if (classes.length === 0 || !classes[0]?.className) return [0];
  
  let totalBab = 0;
  // SRD multiclassing: BAB from different classes are added together.
  classes.forEach(charClass => {
    if (!charClass.className) return;
    const classDef = DND_CLASSES.find(cd => cd.value === charClass.className);
    if (!classDef) return;

    // Determine progression type (good, medium, poor)
    // This is a simplification. Real SRD defines BAB per class table.
    // For now: Fighter/Paladin/Ranger/Barbarian = good (level)
    // Cleric/Druid/Monk/Rogue/Bard = medium (level * 3/4)
    // Wizard/Sorcerer = poor (level * 1/2)
    const classNameLower = classDef.label.toLowerCase();
    let classBabContribution = 0;
    if (['fighter', 'paladin', 'ranger', 'barbarian'].includes(classNameLower)) {
      classBabContribution = charClass.level;
    } else if (['cleric', 'druid', 'monk', 'rogue', 'bard'].includes(classNameLower)) {
      classBabContribution = Math.floor(charClass.level * 0.75);
    } else { // wizard, sorcerer
      classBabContribution = Math.floor(charClass.level * 0.5);
    }
    totalBab += classBabContribution;
  });
  
  const attacks: number[] = [totalBab];
  let nextAttack = totalBab - 5;
  while (nextAttack >= 1) { // PHB Errata: Iterative attacks stop if BAB drops below +1
    attacks.push(nextAttack);
    nextAttack -= 5;
  }
  return attacks;
}

export function calculateClassSaveContribution(level: number, progression: 'good' | 'poor'): number {
  if (progression === 'good') {
    return 2 + Math.floor(level / 2);
  } else { // poor
    return Math.floor(level / 3);
  }
}

// Updated Base Saves to handle multiclassing per SRD
export function getBaseSaves(
  classes: CharacterClass[],
  allClassDefinitions: readonly DndClassOption[] // Pass DND_CLASSES here
): { fortitude: number; reflex: number; will: number } {
  const baseSavesResult = { fortitude: 0, reflex: 0, will: 0 };

  if (!classes || classes.length === 0) return baseSavesResult;

  for (const charClass of classes) {
    if (!charClass.className) continue;
    const classDef = allClassDefinitions.find(cd => cd.value === charClass.className);
    
    if (classDef && classDef.saves) {
      baseSavesResult.fortitude += calculateClassSaveContribution(charClass.level, classDef.saves.fortitude);
      baseSavesResult.reflex += calculateClassSaveContribution(charClass.level, classDef.saves.reflex);
      baseSavesResult.will += calculateClassSaveContribution(charClass.level, classDef.saves.will);
    } else if (classDef) {
      // Fallback for classes that might be missing the 'saves' object after JSON update
      // This is a very rough estimation and should be avoided by ensuring dnd-classes.json is complete
      const poorSave = Math.floor(charClass.level / 3);
      baseSavesResult.fortitude += poorSave;
      baseSavesResult.reflex += poorSave;
      baseSavesResult.will += poorSave;
    }
  }
  return baseSavesResult;
}


export function calculateAc(
  dexModifier: number,
  armorBonus: number,
  shieldBonus: number,
  sizeModifierAC: number,
  naturalArmor: number,
  deflectionBonus: number,
  dodgeBonus: number,
  acMiscModifier: number,
): number {
  return 10 + armorBonus + shieldBonus + dexModifier + sizeModifierAC + naturalArmor + deflectionBonus + dodgeBonus + acMiscModifier;
}

export function calculateInitiative(dexModifier: number, miscModifier: number): number {
  return dexModifier + miscModifier;
}

export function calculateGrapple(bab: number[], strModifier: number, sizeModifierGrapple: number): number {
  return (bab[0] || 0) + strModifier + sizeModifierGrapple;
}

export function getSizeModifierAC(sizeId: CharacterSize): number {
  const sizeObject = SIZES.find(s => s.value === sizeId);
  const sizeLabel = sizeObject ? sizeObject.label : sizeId; // Fallback to ID if label not found

  switch (sizeLabel) {
    case 'Colossal': return -8;
    case 'Gargantuan': return -4;
    case 'Huge': return -2;
    case 'Large': return -1;
    case 'Medium': return 0;
    case 'Small': return 1;
    case 'Tiny': return 2;
    case 'Diminutive': return 4;
    case 'Fine': return 8;
    default: return 0;
  }
}

export function getSizeModifierGrapple(sizeId: CharacterSize): number {
  const sizeObject = SIZES.find(s => s.value === sizeId);
  const sizeLabel = sizeObject ? sizeObject.label : sizeId; // Fallback to ID if label not found

  switch (sizeLabel) {
    case 'Colossal': return 16;
    case 'Gargantuan': return 12;
    case 'Huge': return 8;
    case 'Large': return 4;
    case 'Medium': return 0;
    case 'Small': return -4;
    case 'Tiny': return -8;
    case 'Diminutive': return -12;
    case 'Fine': return -16;
    default: return 0;
  }
}

export function calculateSkillTotal(skill: Skill, abilityScores: AbilityScores): number {
  const abilityMod = skill.keyAbility ? getAbilityModifierByName(abilityScores, skill.keyAbility) : 0;
  // Max ranks for class skill: level + 3. For cross-class: (level + 3) / 2.
  // This logic should be applied when setting ranks, not here. Here we just sum.
  return skill.ranks + abilityMod + skill.miscModifier;
}

export function getCharacterOverallLevel(classes: CharacterClass[]): number {
  return classes.reduce((sum, charClass) => sum + charClass.level, 0);
}

export const SAVING_THROW_ABILITIES: Record<SavingThrowType, AbilityName> = {
  fortitude: 'constitution',
  reflex: 'dexterity',
  will: 'wisdom',
};

    
