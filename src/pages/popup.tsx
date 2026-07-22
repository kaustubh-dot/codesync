import { CircularProgress, Container, Heading, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  ConfigureGithubToken,
  SelectRepositoryStep,
  StartOnboarding,
} from '../modules/CompleteAuthentication';
import Dashboard from '../modules/Dashboard';
import { OnboardingLayout } from '../modules/OnboardingLayout';

type UserGlobalData = {
  github_leetsync_token: string;
  github_username: string;
  github_repo_owner: string;
  github_leetsync_repo: string;
};

const hasCompletedRequirements = (data: Partial<UserGlobalData>) =>
  !!(
    data.github_leetsync_token &&
    data.github_username &&
    data.github_repo_owner &&
    data.github_leetsync_repo
  );

const getUserData = async (): Promise<Partial<UserGlobalData>> =>
  chrome.storage.local.get([
    'github_leetsync_token',
    'github_username',
    'github_repo_owner',
    'github_leetsync_repo',
  ]);

const steps = [StartOnboarding, ConfigureGithubToken, SelectRepositoryStep];

const PopupPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const [step, setStep] = useState(0);

  const refresh = async () => {
    try {
      const data = await getUserData();
      if (hasCompletedRequirements(data)) {
        setIsSynced(true);
      } else if (data.github_leetsync_token && data.github_username) {
        setStep(2);
      }
    } catch {
      setError('Could not read the extension configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (isSynced) return <Dashboard />;
  if (error) return <Heading>{error}</Heading>;

  const Step = steps[step];
  const content = <Step nextStep={() => setStep(Math.min(step + 1, steps.length - 1))} />;

  return (
    <Container
      w="450px"
      paddingTop="50px"
      paddingBottom="25px"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      boxShadow="md"
      pos="relative"
    >
      <VStack w="100%" h="100%" align="center" justify="center">
        {isLoading ? (
          <CircularProgress color="green" isIndeterminate />
        ) : step === 0 ? (
          content
        ) : (
          <OnboardingLayout step={step} totalSteps={steps.length - 1}>
            {content}
          </OnboardingLayout>
        )}
      </VStack>
    </Container>
  );
};

export default PopupPage;
