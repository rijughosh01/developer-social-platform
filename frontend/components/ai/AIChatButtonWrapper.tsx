'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import AIChatButton from './AIChatButton';

const AIChatButtonWrapper: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering during SSR
  if (!mounted) {
    return null;
  }

  // Only show AI chat button for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return <AIChatButton />;
};

export default AIChatButtonWrapper; 