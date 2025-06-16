
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';
import { Badge } from '@/components/ui/badge';

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
    console.error(`Error accessing path "${path}" in object:`, obj, error);
    return undefined;
  }
};


export function parseAndRenderUIString(uiString: string, dataContext?: Record<string, any>): React.ReactNode {
  if (!uiString) return '';

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // Regex to find <badge> tags and {variable.path[index].property} placeholders
  const regex = /(<badge(?: outline)?>.*?<\/badge>)|({[a-zA-Z0-9_.[\]]+})/g;

  let match;
  while ((match = regex.exec(uiString)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(uiString.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith("<badge")) {
      const isOutline = fullMatch.startsWith("<badge outline>");
      const contentMatch = fullMatch.match(/<badge(?: outline)?>(.*?)<\/badge>/);
      let content = contentMatch ? contentMatch[1] : '';
      
      // Check if badge content is a variable placeholder
      if (content.startsWith("{") && content.endsWith("}")) {
        const variablePathInBadge = content.substring(1, content.length - 1);
        const valueInBadge = dataContext ? getProperty(dataContext, variablePathInBadge) : undefined;
        content = valueInBadge !== undefined ? String(valueInBadge) : `{${variablePathInBadge}}`;
      }

      elements.push(
        <Badge key={`${match.index}-${elements.length}`} variant={isOutline ? "outline" : "default"}>
          {content}
        </Badge>
      );
    } else if (fullMatch.startsWith("{") && fullMatch.endsWith("}")) {
      const variablePath = fullMatch.substring(1, fullMatch.length - 1);
      const value = dataContext ? getProperty(dataContext, variablePath) : undefined;
      elements.push(value !== undefined ? String(value) : `{${variablePath}}`);
    }
    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < uiString.length) {
    elements.push(uiString.substring(lastIndex));
  }

  // If only one element and it's a string, return it directly, otherwise return a fragment
  if (elements.length === 0) return '';
  if (elements.length === 1 && typeof elements[0] === 'string') return elements[0];
  
  return React.createElement(React.Fragment, null, ...elements.map((el, i) => 
    React.isValidElement(el) ? React.cloneElement(el, { key: `parsed-${i}` }) : el
  ));
}
