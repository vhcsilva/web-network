import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Avatar from '@components/avatar'
import GithubInfo from '@components/github-info'
import InternalLink from '@components/internal-link'

import useNetwork from '@x-hooks/use-network'
import useRepos from '@x-hooks/use-repos'

export default function PullRequestHero({
  githubId,
  title,
  pullRequestId,
  authorPullRequest,
  createdAt,
  beproStaked
}) {
  const router = useRouter()
  const { issueId: issueCID } = router.query
  const [repoId, issueId] = (issueCID as string).split(`/`)
  const [[activeRepo]] = useRepos()
  const { t } = useTranslation(['common', 'pull-request'])
  const { getURLWithNetwork } = useNetwork()

  return (
    <div className="banner bg-bepro-blue mb-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center cursor-pointer text-truncate">
                <InternalLink
                  iconBefore={true}
                  href={getURLWithNetwork('/bounty', { id: issueId, repoId })}
                  icon={<i className="ico-back me-2" />}
                  label={`#${githubId} ${title}`}
                  className="p-nm caption"
                  transparent
                />
              </div>
              <div className="row">
                <div className="col-md-9">
                  <div className="top-border">
                    <h1 className="h4 mb-3">{t('pull-request:label')} #{pullRequestId}</h1>
                    <div className="d-flex align-items-center flex-wrap justify-content-center justify-content-md-start">
                      <span className="caption-small text-gray mr-2">
                        {t('misc.created-at')} {createdAt}
                      </span>

                      <GithubInfo
                        parent="hero"
                        variant="repository"
                        label={activeRepo?.githubPath?.split('/')[1]}
                      />

                      <span className="caption-small text-gray ml-2 mr-2">{t('misc.by')}</span>

                      <GithubInfo
                        parent="hero"
                        variant="user"
                        label={`@${authorPullRequest}`}
                      />

                      <Avatar className="ml-2" userLogin={authorPullRequest} />
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="banner-highlight">
                    <h4 className="h4 mb-0">
                      {beproStaked}{' '}
                      <span className="p-small trans">{t('$bepro')}</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}
  }
}
