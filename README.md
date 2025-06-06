
# Character Vault

This is a NextJS starter project for Character Vault, built in Firebase Studio.

To get started, take a look at src/app/page.tsx.

This application allows users to create, manage, and edit Dungeons & Dragons 3.5 edition character sheets.
It features:
- Character creation and editing forms.
- Dynamic skill point calculation.
- Feat selection with prerequisite checking.
- Internationalization support (English and French).
- AI-powered suggestions for feats and skills.
- Customizable skill and feat definitions via a DM settings panel.

The tech stack includes:
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- ShadCN UI components
- Genkit for AI features
- Zustand for state management
- i18next for internationalization

## Getting Started

The main character dashboard is at `src/app/page.tsx`.
Character creation is handled by `src/app/character/new/page.tsx` and uses `src/components/CharacterFormCore.tsx`.
Existing characters are displayed and edited via `src/app/character/[id]/page.tsx`.

Global definitions for custom feats and skills, as well as DM-controlled settings like point-buy budget, are managed by `src/lib/definitions-store.ts`.
Internationalization data is loaded via `src/i18n/loadLocaleData.ts` and managed by `src/context/I18nProvider.tsx`.

AI-powered suggestions are implemented in `src/ai/flows/suggest-feats-skills.ts`.

    