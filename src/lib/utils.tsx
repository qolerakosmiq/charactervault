
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { textStyleInlineBadge } from "@/config/layout";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to safely get nested properties
const getProperty = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  try {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Handle array access like classes[0].level
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch && current && typeof current === 'object' && arrayMatch[1] in current) {
          const arrayKey = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);
          if (Array.isArray(current[arrayKey]) && index < current[arrayKey].length) {
            current = current[arrayKey][index];
          } else {
            return undefined;
          }
        } else {
          return undefined;
        }
      }
    }
    return current;
  } catch (error) {
    // console.error(`Error accessing path "${path}" in object:`, obj, error);
    return undefined;
  }
};

export function parseAndRenderUIString(uiString: string, dataContext?: Record<string, any>): React.ReactNode {
  if (!uiString) return '';

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = /(<badge(?: outline)?>.*?<\/badge>)|(<color accent>.*?<\/color>)|(<b>.*?<\/b>)|(<br\s*\/?>)|({[a-zA-Z0-9_.[\]]+})/g;

  let match;
  while ((match = regex.exec(uiString)) !== null) {
    if (match.index > lastIndex) {
      elements.push(uiString.substring(lastIndex, match.index));
    }

    const badgeMatch = match[1];
    const colorMatch = match[2];
    const boldMatch = match[3];
    const brMatch = match[4];
    const variableMatch = match[5];

    if (badgeMatch) {
      const isOutline = badgeMatch.includes(" outline");
      const contentMatch = badgeMatch.match(/<badge(?: outline)?>(.*?)<\/badge>/);
      const rawBadgeContent = contentMatch ? contentMatch[1] : '';
      
      const badgeContentWithNbsp = rawBadgeContent.replace(/ /g, "\u00A0");
      
      const badgeChildNodes = parseAndRenderUIString(badgeContentWithNbsp, dataContext);
      
      elements.push(
        <Badge key={`${match.index}-${elements.length}-badge-${Math.random().toString(36).substring(7)}`} variant={isOutline ? "outline" : "default"} className={cn("whitespace-nowrap", textStyleInlineBadge)}>
          {badgeChildNodes}
        </Badge>
      );
    } else if (colorMatch) {
      const colorContentMatch = colorMatch.match(/<color accent>(.*?)<\/color>/);
      const content = colorContentMatch ? colorContentMatch[1] : '';
      elements.push(
        <span key={`${match.index}-${elements.length}-color-${Math.random().toString(36).substring(7)}`} className="text-accent">
          {parseAndRenderUIString(content, dataContext)}
        </span>
      );
    } else if (boldMatch) {
      const boldContentMatch = boldMatch.match(/<b>(.*?)<\/b>/);
      const content = boldContentMatch ? boldContentMatch[1] : '';
      elements.push(
        <strong key={`${match.index}-${elements.length}-bold-${Math.random().toString(36).substring(7)}`}>
          {parseAndRenderUIString(content, dataContext)}
        </strong>
      );
    } else if (brMatch) {
      elements.push(React.createElement('br', { key: `${match.index}-${elements.length}-br-${Math.random().toString(36).substring(7)}` }));
    } else if (variableMatch) {
      const variablePath = variableMatch.substring(1, variableMatch.length - 1);
      const value = dataContext ? getProperty(dataContext, variablePath) : undefined;
      
      if (value !== undefined) {
        if (typeof value === 'string' && (value.includes('<badge') || value.includes('<color') || value.includes('<b>') || value.includes('{') || value.includes('<br'))) {
          elements.push(parseAndRenderUIString(value, dataContext));
        } else {
          elements.push(String(value));
        }
      } else {
        elements.push(`{${variablePath}}`); 
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < uiString.length) {
    elements.push(uiString.substring(lastIndex));
  }

  if (elements.length === 0) return '';
  if (elements.length === 1 && typeof elements[0] === 'string') {
    return elements[0];
  }
  
  return React.createElement(React.Fragment, null, ...elements.map((el, i) => 
    React.isValidElement(el) ? (el.key ? el : React.cloneElement(el, { key: `parsed-el-${i}-${Math.random().toString(36).substring(7)}` })) : el
  ));
}

export const generateRandomAlphanumericString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
