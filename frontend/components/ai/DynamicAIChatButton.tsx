"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the AI components with no SSR
const AIChatButtonWrapper = dynamic(() => import("./AIChatButtonWrapper"), {
  ssr: false,
  loading: () => null,
});

const DynamicAIChatButton: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client side
  if (!mounted) {
    return null;
  }

  return <AIChatButtonWrapper />;
};

export default DynamicAIChatButton;
