import { Box, Grid, Text, VStack } from '@chakra-ui/react';
import { getLocalDateKey } from '../utils/streak.helper';

interface StreakCounterProps {
  problemsPerDay?: { [date: string]: number };
}

const StreakCounter = ({ problemsPerDay }: StreakCounterProps) => (
  <Grid templateColumns="repeat(7, 1fr)" gap={2} w="100%">
    {Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      const daysAgo = 6 - index;
      date.setDate(date.getDate() - daysAgo);
      const count = problemsPerDay?.[getLocalDateKey(date)] ?? 0;
      const isToday = daysAgo === 0;

      return (
        <VStack
          key={getLocalDateKey(date)}
          spacing={1.5}
          py={2}
          borderRadius="md"
          bg={isToday ? 'rgba(140, 170, 238, 0.08)' : 'transparent'}
          aria-label={`${date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}: ${count} solved`}
        >
          <Text
            fontSize="10px"
            fontWeight="bold"
            color={isToday ? 'ctp.blue' : 'ctp.overlay2'}
            textTransform="uppercase"
          >
            {date.toLocaleDateString(undefined, { weekday: 'short' })}
          </Text>
          <Box
            w="100%"
            maxW="34px"
            h="42px"
            display="grid"
            placeItems="center"
            borderRadius="sm"
            border="1px solid"
            borderColor={count ? 'ctp.green' : isToday ? 'ctp.blue' : 'ctp.surface1'}
            bg={count ? 'rgba(166, 209, 137, 0.16)' : 'ctp.mantle'}
            boxShadow={count ? 'inset 0 -3px 0 rgba(166, 209, 137, 0.55)' : 'none'}
          >
            <Text fontSize="sm" fontWeight="bold" color={count ? 'ctp.green' : 'ctp.subtext0'}>
              {count || date.getDate()}
            </Text>
          </Box>
          <Text fontSize="9px" color={isToday ? 'ctp.text' : 'ctp.subtext0'}>
            {isToday ? 'Today' : count ? `${count} solved` : '—'}
          </Text>
        </VStack>
      );
    })}
  </Grid>
);

export default StreakCounter;
