import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { BsGithub } from 'react-icons/bs';
import Logo from '../components/Logo';
import { GithubHandler } from '../handlers';
import { Footer } from './Footer';

const ConfigureGithubToken = ({ nextStep }: { nextStep: () => void }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveToken = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await new GithubHandler().validateAndStoreToken(token);
      if (!user) {
        setError('GitHub rejected this token. Check its expiration and repository access.');
        return;
      }
      nextStep();
    } catch {
      setError('Could not reach GitHub. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack w="100%" spacing={4}>
      <VStack pb={2}>
        <Heading size="md">Connect GitHub safely</Heading>
        <Text color="GrayText" fontSize="sm" w="95%" textAlign="center">
          Use a fine-grained personal access token limited to one repository with Contents set to
          read and write. The token stays on this device and is never exposed to coding-platform pages.
        </Text>
      </VStack>
      <FormControl isRequired isInvalid={!!error}>
        <InputGroup size="sm">
          <Input
            type="password"
            autoComplete="off"
            placeholder="Fine-grained GitHub token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </InputGroup>
        {error ? (
          <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
        ) : (
          <FormHelperText fontSize="xs">
            Create one under{' '}
            <Link href="https://github.com/settings/personal-access-tokens/new" isExternal>
              GitHub token settings
            </Link>
            . Choose only the repository you plan to sync.
          </FormHelperText>
        )}
      </FormControl>
      <Button
        colorScheme="blackAlpha"
        bg="blackAlpha.800"
        w="100%"
        leftIcon={<BsGithub />}
        color="whiteAlpha.900"
        _hover={{ bg: 'blackAlpha.700' }}
        onClick={saveToken}
        isLoading={loading}
        isDisabled={!token.trim()}
      >
        Validate token
      </Button>
    </VStack>
  );
};

const SelectRepositoryStep = ({ nextStep }: { nextStep: () => void }) => {
  const [repositoryURL, setRepositoryURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLinkRepo = async () => {
    setError('');
    let url: URL;
    try {
      url = new URL(repositoryURL);
    } catch {
      setError('Enter a complete GitHub repository URL.');
      return;
    }

    const [owner, rawRepo, ...extra] = url.pathname.split('/').filter(Boolean);
    const repo = rawRepo?.replace(/\.git$/i, '');
    if (url.hostname !== 'github.com' || !owner || !repo || extra.length) {
      setError('Enter a URL in the form https://github.com/owner/repository.');
      return;
    }

    setLoading(true);
    try {
      const writable = await new GithubHandler().checkIfRepoExists(`${owner}/${repo}`);
      if (!writable) {
        setError('The repository is unavailable or the token cannot write to it.');
        return;
      }
      await chrome.storage.local.set({
        github_repo_owner: owner,
        github_repo: repo,
      });
      nextStep();
      window.location.reload();
    } catch {
      setError('Could not verify the repository. Check your connection and token permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack w="100%">
      <VStack>
        <Heading size="md">Link your repository</Heading>
        <Text color="GrayText" fontSize="sm" w="90%" textAlign="center">
          Paste the only repository selected when you created the token.
        </Text>
      </VStack>
      <FormControl isRequired isInvalid={!!error}>
        <InputGroup size="sm">
          <Input
            placeholder="https://github.com/owner/repository"
            value={repositoryURL}
            onChange={(event) => setRepositoryURL(event.target.value)}
          />
        </InputGroup>
        {error ? (
          <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
        ) : (
            <FormHelperText fontSize="xs">
              Accepted LeetCode and Codeforces submissions will be committed here.
            </FormHelperText>
        )}
      </FormControl>
      <Button
        colorScheme="green"
        w="100%"
        onClick={handleLinkRepo}
        isLoading={loading}
        isDisabled={!repositoryURL.trim()}
        size="sm"
      >
        Link repository
      </Button>
    </VStack>
  );
};

const StartOnboarding = ({ nextStep }: { nextStep: () => void }) => (
  <VStack w="100%" h="100%" align="center" justify="center">
    <Logo />
    <VStack w="100%">
      <Heading size="lg">CodeSync</Heading>
      <Text color="GrayText" fontSize="sm" w="90%" textAlign="center">
        Sync accepted LeetCode and Codeforces submissions to a public or private GitHub repository
        without sharing browser sessions or broad account access. Public uploads are checked for
        likely credentials.
      </Text>
    </VStack>
    <VStack w="100%" py={4}>
      <Button size="md" colorScheme="green" w="95%" onClick={nextStep}>
        Complete setup
      </Button>
    </VStack>
    <Footer />
  </VStack>
);

export { StartOnboarding, ConfigureGithubToken, SelectRepositoryStep };
