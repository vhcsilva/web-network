import {ReposList} from '@interfaces/repos-list';
import {BranchInfo, BranchsList} from '@interfaces/branchs-list';
import { head } from 'lodash';
import { PaginatedData } from '@interfaces/paginated-data';
import {ProposalData, User} from '@interfaces/api-response';
import {IssueData, pullRequest} from '@interfaces/issue-data';

import client from '@services/api'
import { Network } from '@interfaces/network';
interface Paginated<T = any> {
  count: number;
  rows: T[]
}

interface NewIssueParams {
  title: string,
  description: string,
  amount: number,
  creatorAddress: string,
  creatorGithub: string,
  repository_id: string,
}

const repoList: ReposList = [];
const branchsList: BranchsList = {};

export default function useApi() {

  async function getIssues(page = '1',
                           repoId = '',
                           time = ``,
                           state = ``,
                           sortBy = 'updatedAt',
                           order = 'DESC',
                           address = ``,
                           creator = ``,
                           networkName = 'bepro') {
    const search = new URLSearchParams({address, page, repoId, time, state, sortBy, order, creator, networkName}).toString();
    return client.get<{rows: IssueData[], count: number}>(`/issues/?${search}`)
                 .then(({data}) => data)
                 .catch(() => ({rows: [], count: 0}));
  }

  async function searchIssues({page = '1',
                           repoId = '',
                           time = ``,
                           state = ``,
                           sortBy = 'updatedAt',
                           order = 'DESC',
                           address = ``,
                           creator = ``,
                           search = '',
                           pullRequester = '',
                           networkName = 'bepro'}) {
    const params = new URLSearchParams({address, page, repoId, time, state, sortBy, order, creator, search, pullRequester, networkName}).toString();
    return client.get<{rows: IssueData[], count: number, pages: number, currentPage: number}>(`/search/issues/?${params}`)
                 .then(({data}) => data)
                 .catch(() => ({rows: [], count: 0, pages: 0, currentPage: 1}));
  }

  async function getIssue(repoId: string, ghId: string, networkName = 'bepro') {
    return client.get<IssueData>(`/issue/${repoId}/${ghId}/${networkName}`)
                 .then(({data}) => data)
                 .catch(() => null);
  }

  async function createIssue(payload: NewIssueParams, networkName = 'bepro') {
    return client.post<number>(`/issue`, {...payload, networkName})
                 .then(({data}) => data)
                 .catch(() => null);
  }

  async function moveIssueToOpen(scIssueId?: string) {
    return client.post(`/past-events/move-to-open`, {scIssueId})
                 .then(({data}) => data)
                 .catch(() => null);
  }

  async function patchIssueWithScId(repoId, githubId, scId, networkName = 'bepro') {
    return client.patch(`/issue`, {repoId, githubId, scId, networkName})
                 .then(({data}) => data === `ok`)
                 .catch(_ => false)
  }

  async function getPendingFor(address: string, page = '1', networkName = 'bepro') {
    const search = new URLSearchParams({address, page, state: `pending`, networkName}).toString()
    return client.get<IssueData[]>(`/issues/?${search}`)
                 .then(({data}) => data)
                 .catch(() => null);
  }

  async function getMergeProposal(dbId: string,) {
    return client.get<ProposalData>(`/merge-proposal/${dbId}/`)
                 .then(({data}) => data)
                 .catch(() => ({scMergeId: '', pullRequestId: '', issueId: '', id: ''}))
  }

  async function createPullRequestIssue(repoId: string, githubId: string, payload: {title: string; description: string; username: string; branch: string}, networkName = 'bepro') {
    return client.post(`/pull-request/`, {...payload, repoId, githubId, networkName})
                 .then(() => true)
                 .catch((error) => {
                   throw error
                 })
  }
  async function getPullRequestIssue(issueId: string, page = '1') {
    const search = new URLSearchParams({issueId, page}).toString();
    return client.get<PaginatedData<pullRequest>>(`/pull-request?${search}`)
                 .then(({data: {rows}}) => head(rows))
                 .catch(e => {
                   console.log(`Failed to fetch PR information`, e);
                   return null;
                 });
  }

  async function createGithubData(payload: {githubHandle: string, githubLogin: string, accessToken: string}): Promise<boolean> {
    return client.post<string>(`/users/connect`, payload)
                 .then(({data, status}) => {
                   return data === `ok`
                 })
                 .catch((error) => {
                   if (error.response?.status === 302)
                     return true;

                   if (error.response?.data)
                     return error.response?.data;

                   return false;
                 });
  }

  async function joinAddressToUser(githubHandle: string, payload: {address: string, migrate?: boolean}): Promise<boolean> {
    return client.patch<string>(`/user/connect/${githubHandle}`, payload)
                 .then(() => true)
                 .catch((error) => {
                   if (error.response)
                     return error.response.data;

                   return `Unknown error. Check logs.`;
                 });
  }

  async function getUserWith(login: string): Promise<User> {
    return client.post<User[]>(`/search/users/login/`, [login])
                 .then(({data}) => data[0] || {} as User)
                 .catch(() => ({} as User))
  }

  async function getUserOf(address: string): Promise<User> {
    return client.post<User[]>(`/search/users/address/`, [address])
                 .then(({data}) => data[0])
                 .catch(() => ({} as User))
  }

  async function getAddressesOf(users: string[]) {
    if (!users.length)
      return [];

    return client.post<User[]>(`/search/users/login`, users)
                 .then(({data}) => data)
                 .catch(_ => [])
  }

  async function setIssueGitHubId(issueGitId: string, scIssueId) {
    return client.patch(`/issue/scId/${issueGitId}/${scIssueId}`)
                 .then(({data}) => data === `ok`)
                 .catch(() => false)
  }

  async function getAllUsers(payload: {page: number,} = {page: 1}) {
    return client.post<User[]>(`/search/users/`, payload)
                 .then(({data}) => data)
                 .catch(() => []);
  }

  async function createRepo(owner, repo, networkName = 'bepro') {
    return client.post(`/repos/`, {owner, repo})
                 .then(({status}) => status === 200)
                 .catch((e) => {
                   console.error(`Failed to create repo`, e)
                   return false;
                 })
  }

  async function getReposList(force = false, networkName = 'bepro') {
    const search = new URLSearchParams({networkName}).toString();

    if (!force && repoList.length)
      return Promise.resolve(repoList as ReposList);

    return client.get<ReposList>(`/repos?${search}`)
                 .then(({data}) => data)
                 .catch(() => []);
  }

  async function getBranchsList(repoId: string | number, force = false, networkName = 'bepro') {
    if (!force && branchsList[repoId]?.length)
      return Promise.resolve(branchsList[repoId] as BranchInfo[]);

    return client.get<BranchInfo[]>(`/repos/branchs/${repoId}/${networkName}`)
                 .then(({data}) => {
                  branchsList[repoId] = data;
                   return data
                  })
                 .catch(() => []);
  }

  async function removeRepo(id: string) {
    return client.delete(`/repos/${id}`)
                 .then(({status}) => status === 200)
                 .catch(() => false);
  }

  async function poll(eventName: string, rest, networkName = 'bepro') {
    return client.post(`/poll/`, {eventName, ...rest, networkName})
  }

  async function waitForMerge(githubLogin, issue_id, currentGithubId, networkName = 'bepro') {
    return poll('mergeProposal', {githubLogin, issue_id, currentGithubId}, networkName)
                 .then(({data}) => data)
                 .catch(() => null)
  }

  async function waitForClose(currentGithubId, networkName = 'bepro') {
    return poll(`closeIssue`, {currentGithubId}, networkName)
                 .then(({data}) => data)
                 .catch(() => null)
  }

  async function waitForRedeem(currentGithubId, networkName = 'bepro') {
    return poll(`redeemIssue`, {currentGithubId}, networkName)
                 .then(({data}) => data)
                 .catch(() => null)
  }

  async function processEvent(eventName, fromBlock: number, id: number, pullRequestId = '', networkName = 'bepro') {
    return client.post(`/past-events/${eventName}/`, {fromBlock, id, pullRequestId, networkName})
  }

  async function processMergeProposal(fromBlock, id) {
    return client.post(`/past-events/merge-proposal/`, {fromBlock, id})
  }

  async function getHealth() {
    return client.get(`/health`)
                 .then(({status}) => status === 204)
                 .catch(e => false);
  }

  async function getClientNation() {
    return client.get(`/ip`)
                 .then(({data}) => data || ({countryCode: `US`, country: ``}))
                 .catch(e => {
                   return ({countryCode: `US`, country: ``})
                 });
  }

  async function userHasPR(issueId: string, login: string, networkName = 'bepro') {
    const search = new URLSearchParams({issueId, login, page: '1', networkName}).toString();
    return client.get<PaginatedData<pullRequest>>(`/pull-request?${search}`)
                 .then(({data: {count}}) => count > 0)
                 .catch(e => {
                   console.log(`Failed to fetch PR information`, e);
                   return false;
                 });

  }

  async function getUserPullRequests(page= '1', login: string, networkName = 'bepro') {
    const search = new URLSearchParams({page, login, networkName}).toString();
    
    return client.get<PaginatedData<pullRequest>>(`/pull-request?${search}`)
                 .then(({data}) => data)
                 .catch(e => {
                   console.log(`Failed to fetch PR information`, e);
                   return false;
                 });
  }

  async function startWorking(issueId: string, githubLogin: string, networkName = 'bepro') {
    return client.put('/issue/working',  { issueId, githubLogin, networkName })
                .then((response) => response)
                .catch(error => {
                  throw error
                })
  }

  async function mergeClosedIssue(issueId: string, pullRequestId: string, mergeProposalId: string, address: string, networkName = 'bepro') {
    return client.post('/pull-request/merge', { issueId, pullRequestId, mergeProposalId, address, networkName })
      .then(response => response)
      .catch(error => {
        throw error
      })
  }

  async function createReviewForPR(issueId: string, pullRequestId: string,  githubLogin: string, body:string, networkName = 'bepro') {
    return client.put('/pull-request/review', {issueId, pullRequestId, githubLogin, body, networkName})
    .then(response => response)
  }
  
  async function removeUser(address: string, githubLogin: string) {
    return client.delete(`/user/${address}/${githubLogin}`)
    .then(({status}) => status === 200)
  }
  
  async function createNetwork(networkInfo) {
    return client.post('/network', {...networkInfo})
    .then(response => response)
      .catch(error => {
        throw error
      })
  }

  async function getNetwork(name: string) {
    const search = new URLSearchParams({name}).toString();

    return client.get<Network>(`/network?${search}`)
      .then(response => response)
      .catch(error => {
        throw error
      })
  }

  async function searchNetworks({page = '1',
                           name = ``,
                           creatorAddress = ``,
                           networkAddress = ``,
                           sortBy = 'updatedAt',
                           order = 'DESC',
                           search = ''}) {
    const params = new URLSearchParams({page, name, creatorAddress, networkAddress, sortBy, order, search}).toString()

    return client.get<{rows: Network[], count: number, pages: number, currentPage: number}>(`/search/networks/?${params}`)
                 .then(({data}) => data)
                 .catch(() => ({rows: [], count: 0, pages: 0, currentPage: 1}));
  }

  return {
    removeUser,
    getIssue,
    getReposList,
    getBranchsList,
    getIssues,
    getHealth,
    getClientNation,
    getUserOf,
    getUserWith,
    getPendingFor,
    createPullRequestIssue,
    getPullRequestIssue,
    createIssue,
    moveIssueToOpen,
    patchIssueWithScId,
    waitForMerge,
    processMergeProposal,
    processEvent,
    getMergeProposal,
    joinAddressToUser,
    getAllUsers,
    createRepo,
    removeRepo,
    waitForClose,
    waitForRedeem,
    userHasPR,
    startWorking,
    mergeClosedIssue,
    getUserPullRequests,
    createReviewForPR,
    searchIssues,
    createNetwork,
    getNetwork,
    searchNetworks
  }
}
