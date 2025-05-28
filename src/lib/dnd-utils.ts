import type { AbilityName, AbilityScores, CharacterClass, CharacterSize, Skill } from '@/types/character';

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

// Simplified BAB progression (replace with actual class tables)
// Returns an array for iterative attacks, e.g. [10, 5] for BAB +10/+5
export function getBab(classes: CharacterClass[]): number[] {
  if (classes.length === 0) return [0];
  // For simplicity, sum levels and use a generic progression.
  // A real implementation needs to handle multiclassing rules correctly.
  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
  const mainClass = classes[0]?.className.toLowerCase() || '';

  // Very simplified: Fighter (good), Rogue (medium), Wizard (poor)
  let baseBab = 0;
  if (mainClass.includes('fighter') || mainClass.includes('paladin') || mainClass.includes('ranger') || mainClass.includes('barbarian')) {
    baseBab = totalLevel; // Good BAB
  } else if (mainClass.includes('cleric') || mainClass.includes('druid') || mainClass.includes('monk') || mainClass.includes('rogue') || mainClass.includes('bard')) {
    baseBab = Math.floor(totalLevel * 0.75); // Medium BAB
  } else {
    baseBab = Math.floor(totalLevel * 0.5); // Poor BAB
  }
  
  const attacks: number[] = [baseBab];
  let nextAttack = baseBab - 5;
  while (nextAttack > 0) {
    attacks.push(nextAttack);
    nextAttack -= 5;
  }
  return attacks;
}

// Simplified Base Saves (replace with actual class tables)
export function getBaseSaves(classes: CharacterClass[]): { fortitude: number; reflex: number; will: number } {
   if (classes.length === 0) return { fortitude: 0, reflex: 0, will: 0 };
   // Simplified: sum levels and use generic save progression.
   const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
   const mainClass = classes[0]?.className.toLowerCase() || '';

   let goodSaveBase = Math.floor(2 + totalLevel / 2);
   let poorSaveBase = Math.floor(totalLevel / 3);

   if (mainClass.includes('fighter') || mainClass.includes('paladin') || mainClass.includes('barbarian')) { // Good Fort
    return { fortitude: goodSaveBase, reflex: poorSaveBase, will: poorSaveBase };
   } else if (mainClass.includes('rogue') || mainClass.includes('ranger') || mainClass.includes('bard')) { // Good Reflex
    return { fortitude: poorSaveBase, reflex: goodSaveBase, will: poorSaveBase };
   } else if (mainClass.includes('cleric') || mainClass.includes('druid') || mainClass.includes('wizard') || mainClass.includes('sorcerer')) { // Good Will
    return { fortitude: poorSaveBase, reflex: poorSaveBase, will: goodSaveBase };
   } else if (mainClass.includes('monk')) { // Good all
    return { fortitude: goodSaveBase, reflex: goodSaveBase, will: goodSaveBase };
   }
   return { fortitude: poorSaveBase, reflex: poorSaveBase, will: poorSaveBase }; // Default to poor
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

export function getSizeModifierAC(size: CharacterSize): number {
  switch (size) {
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

export function getSizeModifierGrapple(size: CharacterSize): number {
  switch (size) {
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
