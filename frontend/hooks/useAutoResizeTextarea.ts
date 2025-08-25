import { useEffect, useRef } from 'react';

export const useAutoResizeTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    
    textarea.style.height = 'auto';
    
    
    const newHeight = Math.min(textarea.scrollHeight, 200);
    
    
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  return textareaRef;
};
