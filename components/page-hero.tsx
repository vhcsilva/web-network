import { GetStaticProps } from "next";
import {ReactElement, useContext, useEffect, useState} from 'react';
import {ApplicationContext} from '@contexts/application';
import {formatNumberToCurrency} from 'helpers/formatNumber'
import {BeproService} from '@services/bepro-service';
import Translation from "@components/translation";
import useNetwork from "@x-hooks/use-network";

interface PageHeroProps {
  title?: string | ReactElement
}

export default function PageHero({ title = <Translation label={'heroes.find-bounties-to-work'} /> } : PageHeroProps) {

  const {state: {beproInit}} = useContext(ApplicationContext)
  const [inProgress, setInProgress] = useState(0)
  const [closed, setClosed] = useState(0)
  const [onNetwork, setOnNetwork] = useState(0)
  const { network } = useNetwork()

  function loadTotals() {
    if (!beproInit || !network)
      return;


    BeproService.getClosedIssues(network.networkAddress).then(setClosed);
    BeproService.getOpenIssues(network.networkAddress).then(setInProgress);
    BeproService.getTokensStaked(network.networkAddress).then(setOnNetwork);

  }

  useEffect(loadTotals, [beproInit, network]);

  return (
    <div className={`banner bg-bepro-blue mb-0`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="d-flex flex-column">
              <h2>{title}</h2>
              <div className="row">
                <div className="col-md-3">
                  <div className="top-border">
                    <h4>{inProgress}</h4>
                    <span className="caption-small"><Translation label={'heroes.in-progress'} /></span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="top-border">
                    <h4>{closed}</h4>
                    <span className="caption-small"><Translation label={'heroes.bounties-closed'} /></span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="top-border">
                    <h4>
                      {formatNumberToCurrency(onNetwork)}{" "}
                      <span className="caption-small trans"><Translation label={'$bepro'} /></span>
                    </h4>
                    <span className="caption-small"><Translation label={'heroes.bounties-in-network'} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};
