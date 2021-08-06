import { GetStaticProps } from "next";
import React, {useContext, useEffect, useState} from 'react';
import PageHero from "../components/page-hero";
import GithubMicroService from "../services/github-microservice";
import ListIssues from "../components/list-issues";
import ReactSelect from "../components/react-select";
import {ApplicationContext} from '../contexts/application';
import {changeLoadState} from '../contexts/reducers/change-load-state';
import {IssueData} from '../interfaces/issue-data';

type Filter = {
  label: string;
  value: string;
  emptyState: string;
};

type FiltersByIssueState = Filter[];

const filtersByIssueState: FiltersByIssueState = [
  {
    label: "All issues",
    value: 'all',
    emptyState: 'Issues not found'
  },
  {
    label: 'Open issues',
    value: 'open',
    emptyState: 'Open issues not found'
  },
  {
    label: 'Draft issues',
    value: 'draft',
    emptyState: 'Draft issues not found'
  },
  {
    label: 'Closed issues',
    value: 'closed',
    emptyState: 'Closed issues not found'
  }
];

const options_time = [
  {
    value: "All time",
    label: "All time",
  },
];

export default function PageDevelopers() {
  const {dispatch, state: {loading}} = useContext(ApplicationContext);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [filterByState, setFilterByState] = useState<Filter>(filtersByIssueState[0]);

  function handleChangeFilterByState(filter: Filter) {
    setFilterByState(filter);
  }

  function updateIssuesList(issues: IssueData[]) {
    console.log(`got issues`, issues);
    setIssues(issues);
  }

  function getIssues() {
    dispatch(changeLoadState(true))
    GithubMicroService.getIssues()
                      .then(updateIssuesList)
                      .catch((error) => {
                        console.log('Error', error)
                      })
                      .finally(() => {
                        dispatch(changeLoadState(false))
                      });
  }

  useEffect(getIssues, []);

  return (<>
    <div>
      <PageHero title="Find issue to work"/>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="d-flex justify-content-between mb-4">
              <div className="col-md-3">
                <ReactSelect
                  id="filterIssue"
                  className="react-select-filterIssues"
                  defaultValue={options_issue[0]}
                  options={options_issue}
                  onChange={handleChangeFilterIssue}
                />
              </div>
              <div className="col-md-3">
                <ReactSelect
                  id="filterTime"
                  className="react-select-filterIssues trans"
                  defaultValue={options_time[0]}
                  options={options_time}
                  isDisabled
                />
              </div>
            </div>
          </div>
          <ListIssues listIssues={filterStateIssues.issues} />
          {filterStateIssues.issues.length === 0 && !loading ? (
            <div className="col-md-10">
              <h4>
                {filterStateIssues.state !== "all"
                  ? filterStateIssues.state
                  : null}{" "}
                issues not found
              </h4>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  </>);
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};
