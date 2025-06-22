
'use client';

import { useI18n } from '@/context/I18nProvider';

export function FooterText() {
  const { translations, isLoading } = useI18n();

  if (isLoading || !translations) {
    return null; 
  }

  return (
    <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
      {translations.UI_STRINGS.footerAppDescription}
    </p>
  );
}
