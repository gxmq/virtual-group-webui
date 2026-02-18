'use client';

import { useColorMode, IconButton, Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Box w="40px" />;
  }

  return (
    <IconButton
      aria-label="Toggle theme"
      icon={<Box as="span" fontSize="lg">{colorMode === 'light' ? '🌙' : '☀️'}</Box>}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
      color="gray.400"
      _hover={{ color: 'white', bg: 'gray.700' }}
    />
  );
}
