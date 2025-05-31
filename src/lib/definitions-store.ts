
'use client';

import type { FeatDefinitionJsonData, CustomSynergyRule, AbilityName } from '@/types/character';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Represents the template/definition of a custom skill
export interface CustomSkillDefinition {
  id: string; // Unique ID for the skill definition (e.g., UUID)
  name: string;
  keyAbility: AbilityName;
  description?: string;
  providesSynergies?: CustomSynergyRule[]; // Synergies this skill *provides*
}

interface DefinitionsStoreState {
  customFeatDefinitions: (FeatDefinitionJsonData & { isCustom: true })[];
  customSkillDefinitions: CustomSkillDefinition[];
  actions: {
    addCustomFeatDefinition: (featDef: FeatDefinitionJsonData & { isCustom: true }) => void;
    updateCustomFeatDefinition: (featDef: FeatDefinitionJsonData & { isCustom: true }) => void;
    // deleteCustomFeatDefinition: (featDefId: string) => void; // Future
    getCustomFeatDefinitionById: (featDefId: string) => (FeatDefinitionJsonData & { isCustom: true }) | undefined;

    addCustomSkillDefinition: (skillDef: CustomSkillDefinition) => void;
    updateCustomSkillDefinition: (skillDef: CustomSkillDefinition) => void;
    // deleteCustomSkillDefinition: (skillDefId: string) => void; // Future
    getCustomSkillDefinitionById: (skillDefId: string) => CustomSkillDefinition | undefined;
  };
}

const DEFINITIONS_STORAGE_KEY = 'dnd35_global_definitions_adventurers_armory';

export const useDefinitionsStore = create<DefinitionsStoreState>()(
  persist(
    (set, get) => ({
      customFeatDefinitions: [],
      customSkillDefinitions: [],
      actions: {
        addCustomFeatDefinition: (featDef) =>
          set((state) => ({
            customFeatDefinitions: [...state.customFeatDefinitions, featDef].sort((a, b) => a.label.localeCompare(b.label)),
          })),
        updateCustomFeatDefinition: (updatedFeatDef) =>
          set((state) => ({
            customFeatDefinitions: state.customFeatDefinitions.map((def) =>
              def.value === updatedFeatDef.value ? updatedFeatDef : def
            ).sort((a, b) => a.label.localeCompare(b.label)),
          })),
        getCustomFeatDefinitionById: (featDefId) => {
          return get().customFeatDefinitions.find(def => def.value === featDefId);
        },
        addCustomSkillDefinition: (skillDef) =>
          set((state) => ({
            customSkillDefinitions: [...state.customSkillDefinitions, skillDef].sort((a,b) => a.name.localeCompare(b.name)),
          })),
        updateCustomSkillDefinition: (updatedSkillDef) =>
          set((state) => ({
            customSkillDefinitions: state.customSkillDefinitions.map((def) =>
              def.id === updatedSkillDef.id ? updatedSkillDef : def
            ).sort((a,b) => a.name.localeCompare(b.name)),
          })),
        getCustomSkillDefinitionById: (skillDefId) => {
          return get().customSkillDefinitions.find(def => def.id === skillDefId);
        },
      },
    }),
    {
      name: DEFINITIONS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customFeatDefinitions: state.customFeatDefinitions,
        customSkillDefinitions: state.customSkillDefinitions,
      }), // Only persist definitions, not actions
    }
  )
);
