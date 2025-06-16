
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
    // console.error(`Error accessing path "${path}" in object:`, obj, error);
    return undefined;
  }
};


export function parseAndRenderUIString(uiString: string, dataContext?: Record<string, any>): React.ReactNode {
  if (!uiString) return '';

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = /(<badge(?: outline)?>.*?<\/badge>)|(<color accent>.*?<\/color>)|(<b>.*?<\/b>)|({[a-zA-Z0-9_.[\]]+})/g;

  let match;
  while ((match = regex.exec(uiString)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(uiString.substring(lastIndex, match.index));
    }

    const matchedString = match[0];

    if (match[1]) { // <badge> tag
      const badgeContentMatch = matchedString.match(/<badge(?: outline)?>(.*?)<\/badge>/);
      const content = badgeContentMatch ? badgeContentMatch[1] : '';
      const isOutline = matchedString.includes(" outline");

      const pipeIndex = content.indexOf("|"); // Find just the pipe
      
      if (pipeIndex !== -1) {
        const labelPartStr = content.substring(0, pipeIndex).trim(); // Trim spaces from JSON around pipe
        const valuePartStr = content.substring(pipeIndex + 1).trim(); // Trim spaces from JSON around pipe

        const labelPartNode = parseAndRenderUIString(labelPartStr, dataContext);
        const valuePartNode = parseAndRenderUIString(valuePartStr, dataContext);
        
        elements.push(
          <Badge key={`${match.index}-${elements.length}-badge`} variant={isOutline ? "outline" : "default"} className="whitespace-nowrap">
            {labelPartNode}
            {' \u00A0|\u00A0 '} {/* Consistent "space-nbsp-pipe-nbsp-space" separator */}
            <strong className="font-semibold">{valuePartNode}</strong>
          </Badge>
        );
      } else {
        // Badge without pipe
        elements.push(
          <Badge key={`${match.index}-${elements.length}-badge`} variant={isOutline ? "outline" : "default"} className="whitespace-nowrap">
            {parseAndRenderUIString(content, dataContext)}
          </Badge>
        );
      }
    } else if (match[2]) { // <color accent> tag
      const colorContentMatch = matchedString.match(/<color accent>(.*?)<\/color>/);
      const content = colorContentMatch ? colorContentMatch[1] : '';
      elements.push(
        <span key={`${match.index}-${elements.length}-color`} className="text-accent">
          {parseAndRenderUIString(content, dataContext)}
        </span>
      );
    } else if (match[3]) { // <b> tag
      const boldContentMatch = matchedString.match(/<b>(.*?)<\/b>/);
      const content = boldContentMatch ? boldContentMatch[1] : '';
      elements.push(
        <strong key={`${match.index}-${elements.length}-bold`}>
          {parseAndRenderUIString(content, dataContext)}
        </strong>
      );
    } else if (match[4]) { // {variable} placeholder
      const variablePath = matchedString.substring(1, matchedString.length - 1);
      const value = dataContext ? getProperty(dataContext, variablePath) : undefined;
      
      if (value !== undefined) {
        if (typeof value === 'string' && (value.includes('<badge') || value.includes('<color') || value.includes('<b>') || value.includes('{'))) {
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
  if (elements.length === 1 && typeof elements[0] === 'string') return elements[0];
  
  return React.createElement(React.Fragment, null, ...elements.map((el, i) => 
    React.isValidElement(el) ? (el.key ? el : React.cloneElement(el, { key: `parsed-el-${i}-${Math.random().toString(36).substring(7)}` })) : el
  ));
}
