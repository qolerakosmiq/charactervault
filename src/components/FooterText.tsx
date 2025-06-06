
'use client';

import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export function FooterText() {
  const { translations, isLoading } = useI18n();

  if (isLoading || !translations) {
    // Display a skeleton that roughly matches the expected text length
    // "Built with ❤️ for D&D 3.5 Players" is around 30-35 chars.
    // "Fait avec ❤️ pour les joueurs de D&D 3.5" is around 40-45 chars.
    // A width of w-64 (16rem / 256px) or w-72 (18rem / 288px) should be a decent placeholder.
    return <Skeleton className="h-5 w-72" />; 
  }

  return (
    <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
      {translations.UI_STRINGS.footerAppDescription || "Built with ❤️ for D&D 3.5 Players"}
    </p>
  );
}
