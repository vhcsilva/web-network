import React, {useEffect, useState} from "react";

import {useTranslation} from "next-i18next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {useRouter} from "next/router";
import {GetServerSideProps} from "next/types";

import BountyHero from "components/bounty-hero";
import FundingSection from "components/bounty/funding-section";
import CustomContainer from "components/custom-container";
import IssueComments from "components/issue-comments";
import IssueDescription from "components/issue-description";
import IssueProposalProgressBar from "components/issue-proposal-progress-bar";
import IssueProposals from "components/issue-proposals";
import IssuePullRequests from "components/issue-pull-requests";
import PageActions from "components/page-actions";
import TabbedNavigation from "components/tabbed-navigation";

import {TabbedNavigationItem} from "interfaces/tabbed-navigation";

import useOctokit from "x-hooks/use-octokit";

import {useAppState} from "../../contexts/app-state";
import {BountyProvider, useBounty} from "../../x-hooks/use-bounty";
import {useRepos} from "../../x-hooks/use-repos";

export default function PageIssue() {
  useBounty();
  const router = useRouter();
  const { t } = useTranslation("bounty");

  const [commentsIssue, setCommentsIssue] = useState([]);
  const [isRepoForked, setIsRepoForked] = useState(false);

  const {state} = useAppState();

  const { getUserRepositories } = useOctokit();
  const {updateActiveRepo} = useRepos()

  const { id, repoId } = router.query;
  updateActiveRepo(repoId);

  const proposalsCount = state.currentBounty?.chainData?.proposals?.length || 0;
  const pullRequestsCount = state.currentBounty?.chainData?.pullRequests?.length || 0;

  const tabs: TabbedNavigationItem[] = [
    {
      isEmpty: !proposalsCount,
      eventKey: "proposals",
      title: t("proposal:labelWithCount", { count: proposalsCount }),
      description: t("description_proposal"),
      component: ( <IssueProposals key="tab-proposals" /> )
    },
    {
      isEmpty: !pullRequestsCount,
      eventKey: "pull-requests",
      title: t("pull-request:labelWithCount", { count: pullRequestsCount }),
      description: t("description_pull-request"),
      component: ( <IssuePullRequests key="tab-pull-requests" /> )

    }
  ];

  function addNewComment(comment) {
    setCommentsIssue([...commentsIssue, comment]);
  }

  useEffect(() => {
    if (state.currentBounty?.comments) setCommentsIssue([...state.currentBounty?.comments || []]);
  }, [ state.currentBounty?.data, state.Service?.network?.repos?.active ]);

  useEffect(() => {
    if (!state.currentUser?.login ||
        !state.Service?.network?.repos?.active ||
        !state.currentBounty?.data) 
      return;

    if (state.currentBounty?.data?.working?.includes(state.currentUser?.login))
      return setIsRepoForked(true);
    
    getUserRepositories(state.currentUser?.login)
      .then((repos) => {

        console.log(`REPOS`, repos);

        const isFork = repo => repo.isFork ? 
          repo.parent.nameWithOwner === state.Service?.network?.repos?.active.githubPath : false;

        const isForked = 
          !!repos.find(repo => isFork(repo) || repo.nameWithOwner === state.Service?.network?.repos?.active.githubPath);

        setIsRepoForked(isForked);
      })
      .catch((e) => {
        console.log("Failed to get users repositories: ", e);
      });
  }, [state.currentUser?.login,
      state.currentUser?.walletAddress,
      id,
      state.currentBounty?.data,
      state.Service?.network?.repos?.active]);

  return (
    <BountyProvider>
      <BountyHero />

      { state.currentBounty?.chainData?.isFundingRequest && <FundingSection /> }

      <PageActions
        isRepoForked={isRepoForked}
        addNewComment={addNewComment}
      />

      {((!!proposalsCount || !!pullRequestsCount) && state.currentUser?.walletAddress ) &&
          <CustomContainer className="mb-4">
            <TabbedNavigation
              className="issue-tabs"
              tabs={tabs}
              collapsable
            />
          </CustomContainer>
      }

      { state.currentUser?.walletAddress ? (
        <div className="container mb-1">
          <div className="d-flex bd-highlight justify-content-center mx-2 px-4">
            <div className="ps-3 pe-0 ms-0 me-2 w-65 bd-highlight">
              <div className="container">
                <IssueDescription description={state.currentBounty?.data?.body || ""} />
              </div>
            </div>
            <div className="p-0 me-3 flex-shrink-0 w-25 bd-highlight">
              <div className="sticky-bounty">
                <IssueProposalProgressBar />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CustomContainer>
          <IssueDescription description={state.currentBounty?.data?.body || ""} />
        </CustomContainer>
      )}

      <IssueComments
        comments={commentsIssue}
        repo={state.currentBounty?.data?.repository?.githubPath}
        issueId={id}
      />
    </BountyProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        "common",
        "bounty",
        "proposal",
        "pull-request",
        "connect-wallet-button",
        "funding"
      ]))
    }
  };
};
