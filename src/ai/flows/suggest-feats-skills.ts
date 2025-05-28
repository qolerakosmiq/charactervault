'use server';

/**
 * @fileOverview An AI agent that suggests relevant feats and skills for a D&D 3.5 character.
 *
 * - suggestFeatsSkills - A function that suggests feats and skills based on character class and level.
 * - SuggestFeatsSkillsInput - The input type for the suggestFeatsSkills function.
 * - SuggestFeatsSkillsOutput - The return type for the suggestFeatsSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFeatsSkillsInputSchema = z.object({
  characterClass: z.string().describe('The character\u2019s class (e.g., Fighter, Wizard).'),
  level: z.number().int().positive().describe('The character\u2019s level.'),
});
export type SuggestFeatsSkillsInput = z.infer<typeof SuggestFeatsSkillsInputSchema>;

const SuggestFeatsSkillsOutputSchema = z.object({
  suggestedFeats: z.array(
    z.object({
      name: z.string().describe('The name of the feat.'),
      description: z.string().describe('A brief description of the feat and its benefits.'),
    })
  ).describe('A list of suggested feats.'),
  suggestedSkills: z.array(
    z.object({
      name: z.string().describe('The name of the skill.'),
      description: z.string().describe('A brief description of the skill and its uses.'),
    })
  ).describe('A list of suggested skills.'),
});
export type SuggestFeatsSkillsOutput = z.infer<typeof SuggestFeatsSkillsOutputSchema>;

export async function suggestFeatsSkills(input: SuggestFeatsSkillsInput): Promise<SuggestFeatsSkillsOutput> {
  return suggestFeatsSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFeatsSkillsPrompt',
  input: {schema: SuggestFeatsSkillsInputSchema},
  output: {schema: SuggestFeatsSkillsOutputSchema},
  prompt: `You are an expert D&D 3.5 game master with extensive knowledge of feats and skills.

  Based on the character's class and level, suggest a list of relevant feats and skills that would be useful for the character.

  Class: {{{characterClass}}}
  Level: {{{level}}}

  Format your response as a JSON object with \"suggestedFeats\" and \"suggestedSkills\" keys. Each should be an array of objects with \"name\" and \"description\" fields.
  `,
});

const suggestFeatsSkillsFlow = ai.defineFlow(
  {
    name: 'suggestFeatsSkillsFlow',
    inputSchema: SuggestFeatsSkillsInputSchema,
    outputSchema: SuggestFeatsSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
