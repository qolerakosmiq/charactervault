
import type {
  AbilityName,
  AbilityScores,
  CharacterClass,
  CharacterSize,
  DndClassOption,
  SavingThrowType,
  CharacterSizeObject,
} from '@/types/character';

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

// Renamed function
export function calculateCharacterTotalLevel(classes: CharacterClass[]): number {
  return classes.reduce((sum, currentClass) => sum + currentClass.level, 0) || 1;
}

export function getBab(
  classes: CharacterClass[],
  allClassDefinitions: readonly DndClassOption[]
): number[] {
  if (classes.length === 0 || !classes[0]?.className) return [0];

  let totalBab = 0;
  classes.forEach(charClass => {
    if (!charClass.className) return;
    const classDef = allClassDefinitions.find(cd => cd.value === charClass.className);
    if (!classDef) return;

    const classNameLower = classDef.label.toLowerCase();
    let classBabContribution = 0;
    if (['barbarian', 'fighter', 'paladin', 'ranger', 'soulknife'].some(name => classNameLower.includes(name))) {
      classBabContribution = charClass.level;
    } else if (['bard', 'cleric', 'druid', 'monk', 'rogue'].some(name => classNameLower.includes(name))) {
      classBabContribution = Math.floor(charClass.level * 0.75);
    } else {
      classBabContribution = Math.floor(charClass.level * 0.5);
    }
    totalBab += classBabContribution;
  });

  const attacks: number[] = [totalBab];
  let nextAttack = totalBab - 5;
  while (nextAttack >= 1) {
    attacks.push(nextAttack);
    nextAttack -= 5;
  }
  return attacks;
}

export function calculateClassSaveContribution(level: number, progression: 'good' | 'poor'): number {
  if (progression === 'good') {
    return 2 + Math.floor(level / 2);
  } else {
    return Math.floor(level / 3);
  }
}

export function getBaseSaves(
  classes: CharacterClass[],
  allClassDefinitions: readonly DndClassOption[]
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

export function calculateGrapple(
  classes: CharacterClass[],
  strModifier: number,
  sizeModifierGrapple: number,
  allClassDefinitions: readonly DndClassOption[]
): number {
  const babArray = getBab(classes, allClassDefinitions);
  return (babArray[0] || 0) + strModifier + sizeModifierGrapple;
}

export function getSizeModifierAC(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  const sizeObject = SIZES_DATA.find(s => s.value === sizeId);
  return sizeObject ? sizeObject.acModifier : 0;
}

export function getSizeModifierGrapple(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  const sizeObject = SIZES_DATA.find(s => s.value === sizeId);
  if (!sizeObject) return 0;
  switch (sizeObject.value) {
    case 'fine': return -16;
    case 'diminutive': return -12;
    case 'tiny': return -8;
    case 'small': return -4;
    case 'medium': return 0;
    case 'large': return 4;
    case 'huge': return 8;
    case 'gargantuan': return 12;
    case 'colossal': return 16;
    default: return 0;
  }
}

export function getUnarmedGrappleDamage(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): string {
  if (!sizeId) {
    const mediumSize = SIZES_DATA.find(s => s.value === 'medium');
    return mediumSize?.grappleDamage || '1d3';
  }
  const sizeObject = SIZES_DATA.find(s => s.value === sizeId);
  return sizeObject?.grappleDamage || '0';
}

export const SAVING_THROW_ABILITIES: Record<SavingThrowType, AbilityName> = {
  fortitude: 'constitution',
  reflex: 'dexterity',
  will: 'wisdom',
};
