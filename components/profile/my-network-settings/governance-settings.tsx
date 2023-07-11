import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

import { useTranslation } from "next-i18next";

import Card from "components/card";
import CopyButton from "components/common/buttons/copy/controller";
import ContractButton from "components/contract-button";
import AmountCard from "components/custom-network/amount-card";
import NetworkContractSettings from "components/custom-network/network-contract-settings";
import If from "components/If";
import TokensSettings from "components/profile/my-network-settings/tokens-settings";
import ResponsiveWrapper from "components/responsive-wrapper";

import { useAppState } from "contexts/app-state";
import { useNetworkSettings } from "contexts/network-settings";
import { toastError, toastSuccess } from "contexts/reducers/change-toaster";

import { IM_AM_CREATOR_NETWORK, LARGE_TOKEN_SYMBOL_LENGTH } from "helpers/constants";

import { StandAloneEvents } from "interfaces/enums/events";
import { Network } from "interfaces/network";
import { Token } from "interfaces/token";

import useApi from "x-hooks/use-api";
import { useAuthentication } from "x-hooks/use-authentication";
import useBepro from "x-hooks/use-bepro";
import { useNetwork } from "x-hooks/use-network";

interface GovernanceProps {
  address: string;
  tokens: Token[];
  network: Network;
  updateEditingNetwork: () => void;
}

export default function GovernanceSettings({
  network,
  tokens,
  address,
  updateEditingNetwork
}: GovernanceProps) {
  const { t } = useTranslation(["common", "custom-network"]);

  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [networkToken, setNetworkToken] = useState<Token[]>();
  
  const {state, dispatch} = useAppState();
  const { updateActiveNetwork } = useNetwork();
  const { updateNetwork, processEvent } = useApi();
  const { updateWalletBalance, signMessage } = useAuthentication();
  const { handleCloseNetwork, handleChangeNetworkParameter } = useBepro();
  const {
    settings,
    tokens: settingsTokens,
    isAbleToClosed,
    forcedNetwork,
  } = useNetworkSettings();

  const symbol = forcedNetwork?.networkToken?.symbol
  const networkTokenSymbol =
    symbol?.length > LARGE_TOKEN_SYMBOL_LENGTH
      ? `${symbol.slice(0, LARGE_TOKEN_SYMBOL_LENGTH)}...`
      : symbol;

  const NetworkAmount = (title, description, amount, fixed = undefined) => ({
    title,
    description,
    amount,
    fixed
  });

  const networkAmounts = [
    NetworkAmount(t("custom-network:oracles-staked", { symbol: networkTokenSymbol, }),
                  t("custom-network:oracles-staked-description"),
                  forcedNetwork?.tokensLocked || 0),
    NetworkAmount(t("custom-network:open-bounties"),
                  t("custom-network:open-bounties-description"),
                  state.Service?.network?.active?.totalOpenIssues || 0,
                  0),
    NetworkAmount(t("custom-network:total-bounties"),
                  t("custom-network:total-bounties-description"),
                  state.Service?.network?.active?.totalIssues || 0,
                  0),
  ];

  const isCurrentNetwork = (!!network &&
    !!state.Service?.network?.active &&
    network?.networkAddress === state.Service?.network?.active?.networkAddress)

  function handleCloseMyNetwork() {
    if (
      !state.Service?.network?.active ||
      !state.currentUser?.login ||
      !state.currentUser?.accessToken ||
      !state.currentUser?.walletAddress ||
      !state.Service?.active
    )
      return;

    setIsClosing(true);

    handleCloseNetwork()
      .then(() => {
        return signMessage(IM_AM_CREATOR_NETWORK).then(async () => updateNetwork({
          githubLogin: state.currentUser.login,
          isClosed: true,
          creator: state.currentUser.walletAddress,
          networkAddress: network?.networkAddress,
          accessToken: state.currentUser?.accessToken,
        }))
      })
      .then(() => {
        updateWalletBalance(true);

        if (isCurrentNetwork) updateActiveNetwork(true);

        return updateEditingNetwork();
      })
      .then(() =>
        dispatch(toastSuccess(t("custom-network:messages.network-closed"),
                              t("actions.success"))))
      .catch((error) =>
        dispatch(toastError(t("custom-network:errors.failed-to-close-network", { error }),
                            t("actions.failed"))))
      .finally(() => {
        setIsClosing(false);
      });
  }

  async function handleSubmit() {
    if (
      !state.currentUser?.walletAddress ||
      !state.Service?.active ||
      !forcedNetwork ||
      forcedNetwork?.isClosed ||
      isClosing
    )
      return;

    setIsUpdating(true);

    const {
      parameters: {
        draftTime: { value: draftTime },
        disputableTime: { value: disputableTime },
        councilAmount: { value: councilAmount },
        percentageNeededForDispute: { value: percentageForDispute },
      },
    } = settings;

    const networkAddress = network?.networkAddress;
    const failed = [];
    const success = {};

    const promises = await Promise.allSettled([
      ...(draftTime !== forcedNetwork.draftTime
        ? [
            handleChangeNetworkParameter("draftTime",
                                         draftTime,
                                         networkAddress)
              .then(() => ({ param: "draftTime", value: draftTime })),
        ]
        : []),
      ...(disputableTime !== forcedNetwork.disputableTime
        ? [
            handleChangeNetworkParameter("disputableTime",
                                         disputableTime,
                                         networkAddress)
              .then(() => ({ param: "disputableTime", value: disputableTime })),
        ]
        : []),
      ...(councilAmount !== +forcedNetwork.councilAmount
        ? [
            handleChangeNetworkParameter("councilAmount",
                                         councilAmount,
                                         networkAddress)
              .then(() => ({ param: "councilAmount", value: councilAmount })),
        ]
        : []),
      ...(percentageForDispute !== forcedNetwork.percentageNeededForDispute
        ? [
            handleChangeNetworkParameter("percentageNeededForDispute",
                                         percentageForDispute,
                                         networkAddress)
              .then(() => ({ param: "percentageNeededForDispute", value: percentageForDispute })),
        ]
        : []),
    ]);

    promises.forEach((promise) => {
      if (promise.status === "fulfilled") success[promise.value.param] = promise.value.value;
      else failed.push(promise.reason);
    });

    if (failed.length) {
      dispatch(toastError(t("custom-network:errors.updated-parameters", {
            failed: failed.length,
      }),
                          t("custom-network:errors.updating-values")));
      console.error(failed);
    }

    const successQuantity = Object.keys(success).length;

    if (successQuantity) {
      if(draftTime !== forcedNetwork.draftTime)
        Promise.all([
          await processEvent(StandAloneEvents.UpdateBountiesToDraft),
          await processEvent(StandAloneEvents.BountyMovedToOpen)
        ]);

      await processEvent(StandAloneEvents.UpdateNetworkParams)
        .catch(error => console.debug("Failed to update network parameters", error));

      dispatch(toastSuccess(t("custom-network:messages.updated-parameters", {
          updated: successQuantity,
          total: promises.length,
      })));
    }

    const json = {
      creator: state.currentUser.walletAddress,
      githubLogin: state.currentUser.login,
      networkAddress: network.networkAddress,
      accessToken: state.currentUser.accessToken,
      allowedTokens: {
       transactional: settingsTokens?.allowedTransactions?.map((token) => token?.id).filter((v) => v),
       reward: settingsTokens?.allowedRewards?.map((token) => token?.id).filter((v) => v)
      }
    };

    const handleError = (error) => {
      dispatch(toastError(t("custom-network:errors.failed-to-update-network", { error }),
                          t("actions.failed")));
      console.log(error);
    }

    signMessage(IM_AM_CREATOR_NETWORK)
      .then(async () => {
        await updateNetwork(json)
          .then(async () => {
            if (isCurrentNetwork) updateActiveNetwork(true);

            return updateEditingNetwork();
          })
          .then(() => {
            dispatch(toastSuccess(t("custom-network:messages.refresh-the-page"),
                                  t("actions.success")));
          })
          .catch(handleError);
      })
      .catch(handleError)
      .finally(() => setIsUpdating(false));
  }

  function SubmitButton({ isMobile = false }) {
    return(
      <If condition={settings?.validated}>
        <Col 
          xs={isMobile ? "12" : "auto"}
          className={isMobile ? "d-block d-xl-none" : "d-none d-xl-block"}
        >
          <Row className="mx-0">
            <ContractButton
              disabled={!settings?.validated || isUpdating || forcedNetwork?.isClosed || isClosing}
              onClick={handleSubmit}
            >
              {t("misc.save-changes")}
            </ContractButton>
          </Row>
        </Col>
      </If>
    );
  }

  useEffect(() => {
    if(tokens.length > 0) setNetworkToken(tokens.map((token) => ({
      ...token,
      isReward: !!token.network_tokens.isReward,
      isTransactional: !!token.network_tokens.isTransactional
    })));
  }, [tokens]);

  useEffect(() => {
    updateActiveNetwork(true);
  }, []);

  return (
    <>
      <Row className="align-items-center mt-4 pt-2">
        <Col>
          <span className="caption-medium font-weight-medium text-white text-capitalize">
            {t("custom-network:network-info")}
          </span>
        </Col>

        <SubmitButton />
      </Row>

      <Row className="mt-3 gy-3">
        {networkAmounts.map((amount) => (
          <Col 
            key={amount.title}
            xs="12"
            md="4"
          >
            <AmountCard {...amount} />
          </Col>
        ))}
      </Row>

      <Row className="mt-3 gy-3 align-items-end justify-content-between">
        <Col xs="12" md="auto">
          <label className="caption-small font-weight-medium text-capitalize">
            {t("custom-network:network-address")}
          </label>

          <Card bodyClassName="py-1 px-2">
            <Row className=" justify-content-between align-items-center gx-2">
              <Col xs="auto">
                <span className="caption-medium text-capitalize font-weight-normal text-gray-50">
                  {address}
                </span>
              </Col>

              <Col xs="auto">
                <CopyButton
                  value={address}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs="12" md="auto">
          <Row className="mx-0">
            <ContractButton
              color="dark-gray"
              disabled={!isAbleToClosed || isClosing || !state.currentUser?.login}
              withLockIcon={!isAbleToClosed || !state.currentUser?.login}
              onClick={handleCloseMyNetwork}
              isLoading={isClosing}
            >
              <span>{t("custom-network:close-network")}</span>
            </ContractButton>
          </Row>
        </Col>
      </Row>
      
      <Row className="mt-4 gy-3">
        <TokensSettings defaultSelectedTokens={networkToken} />
      </Row>

      <div className="mt-4">
        <span className="caption-medium font-weight-medium text-white text-capitalize">
          {t("custom-network:steps.network-settings.fields.other-settings.title")}
        </span>

        <NetworkContractSettings />
      </div>

      <Row className="mt-3">
        <SubmitButton isMobile />
      </Row>
    </>
  );
}
