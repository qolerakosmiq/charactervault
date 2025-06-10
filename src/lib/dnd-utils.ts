
import type {
  AbilityName,
  AbilityScores,
  CharacterClass,
  CharacterSize,
  DndClassOption,
  SavingThrowType,
  CharacterSizeObject,
} from '@/types/character';
import type { XpDataEntry } from '@/i18n/i18n-data';

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

// Renamed function to be specific about summing class levels
export function calculateSumOfClassLevels(classes: CharacterClass[]): number {
  return classes.reduce((sum, currentClass) => sum + currentClass.level, 0) || 1;
}

export function getBab(
  classes: CharacterClass[],
  allClassDefinitions: readonly DndClassOption[] // Now takes class definitions as an argument
): number[] {
  if (classes.length === 0 || !classes[0]?.className) return [0];

  let totalBab = 0;
  classes.forEach(charClass => {
    if (!charClass.className) return;
    const classDef = allClassDefinitions.find(cd => cd.value === charClass.className);
    if (!classDef || !classDef.babProgression) { // Check for babProgression
      // Fallback or error if babProgression is missing
      // For now, let's assume poor progression if undefined
      totalBab += Math.floor(charClass.level * 0.5);
      return;
    }

    let classBabContribution = 0;
    switch (classDef.babProgression) {
      case 'good':
        classBabContribution = charClass.level;
        break;
      case 'average':
        classBabContribution = Math.floor(charClass.level * 0.75);
        break;
      case 'poor':
        classBabContribution = Math.floor(charClass.level * 0.5);
        break;
      default:
        classBabContribution = Math.floor(charClass.level * 0.5); // Fallback to poor
    }
    totalBab += classBabContribution;
  });

  const attacks: number[] = [totalBab];
  let nextAttack = totalBab - 5;
  while (nextAttack >= 1) { // PHB p.22, "Multiple Attacks" - only attacks with BAB +1 or higher.
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
      // Fallback if saves not defined, treat as poor for all
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

export function getSizeModifierAttack(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  // Per PHB p.135 Table 8-1, the "Size Modifier" applies to Attack Rolls and AC.
  // So this function returns the same value as getSizeModifierAC.
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

export function getXpRequiredForLevel(level: number, xpTable: readonly XpDataEntry[], epicLevelXpIncrease: number): number {
  if (level <= 1) return 0;
  const standardEntry = xpTable.find(entry => entry.level === level);
  if (standardEntry) {
    return standardEntry.xpRequired;
  }
  // Handle epic levels (assuming level > 20, as SRD table goes to 20)
  const level20Entry = xpTable.find(entry => entry.level === 20);
  if (level > 20 && level20Entry && epicLevelXpIncrease > 0) {
    return level20Entry.xpRequired + (level - 20) * epicLevelXpIncrease;
  }
  // For levels beyond the table that are not epic (e.g., next level if current is max table level but not epic yet)
  // or if epicLevelXpIncrease is 0, effectively it's max level
  return Infinity;
}

export function calculateLevelFromXp(xp: number, xpTable: readonly XpDataEntry[], epicLevelXpIncrease: number): number {
  if (xp < 0) return 1; // XP cannot be negative

  // Iterate backwards from highest defined level in the table
  for (let i = xpTable.length - 1; i >= 0; i--) {
    const entry = xpTable[i];
    if (xp >= entry.xpRequired) {
      // Found the highest level bracket the character falls into from the table
      // Now check for epic levels if this is the max table level (e.g. 20)
      const maxStandardLevelEntry = xpTable[xpTable.length - 1]; // Assumes table is sorted by level
      if (entry.level === maxStandardLevelEntry.level && epicLevelXpIncrease > 0 && xp >= entry.xpRequired) {
          const xpIntoEpic = xp - entry.xpRequired;
          const epicLevelsGained = Math.floor(xpIntoEpic / epicLevelXpIncrease);
          return entry.level + epicLevelsGained;
      }
      return entry.level;
    }
  }
  // If XP is less than the requirement for the lowest level > 1 in the table,
  // it implies level 1 (assuming level 1 requires 0 XP, which is standard)
  return 1;
}

