import Link from 'next/link'
import { useContext } from 'react'
import { useRouter } from 'next/router'

import LockedIcon from '@assets/icons/locked-icon'

import Button from '@components/button'
import Avatar from '@components/avatar'
import Translation from '@components/translation'

import { ApplicationContext } from '@contexts/application'
import Translation from './translation'
import PullRequestLabels, { PRLabel } from './pull-request-labels'

import { formatDate } from '@helpers/formatDate'

import useNetwork from '@x-hooks/use-network'

export default function PullRequestItem({ repoId, issueId, pullRequest }) {
  const router = useRouter()

  const { getURLWithNetwork } = useNetwork()

  const {
    state: { githubLogin }
  } = useContext(ApplicationContext)

  function handleReviewClick() {
    router.push(
      getURLWithNetwork('/pull-request', {
        repoId,
        issueId,
        prId: pullRequest.githubId,
        review: true
      })
    )
  }

  function canReview() {
    return pullRequest?.state === 'open' && !!githubLogin
  }

  function getLabel(): PRLabel{
    if(pullRequest.merged) return 'merged';
    if(pullRequest.isMergeable) return 'ready to merge';
    //isMergeable can be null;
    if(pullRequest.isMergeable === false) return 'conflicts';
  }

  const label = getLabel()
  
  return (
    <>
      <div className="content-list-item proposal">
        <Link
          passHref
          href={getURLWithNetwork('/pull-request', {
            repoId,
            issueId,
            prId: pullRequest.githubId
          })}
        >
          <a className="text-decoration-none text-white">
            <div className="row align-items-center pl-1 pr-1">
              <div className="col-7 d-flex align-items-center caption-small text-uppercase text-white">
                <Avatar userLogin={pullRequest?.githubLogin} />
                <span className="ml-2">
                  #{pullRequest?.githubId} <Translation label={'misc.by'} /> @
                  {pullRequest?.githubLogin}
                </span>
                <div className='ml-3 d-flex'>
                  {label && <PullRequestLabels label={label}/>}
                </div>
              </div>

              <div className="col-2 caption-small text-uppercase text-white d-flex justify-content-center">
                {formatDate(pullRequest?.createdAt)}
              </div>

              <div className="col-2 caption-small text-uppercase text-white d-flex justify-content-center">
                <Translation
                  ns="pull-request"
                  label="review"
                  params={{ count: pullRequest?.comments?.length || 0 }}
                />
              </div>

              <div className="col-1 d-flex justify-content-center">
                <Button
                  disabled={!canReview()}
                  onClick={(ev) => {
                    ev.preventDefault()
                    handleReviewClick()
                  }}
                >
                  {!canReview() && <LockedIcon className="me-2" />}
                  <span>
                    <Translation label="actions.review" />
                  </span>
                </Button>
              </div>
            </div>
          </a>
        </Link>
      </div>
    </>
  )
}
