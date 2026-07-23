import {
  Alert,
  AlertIcon,
  Box,
  Container,
  Divider,
  Heading,
  HStack,
  IconButton,
  Link,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { BiLink } from 'react-icons/bi';
import { BsLightningChargeFill } from 'react-icons/bs';
import { CiSettings } from 'react-icons/ci';
import DoughnutComponent from '../components/Doughnut';
import SettingsMenu from '../components/SettingsMenu';
import StreakCounter from '../components/StreakCounter';
import {
  formatProblemsPerDay,
  getLocalDateKey,
  getTotalNumberOfStreaks,
} from '../utils/streak.helper';
import { Footer } from './Footer';

const LinkedGithubComponents = () => {
  const [githubOwner, setGithubOwner] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');

  useEffect(() => {
    chrome.storage.local.get(['github_repo_owner', 'github_repo'], (result) => {
      setGithubOwner(typeof result.github_repo_owner === 'string' ? result.github_repo_owner : '');
      setGithubRepo(
        typeof result.github_repo === 'string' ? result.github_repo : '',
      );
    });
  }, []);

  return (
    <Box>
      <Text fontSize="xs">
        Linked with{' '}
        <Link
          href={`https://github.com/${githubOwner}/${githubRepo}`}
          target="_blank"
          rel="noopener noreferrer"
          fontWeight="semibold"
          fontFamily="mono"
        >
          {githubOwner}/{githubRepo}
        </Link>
        . Use{' '}
        <IconButton
          aria-label="Settings"
          icon={<CiSettings />}
          size="xs"
          variant="outline"
          color="ctp.subtext1"
        />{' '}
        to change it.
      </Text>
    </Box>
  );
};

const Dashboard = () => {
  const [solvedProblems, setSolvedProblems] = React.useState({ easy: 0, medium: 0, hard: 0 });
  const [streak, setStreak] = React.useState(0);
  const [problemsPerDay, setProblemsPerDay] = React.useState<Record<string, number>>();
  const [githubOwner, setGithubOwner] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');
  const [repoVisibility, setRepoVisibility] = React.useState('private');
  const [codeforcesRepoVisibility, setCodeforcesRepoVisibility] = React.useState('');
  const [uploadError, setUploadError] = React.useState('');
  const [codeforcesHandle, setCodeforcesHandle] = React.useState('');
  const [codeforcesSolved, setCodeforcesSolved] = React.useState(0);
  const [codeforcesRepoOwner, setCodeforcesRepoOwner] = React.useState('');
  const [codeforcesRepo, setCodeforcesRepo] = React.useState('');

  const solvedProblemsToday = problemsPerDay?.[getLocalDateKey(new Date())] || 0;

  React.useEffect(() => {
    const keys = [
      'problemsSolved',
      'github_repo_owner',
      'github_repo',
      'github_repo_visibility',
      'lastUploadError',
      'codeforces_handle',
      'codeforces_synced_submissions',
      'github_codeforces_repo_owner',
      'github_codeforces_repo',
      'github_codeforces_repo_visibility',
    ];
    const loadDashboard = () => {
      chrome.storage.local.get(keys, (result) => {
        setGithubOwner(typeof result.github_repo_owner === 'string' ? result.github_repo_owner : '');
        setGithubRepo(
          typeof result.github_repo === 'string' ? result.github_repo : '',
        );
        setRepoVisibility(result.github_repo_visibility === 'public' ? 'public' : 'private');
        setUploadError(typeof result.lastUploadError === 'string' ? result.lastUploadError : '');
        setCodeforcesHandle(
          typeof result.codeforces_handle === 'string' ? result.codeforces_handle : '',
        );
        setCodeforcesRepoOwner(
          typeof result.github_codeforces_repo_owner === 'string'
            ? result.github_codeforces_repo_owner
            : '',
        );
        setCodeforcesRepo(
          typeof result.github_codeforces_repo === 'string'
            ? result.github_codeforces_repo
            : '',
        );
        setCodeforcesRepoVisibility(
          result.github_codeforces_repo_visibility === 'public' ? 'public' : '',
        );
        setCodeforcesSolved(
          result.codeforces_synced_submissions &&
            typeof result.codeforces_synced_submissions === 'object'
            ? Object.keys(result.codeforces_synced_submissions).length
            : 0,
        );
        if (!result.problemsSolved) return;

        const values = Object.values(result.problemsSolved) as {
          question: { difficulty: 'Easy' | 'Medium' | 'Hard' };
          timestamp: number;
        }[];
        const totals = { easy: 0, medium: 0, hard: 0 };
        values.forEach(({ question }) => {
          totals[question.difficulty.toLowerCase() as keyof typeof totals]++;
        });
        const dailyProblems = formatProblemsPerDay(values);
        setSolvedProblems(totals);
        setProblemsPerDay(dailyProblems);
        setStreak(getTotalNumberOfStreaks(dailyProblems));
      });
    };
    const handleStorageChange = (_changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local') loadDashboard();
    };

    loadDashboard();
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return (
    <Container
      w="400px"
      maxW="100vw"
      h="fit-content"
      p={0}
      border="1px solid"
      borderColor="ctp.surface1"
      borderRadius="lg"
      bg="ctp.base"
      boxShadow="0 12px 30px rgba(35, 38, 52, 0.35)"
      overflow="hidden"
    >
      <HStack
        justify="space-between"
        px={5}
        py={3}
        borderBottom="1px solid"
        borderColor="ctp.surface0"
        bg="ctp.mantle"
      >
        <HStack spacing={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="ctp.green" />
          <Text fontSize="sm" fontWeight="bold">
            CodeSync
          </Text>
          <Text fontSize="xs" color="ctp.overlay2">
            Activity
          </Text>
        </HStack>
        <SettingsMenu />
      </HStack>

      <VStack align="stretch" spacing={4} p={5}>
        {(uploadError || repoVisibility === 'public' || codeforcesRepoVisibility === 'public') && (
          <Alert status={uploadError ? 'error' : 'info'} fontSize="xs" borderRadius="md">
            <AlertIcon boxSize={4} />
            {uploadError || 'A destination repository is public. Credential checks are enabled.'}
          </Alert>
        )}

        <Box
          position="relative"
          overflow="hidden"
          border="1px solid"
          borderColor="ctp.surface1"
          borderRadius="md"
          bg="ctp.mantle"
          p={4}
        >
          <Box
            position="absolute"
            top="-32px"
            right="-20px"
            w="110px"
            h="110px"
            borderRadius="full"
            bg="rgba(140, 170, 238, 0.08)"
          />
          <HStack align="flex-start" justify="space-between" position="relative">
            <Box>
              <Text fontSize="xs" color="ctp.overlay2" fontWeight="semibold">
                CURRENT RUN
              </Text>
              <HStack align="baseline" spacing={2} mt={1}>
                <Heading fontSize="42px" lineHeight="1" letterSpacing="-0.06em">
                  {streak}
                </Heading>
                <Text color="ctp.subtext1" fontWeight="semibold">
                  {streak === 1 ? 'day' : 'days'}
                </Text>
              </HStack>
              <Text color="ctp.subtext0" fontSize="sm" mt={2}>
                {solvedProblemsToday
                  ? `${solvedProblemsToday} solved today — activity recorded.`
                  : 'No activity yet today. Your next accepted solution counts.'}
              </Text>
            </Box>
            <Box
              display="grid"
              placeItems="center"
              w="42px"
              h="42px"
              borderRadius="md"
              bg={solvedProblemsToday ? 'rgba(166, 209, 137, 0.16)' : 'ctp.surface0'}
              color={solvedProblemsToday ? 'ctp.green' : 'ctp.overlay2'}
            >
              <BsLightningChargeFill size="20px" aria-hidden />
            </Box>
          </HStack>
          <HStack mt={4} pt={3} borderTop="1px solid" borderColor="ctp.surface0" minW={0}>
            <Text fontSize="xs" color="ctp.subtext0" flexShrink={0}>
              Syncing to
            </Text>
            <Tooltip label={<LinkedGithubComponents />}>
              <IconButton
                variant="ghost"
                aria-label={`Open ${githubOwner}/${githubRepo} on GitHub`}
                icon={<BiLink />}
                size="xs"
                color="ctp.blue"
                onClick={() =>
                  window.open(
                    `https://github.com/${githubOwner}/${githubRepo}`,
                    '_blank',
                    'noopener',
                  )
                }
              />
            </Tooltip>
            <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
              {githubOwner}/{githubRepo}
            </Text>
          </HStack>
        </Box>

        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="bold">
              Last 7 days
            </Text>
            <Text fontSize="xs" color="ctp.overlay2">
              Number = solved
            </Text>
          </HStack>
          <StreakCounter problemsPerDay={problemsPerDay} />
        </Box>

        <Divider borderColor="ctp.surface0" />

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm" fontWeight="bold">
              Problem mix
            </Text>
            <Text fontSize="xs" color="ctp.overlay2">
              LeetCode totals
            </Text>
          </HStack>
          <HStack justify="space-between">
            <DoughnutComponent
              data={{
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [
                  {
                    borderWidth: 1,
                    backgroundColor: [
                      'rgba(166, 209, 137, 0.18)',
                      'rgba(239, 158, 118, 0.18)',
                      'rgba(231, 130, 132, 0.18)',
                    ],
                    borderColor: ['#a6d189', '#ef9f76', '#e78284'],
                    label: 'Solved Problems',
                    data: [solvedProblems.easy, solvedProblems.medium, solvedProblems.hard],
                  },
                ],
              }}
            />
            <VStack w="118px" align="stretch" spacing={2}>
              {Object.entries(solvedProblems).map(([key, value]) => (
                <HStack
                  key={key}
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="sm"
                  bg="ctp.mantle"
                >
                  <Text color="ctp.subtext0" fontSize="xs">
                    {key[0].toUpperCase() + key.slice(1)}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {value}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </HStack>
        </Box>

        <Alert
          status={codeforcesHandle ? 'success' : 'info'}
          fontSize="xs"
          borderRadius="md"
          alignItems="flex-start"
          variant="left-accent"
        >
          <AlertIcon mt="1px" boxSize={4} />
          <Box minW={0}>
            <Text>
              {codeforcesHandle
                ? `Codeforces @${codeforcesHandle} · ${codeforcesSolved} synced`
                : 'Connect Codeforces from Settings to sync accepted submissions.'}
            </Text>
            {codeforcesHandle && (
              <Text color="ctp.subtext1" wordBreak="break-all" mt={0.5}>
                {codeforcesRepoOwner && codeforcesRepo
                  ? `${codeforcesRepoOwner}/${codeforcesRepo}`
                  : `${githubOwner}/${githubRepo}/Codeforces`}
              </Text>
            )}
          </Box>
        </Alert>

        <HStack justify="center" pt={1}>
          <Footer />
        </HStack>
      </VStack>
    </Container>
  );
};

export default Dashboard;
