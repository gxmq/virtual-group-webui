'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode="dark" />
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </>
  );
}
