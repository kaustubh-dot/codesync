import {
  Avatar,
  Button,
  ButtonGroup,
  Code,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Radio,
  RadioGroup,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { BiGitRepoForked, BiTrashAlt, BiUnlink } from 'react-icons/bi';
import { CiSettings } from 'react-icons/ci';
import { SiCodeforces } from 'react-icons/si';
import { TbSlashes } from 'react-icons/tb';
import { CodeforcesHandler, GithubHandler } from '../handlers';

type CodeforcesRepositoryMode = 'shared' | 'separate';

const parseRepositoryUrl = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const [owner, rawRepo, ...extra] = url.pathname.split('/').filter(Boolean);
  const repo = rawRepo?.replace(/\.git$/i, '');
  return url.hostname === 'github.com' && owner && repo && !extra.length ? { owner, repo } : null;
};

const SettingsMenu = () => {
  const [subdirectory, setSubdirectoryValue] = useState<string | null>(null);

  const [isOpen, setOpen] = useState<
    'unlink' | 'clear' | 'subdirectory' | 'codeforces' | 'codeforces-repo' | null
  >(null);
  const [githubUsername, setGithubUsername] = React.useState('');
  const [githubOwner, setGithubOwner] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');
  const [newRepoURL, setNewRepoURL] = useState('');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [codeforcesRepoMode, setCodeforcesRepoMode] =
    useState<CodeforcesRepositoryMode>('shared');
  const [codeforcesRepoOwner, setCodeforcesRepoOwner] = useState('');
  const [codeforcesRepo, setCodeforcesRepo] = useState('');
  const [codeforcesRepoURL, setCodeforcesRepoURL] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const closeCodeforcesRepository = () => {
    setCodeforcesRepoMode(codeforcesRepoOwner && codeforcesRepo ? 'separate' : 'shared');
    setError('');
    setOpen(null);
  };

  const unlinkRepo = async () => {
    await chrome.storage.local.remove(['github_repo_owner', 'github_repo']);
    setGithubOwner('');
    setGithubRepo('');
    window.location.reload();
  };
  const handleLinkRepo = async () => {
    if (!newRepoURL) return setError('Repository URL is required');
    const repository = parseRepositoryUrl(newRepoURL);
    if (!repository) return setError('Invalid repository URL');
    const { owner, repo: repoName } = repository;

    setError('');
    setLoading(true);
    try {
      const github = new GithubHandler();
      const isFound = await github.checkIfRepoExists(`${owner}/${repoName}`);
      if (!isFound) return setError('Repository not found or token lacks write access');

      await chrome.storage.local.set({
        github_repo_owner: owner,
        github_repo: repoName,
      });
      setGithubOwner(owner);
      setGithubRepo(repoName);
      setOpen(null);
    } catch {
      setError('Could not verify the repository. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  const resetAll = () => {
    chrome.storage.local.clear(() => {
      window.location.reload();
    });
  };

  const saveCodeforcesHandle = async () => {
    setError('');
    setLoading(true);
    try {
      const canonicalHandle = await CodeforcesHandler.validateHandle(codeforcesHandle);
      if (!canonicalHandle) return setError('Codeforces could not find this handle.');
      await chrome.storage.local.set({ codeforces_handle: canonicalHandle });
      setCodeforcesHandle(canonicalHandle);
      setOpen(null);
    } catch {
      setError('Could not verify the Codeforces handle. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeCodeforcesHandle = async () => {
    await chrome.storage.local.remove('codeforces_handle');
    setCodeforcesHandle('');
    setOpen(null);
  };

  const saveCodeforcesRepository = async () => {
    setError('');
    if (codeforcesRepoMode === 'shared') {
      await chrome.storage.local.remove([
        'github_codeforces_repo_owner',
        'github_codeforces_repo',
        'github_codeforces_repo_visibility',
      ]);
      setCodeforcesRepoOwner('');
      setCodeforcesRepo('');
      setCodeforcesRepoURL('');
      setOpen(null);
      window.location.reload();
      return;
    }

    const repository = parseRepositoryUrl(codeforcesRepoURL);
    if (!repository) return setError('Enter a complete GitHub repository URL.');
    const { owner, repo } = repository;
    if (owner === githubOwner && repo === githubRepo) {
      return setError('Choose Linked repository when both platforms use the same repository.');
    }

    setLoading(true);
    try {
      const writable = await new GithubHandler().checkIfRepoExists(
        `${owner}/${repo}`,
        'github_codeforces_repo_visibility',
      );
      if (!writable) {
        return setError('Repository not found or token lacks write access.');
      }
      await chrome.storage.local.set({
        github_codeforces_repo_owner: owner,
        github_codeforces_repo: repo,
      });
      setCodeforcesRepoOwner(owner);
      setCodeforcesRepo(repo);
      setOpen(null);
      window.location.reload();
    } catch {
      setError('Could not verify the repository. Check your connection and token permissions.');
    } finally {
      setLoading(false);
    }
  };

  const trimSubdirectory = (text: string) => {
    return text.replace(/^\/+|\/+$/g, '');
  };

  const saveSubdirectory = async () => {
    setLoading(true);
    //validate the subdirectory
    if (subdirectory === '' || subdirectory === null) {
      //this means the user wants to remove the subdirectory
      await chrome.storage.local.remove('github_subdirectory');
      setLoading(false);
      return;
    }
    const parts = subdirectory.split('/').filter(Boolean);
    if (parts.some((part) => part === '..' || !/^[a-zA-Z0-9_.-]+$/.test(part))) {
      setLoading(false);

      return setError('Invalid subdirectory');
    }

    await chrome.storage.local.set({
      github_subdirectory: trimSubdirectory(subdirectory),
    });
    setLoading(false);
  };

  useEffect(() => {
    chrome.storage.local.get(
      [
        'github_username',
        'github_repo_owner',
        'github_repo',
        'github_token',
        'github_subdirectory',
        'codeforces_handle',
        'github_codeforces_repo_owner',
        'github_codeforces_repo',
      ],
      (result) => {
        const {
          github_username,
          github_repo_owner,
          github_repo,
          github_token,
          github_subdirectory,
          codeforces_handle,
          github_codeforces_repo_owner,
          github_codeforces_repo,
        } = result;
        setGithubUsername(typeof github_username === 'string' ? github_username : '');
        setGithubOwner(typeof github_repo_owner === 'string' ? github_repo_owner : '');
        setGithubRepo(typeof github_repo === 'string' ? github_repo : '');
        setIsConfigured(!!github_token);
        setCodeforcesHandle(typeof codeforces_handle === 'string' ? codeforces_handle : '');
        const separateOwner =
          typeof github_codeforces_repo_owner === 'string' ? github_codeforces_repo_owner : '';
        const separateRepo =
          typeof github_codeforces_repo === 'string' ? github_codeforces_repo : '';
        setCodeforcesRepoOwner(separateOwner);
        setCodeforcesRepo(separateRepo);
        setCodeforcesRepoMode(separateOwner && separateRepo ? 'separate' : 'shared');
        setCodeforcesRepoURL(
          separateOwner && separateRepo ? `https://github.com/${separateOwner}/${separateRepo}` : '',
        );
        setSubdirectoryValue(
          typeof github_subdirectory === 'string' ? github_subdirectory : null,
        );
      },
    );
  }, []);

  if (!githubUsername || !githubOwner || !githubRepo || !isConfigured) return null;
  return (
    <Menu size={'lg'} placement="bottom-end">
      <MenuButton as={Button} aria-label="Settings" leftIcon={<CiSettings />} variant="outline">
        Settings
      </MenuButton>
      <MenuList fontSize={'14px'}>
        <HStack px={4} py={2}>
          <Avatar name={githubUsername} size="sm" />
          <VStack spacing={0} align="flex-start">
            <Text fontSize={'sm'} fontWeight={'semibold'}>
              {githubUsername}
            </Text>
            <Text fontSize={'xs'} color="ctp.subtext0">
              {githubRepo}
            </Text>
          </VStack>
        </HStack>
        <Divider />
        <MenuGroup title="General">
          <Popover
            isOpen={isOpen === 'codeforces'}
            onClose={() => setOpen(null)}
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                icon={<SiCodeforces fontSize={'1.2rem'} />}
                minH="40px"
                onClick={() => {
                  setError('');
                  setOpen('codeforces');
                }}
                closeOnSelect={false}
              >
                {codeforcesHandle ? `Codeforces: ${codeforcesHandle}` : 'Connect Codeforces'}
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight="semibold">Codeforces handle</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <Input
                    placeholder="tourist"
                    value={codeforcesHandle}
                    onChange={(event) => setCodeforcesHandle(event.target.value)}
                    size="sm"
                  />
                  {!error ? (
                    <FormHelperText fontSize="xs">
                      Future accepted submissions will sync when Codeforces is open.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="space-between">
                <Button
                  variant="outline"
                  colorScheme="red"
                  size="sm"
                  onClick={removeCodeforcesHandle}
                  isDisabled={!codeforcesHandle || loading}
                >
                  Disconnect
                </Button>
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={saveCodeforcesHandle}
                  isLoading={loading}
                  isDisabled={!codeforcesHandle.trim()}
                >
                  Save
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
          <Popover
            isOpen={isOpen === 'codeforces-repo'}
            onClose={closeCodeforcesRepository}
            placement="bottom-start"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                icon={<BiGitRepoForked fontSize={'1.2rem'} />}
                minH="40px"
                onClick={() => {
                  setError('');
                  setCodeforcesRepoMode(
                    codeforcesRepoOwner && codeforcesRepo ? 'separate' : 'shared',
                  );
                  setCodeforcesRepoURL(
                    codeforcesRepoOwner && codeforcesRepo
                      ? `https://github.com/${codeforcesRepoOwner}/${codeforcesRepo}`
                      : '',
                  );
                  setOpen('codeforces-repo');
                }}
                closeOnSelect={false}
              >
                Codeforces repo: {codeforcesRepoMode === 'shared' ? 'Linked' : 'Separate'}
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000} w="420px">
              <PopoverHeader fontWeight="semibold">Codeforces repository</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <RadioGroup
                  value={codeforcesRepoMode}
                  onChange={(value) => {
                    setError('');
                    setCodeforcesRepoMode(value as CodeforcesRepositoryMode);
                  }}
                >
                  <VStack align="stretch" spacing={1}>
                    <Radio value="shared">Use linked repository</Radio>
                    <Text fontSize="xs" color="ctp.subtext0" pl={6} pb={2}>
                      Upload to {githubOwner}/{githubRepo}/Codeforces.
                    </Text>
                    <Radio value="separate">Use separate repository</Radio>
                    <Text fontSize="xs" color="ctp.subtext0" pl={6}>
                      Upload Codeforces problem folders directly to another repository.
                    </Text>
                  </VStack>
                </RadioGroup>
                {codeforcesRepoMode === 'separate' && (
                  <FormControl isInvalid={!!error} mt={4}>
                    <Input
                      placeholder="https://github.com/owner/codeforces-solutions"
                      value={codeforcesRepoURL}
                      onChange={(event) => setCodeforcesRepoURL(event.target.value)}
                      size="sm"
                    />
                    {error ? (
                      <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
                    ) : (
                      <FormHelperText fontSize="xs">
                        The current fine-grained token must have Contents read/write access.
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <ButtonGroup size="sm">
                  <Button
                    variant="outline"
                    onClick={closeCodeforcesRepository}
                    isDisabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={saveCodeforcesRepository}
                    isLoading={loading}
                    isDisabled={
                      loading ||
                      (codeforcesRepoMode === 'separate' && !codeforcesRepoURL.trim())
                    }
                  >
                    Save
                  </Button>
                </ButtonGroup>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
          <Popover
            isOpen={isOpen === 'unlink'}
            onClose={() => setOpen(null)}
            placement="bottom-start"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h="100%"
                icon={<BiUnlink fontSize={'1.2rem'} />}
                minH="40px"
                onClick={() => setOpen('unlink')}
                closeOnSelect={false}
              >
                Change or unlink repo
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight="semibold">Change or unlink repo</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <Input
                    placeholder="New Repository URL"
                    value={newRepoURL}
                    onChange={(e) => {
                      setNewRepoURL(e.target.value);
                    }}
                    size="sm"
                  />
                  {!error ? (
                    <FormHelperText fontSize={'xs'}>Paste the new repository URL.</FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <HStack w="100%" justify={'space-between'}>
                  <Button
                    colorScheme={'red'}
                    variant={'outline'}
                    size="sm"
                    onClick={unlinkRepo}
                    isDisabled={loading}
                  >
                    Unlink Repo
                  </Button>
                  <ButtonGroup size="sm">
                    <Button variant="outline" isLoading={loading} onClick={() => setOpen(null)}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={handleLinkRepo}
                      isDisabled={loading || !newRepoURL}
                    >
                      Save
                    </Button>
                  </ButtonGroup>
                </HStack>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
          <Popover
            isOpen={isOpen === 'subdirectory'}
            onClose={() => setOpen(null)}
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <Tooltip label="Choose where future submissions are uploaded in your repository.">
                <MenuItem
                  h="100%"
                  icon={<TbSlashes fontSize={'1.2rem'} />}
                  minH="40px"
                  onClick={() => setOpen('subdirectory')}
                  closeOnSelect={false}
                >
                  Set a subdirectory{' '}
                </MenuItem>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent zIndex={10000} w="400px" paddingBottom={'1rem'}>
              <PopoverHeader fontWeight="semibold">Set Subdirectory</PopoverHeader>
              <Text fontSize="sm" padding="2">
                If you set it to <Code fontSize="xs">/LinkedList/Easy</Code>, your next submissions
                will be uploaded there.
              </Text>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <FormControl isInvalid={!!error}>
                  <Input
                    value={subdirectory || ''}
                    onChange={(event) => setSubdirectoryValue(event.target.value)}
                    isDisabled={loading}
                    placeholder="No subdirectory set"
                    size="sm"
                  />
                  {!error ? (
                    <FormHelperText fontSize={'xs'}>
                      Your next submissions will be uploaded to{' '}
                      <Code fontSize="xs">
                        {`${githubOwner}/${githubRepo}/${
                          (subdirectory && trimSubdirectory(subdirectory)) || ''
                        }`}
                      </Code>
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage fontSize={'xs'}>{error}</FormErrorMessage>
                  )}
                </FormControl>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={saveSubdirectory}
                  isLoading={loading}
                >
                  Save
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </MenuGroup>
        <Divider />
        <MenuGroup title="Danger Area">
          <Popover
            isOpen={isOpen === 'clear'}
            onClose={() => setOpen(null)}
            placement="bottom-start"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <MenuItem
                h="100%"
                icon={<BiTrashAlt fontSize={'1.2rem'} />}
                bgColor="rgba(231, 130, 132, 0.16)"
                color="ctp.red"
                minH="40px"
                onClick={() => setOpen('clear')}
                closeOnSelect={false}
              >
                Reset All
              </MenuItem>
            </PopoverTrigger>
            <PopoverContent zIndex={1000000}>
              <PopoverHeader fontWeight="semibold">Reset all your data</PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <Text fontSize={'sm'}>
                  This will reset all your data, including your linked GitHub repository and solved
                  problems data. This action cannot be undone.
                </Text>
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <ButtonGroup size="sm">
                  <Button variant="outline" isLoading={loading} onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button colorScheme={'red'} variant={'outline'} size="sm" onClick={resetAll}>
                    I understand, Reset All
                  </Button>
                </ButtonGroup>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};
export default SettingsMenu;
