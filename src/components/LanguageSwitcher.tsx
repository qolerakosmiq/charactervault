
'use client';

import { useI18n } from '@/context/I18nProvider';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { language, setLanguage, isLoading } = useI18n();

  if (isLoading) {
    return <div className="h-10 w-28 animate-pulse rounded-md bg-muted"></div>; // Adjusted skeleton height
  }

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
      <SelectTrigger className="w-[120px]" id="dm-language-switcher"> {/* Removed h-9 and text-xs to use default h-10, text-sm */}
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} className="text-xs">
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
