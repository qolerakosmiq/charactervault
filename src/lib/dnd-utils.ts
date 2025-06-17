
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

export function calculateAbilityModifier(score: number | undefined): number { 
  if (typeof score !== 'number' || isNaN(score)) { 
    return 0; 
  }
  return Math.floor((score - 10) / 2);
}

export function getAbilityScoreByName(scores: AbilityScores, abilityName: AbilityName): number {
  return scores[abilityName];
}

export function getAbilityModifierByName(scores: AbilityScores, abilityName: AbilityName): number {
  const score = getAbilityScoreByName(scores, abilityName);
  return calculateAbilityModifier(score);
}

export function calculateSumOfClassLevels(classes: CharacterClass[]): number {
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
    const classDef = allClassDefinitions.find(cd => cd.id === charClass.className); // Changed value to id
    if (!classDef || !classDef.babProgression) { 
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
    const classDef = allClassDefinitions.find(cd => cd.id === charClass.className); // Changed value to id

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
  const sizeObject = SIZES_DATA.find(s => s.id === sizeId); // Changed value to id
  return sizeObject ? sizeObject.acModifier : 0;
}

export function getSizeModifierAttack(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  const sizeObject = SIZES_DATA.find(s => s.id === sizeId); // Changed value to id
  return sizeObject ? sizeObject.acModifier : 0;
}


export function getSizeModifierGrapple(
  sizeId: CharacterSize | '',
  SIZES_DATA: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  const sizeObject = SIZES_DATA.find(s => s.id === sizeId); // Changed value to id
  if (!sizeObject) return 0;
  switch (sizeObject.id) { // Changed value to id
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
    const mediumSize = SIZES_DATA.find(s => s.id === 'medium'); // Changed value to id
    return mediumSize?.grappleDamage || '1d3';
  }
  const sizeObject = SIZES_DATA.find(s => s.id === sizeId); // Changed value to id
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
  const level20Entry = xpTable.find(entry => entry.level === 20);
  if (level > 20 && level20Entry && epicLevelXpIncrease > 0) {
    return level20Entry.xpRequired + (level - 20) * epicLevelXpIncrease;
  }
  return Infinity;
}

export function calculateLevelFromXp(xp: number, xpTable: readonly XpDataEntry[], epicLevelXpIncrease: number): number {
  if (xp < 0) return 1; 

  for (let i = xpTable.length - 1; i >= 0; i--) {
    const entry = xpTable[i];
    if (xp >= entry.xpRequired) {
      const maxStandardLevelEntry = xpTable[xpTable.length - 1]; 
      if (entry.level === maxStandardLevelEntry.level && epicLevelXpIncrease > 0 && xp >= entry.xpRequired) {
          const xpIntoEpic = xp - entry.xpRequired;
          const epicLevelsGained = Math.floor(xpIntoEpic / epicLevelXpIncrease);
          return entry.level + epicLevelsGained;
      }
      return entry.level;
    }
  }
  return 1;
}

interface ParseAndRollResult {
  result: number;
  debugLogs: string[];
}

export function parseAndRollDice(diceString: string): ParseAndRollResult {
  const debugLogs: string[] = [];
  debugLogs.push(`parseAndRollDice received: "${diceString}" (type: ${typeof diceString})`);

  if (!diceString || typeof diceString !== 'string') {
    debugLogs.push("Input is not a valid string. Returning 0.");
    return { result: 0, debugLogs };
  }

  const cleanedString = diceString.trim();
  debugLogs.push(`Cleaned string: "${cleanedString}"`);

  // Regex to find a static modifier at the end (+X or -Y)
  const modifierRegex = /([+-])\s*(\d+)$/;
  let staticModifier = 0;
  let dicePart = cleanedString;

  const modifierMatch = cleanedString.match(modifierRegex);
  if (modifierMatch) {
    const sign = modifierMatch[1];
    const value = parseInt(modifierMatch[2], 10);
    staticModifier = (sign === '+') ? value : -value;
    dicePart = cleanedString.substring(0, modifierMatch.index).trim(); // Remove modifier part
    debugLogs.push(`Modifier found: ${sign}${value} -> staticModifier: ${staticModifier}`);
    debugLogs.push(`Remaining dicePart: "${dicePart}"`);
  } else {
    debugLogs.push("No static modifier found at the end.");
  }

  // Regex to parse the XdY dice notation
  const diceNotationRegex = /^(\d*)d(\d+)$/i; // Case insensitive for 'd'
  const diceMatch = dicePart.match(diceNotationRegex);

  let totalRoll = 0;

  if (diceMatch) {
    const numDice = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
    const numSides = parseInt(diceMatch[2], 10);
    debugLogs.push(`Dice notation parsed: numDice=${numDice}, numSides=${numSides}`);

    if (numDice > 0 && numSides > 0) {
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * numSides) + 1;
        debugLogs.push(`Roll ${i + 1}/${numDice} (d${numSides}): ${roll}`);
        totalRoll += roll;
      }
      debugLogs.push(`Total from dice: ${totalRoll}`);
    } else {
      debugLogs.push("Invalid dice numbers or sides. Dice roll part is 0.");
    }
  } else if (dicePart && !isNaN(Number(dicePart))) {
    // If no "d" is found, try to parse the dicePart as a plain number (e.g. "3")
    totalRoll = parseInt(dicePart, 10);
    debugLogs.push(`No dice notation ('d') found. Parsed "${dicePart}" as static value: ${totalRoll}`);
  } else if (dicePart) {
    debugLogs.push(`Could not parse dicePart "${dicePart}" as dice or number. Dice roll part is 0.`);
  } else if (!dicePart && modifierMatch) {
    // Only a modifier was present, e.g. "+2"
    debugLogs.push("Only a static modifier was present, no dice part.");
    totalRoll = 0; // Dice part is 0
  } else {
     debugLogs.push(`Could not parse input "${cleanedString}" as dice or number. Returning 0 for dice part.`);
  }

  const finalResult = totalRoll + staticModifier;
  debugLogs.push(`Final Result: totalRoll=${totalRoll} + staticModifier=${staticModifier} = ${finalResult}`);
  return { result: finalResult, debugLogs };
}

