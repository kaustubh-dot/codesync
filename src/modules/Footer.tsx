import { HStack, Text } from '@chakra-ui/react';

export const Footer = () => {
  return (
    <HStack align="center">
      <Text fontSize={'12px'}>
        Having Issues?{' '}
        <Text
          as="a"
          color="ctp.blue"
          href="https://github.com/kaustubh-dot/codesync/issues/new/choose"
          target="_blank"
          fontWeight={'semibold'}
        >
          Report Bug
        </Text>{' '}
        | Made with <span style={{ color: '#e25555' }}>&#9829;</span> by{' '}
        <Text
          as="a"
          color="ctp.blue"
          href="https://github.com/kaustubh-dot"
          target="_blank"
          fontWeight={'semibold'}
          display="inline-block"
        >
          @kaustubh-dot
        </Text>
      </Text>
    </HStack>
  );
};
