import { Box, HStack, Progress, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import Logo from '../components/Logo';
import { Footer } from './Footer';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
}

export const OnboardingLayout = ({
  children,
  step,
  totalSteps,
}: OnboardingLayoutProps) => (
  <VStack w="100%" spacing={6}>
    <HStack w="100%" justify="space-between" align="center">
      <Logo logoProps={{ maxW: '64px', boxShadow: 'none', mb: 0 }} />
      <Box flex="1">
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="bold">
            Set up CodeSync
          </Text>
          <Text color="ctp.overlay2" fontSize="xs">
            {step} of {totalSteps}
          </Text>
        </HStack>
        <Progress
          value={(step / totalSteps) * 100}
          size="xs"
          colorScheme="green"
          borderRadius="full"
          bg="ctp.surface0"
        />
      </Box>
    </HStack>
    <VStack w="100%" spacing={5}>
      {children}
      <Footer />
    </VStack>
  </VStack>
);
