import { describe, expect, beforeEach, it } from 'vitest';
import { useIntegrationLinkStore } from '../integration-link-store';

const resetStore = () => {
  useIntegrationLinkStore.setState({
    linksByLogId: {},
    githubPat: null,
    aiProviderConfig: null,
  });
};

describe('useIntegrationLinkStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts with empty linksByLogId and null githubPat', () => {
    const state = useIntegrationLinkStore.getState();
    expect(state.linksByLogId).toEqual({});
    expect(state.githubPat).toBeNull();
    expect(state.aiProviderConfig).toBeNull();
  });

  it('addLink adds a link with a generated id and createdAt', () => {
    const store = useIntegrationLinkStore.getState();
    store.addLink('log-1', {
      owner: 'nigoh',
      repo: 'Timer',
      issueNumber: 36,
      issueTitle: 'GitHub integration',
      issueUrl: 'https://github.com/nigoh/Timer/issues/36',
    });

    const links = useIntegrationLinkStore.getState().getLinks('log-1');
    expect(links).toHaveLength(1);
    expect(links[0].owner).toBe('nigoh');
    expect(links[0].repo).toBe('Timer');
    expect(links[0].issueNumber).toBe(36);
    expect(links[0].issueTitle).toBe('GitHub integration');
    expect(links[0].issueUrl).toBe('https://github.com/nigoh/Timer/issues/36');
    expect(links[0].id).toBeTruthy();
    expect(links[0].createdAt).toBeTruthy();
  });

  it('addLink appends multiple links to the same timeLogId', () => {
    const store = useIntegrationLinkStore.getState();
    store.addLink('log-1', {
      owner: 'owner1', repo: 'repo1', issueNumber: 1,
      issueUrl: 'https://github.com/owner1/repo1/issues/1',
    });
    store.addLink('log-1', {
      owner: 'owner2', repo: 'repo2', issueNumber: 2,
      issueUrl: 'https://github.com/owner2/repo2/issues/2',
    });

    const links = useIntegrationLinkStore.getState().getLinks('log-1');
    expect(links).toHaveLength(2);
  });

  it('addLink does not affect other timeLogIds', () => {
    const store = useIntegrationLinkStore.getState();
    store.addLink('log-1', {
      owner: 'nigoh', repo: 'Timer', issueNumber: 36,
      issueUrl: 'https://github.com/nigoh/Timer/issues/36',
    });

    expect(useIntegrationLinkStore.getState().getLinks('log-2')).toHaveLength(0);
  });

  it('removeLink removes the correct link by id', () => {
    const store = useIntegrationLinkStore.getState();
    store.addLink('log-1', {
      owner: 'nigoh', repo: 'Timer', issueNumber: 36,
      issueUrl: 'https://github.com/nigoh/Timer/issues/36',
    });
    store.addLink('log-1', {
      owner: 'nigoh', repo: 'Timer', issueNumber: 37,
      issueUrl: 'https://github.com/nigoh/Timer/issues/37',
    });

    const linkId = useIntegrationLinkStore.getState().getLinks('log-1')[0].id;
    useIntegrationLinkStore.getState().removeLink('log-1', linkId);

    const links = useIntegrationLinkStore.getState().getLinks('log-1');
    expect(links).toHaveLength(1);
    expect(links[0].issueNumber).toBe(37);
  });

  it('removeLink on unknown id does not throw', () => {
    const store = useIntegrationLinkStore.getState();
    expect(() => store.removeLink('log-1', 'nonexistent-id')).not.toThrow();
    expect(store.getLinks('log-1')).toHaveLength(0);
  });

  it('getLinks returns empty array for unknown timeLogId', () => {
    expect(useIntegrationLinkStore.getState().getLinks('unknown')).toEqual([]);
  });

  it('setGithubPat stores the PAT in memory', () => {
    const store = useIntegrationLinkStore.getState();
    store.setGithubPat('ghp_test123');
    expect(useIntegrationLinkStore.getState().githubPat).toBe('ghp_test123');
  });

  it('setGithubPat can be cleared with null', () => {
    const store = useIntegrationLinkStore.getState();
    store.setGithubPat('ghp_test123');
    store.setGithubPat(null);
    expect(useIntegrationLinkStore.getState().githubPat).toBeNull();
  });

  it('setAiProviderConfig stores config in memory', () => {
    const store = useIntegrationLinkStore.getState();
    store.setAiProviderConfig({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-test',
      temperature: 0.7,
    });

    expect(useIntegrationLinkStore.getState().aiProviderConfig?.provider).toBe('openai');
  });
});
