import { Col, Row } from "react-bootstrap";

import { useTranslation } from "next-i18next";

import ContractButton from "components/contract-button";
import If from "components/If";
import ScrollableTabs from "components/navigation/scrollable-tabs/view";
import { TabsProps } from "components/network/settings/controller";
import RegisterNetworkWarning from "components/network/settings/register-network-warning/controller";
import WarningGithub from "components/profile/my-network-settings/warning-github";

import { MiniTabsItem } from "types/components";

interface MyNetworkSettingsViewProps {
  themePreview: string;
  tabs: MiniTabsItem[];
  tabsProps: TabsProps[];
  activeTab: string;
  isAbleToSave?: boolean;
  isUpdating?: boolean;
  isGithubConnected?: boolean;
  isWalletConnected?: boolean;
  networkAddress: string;
  isNetworkUnregistered?: boolean;
  handleSubmit: () => Promise<void>;
  updateNetworkData: () => Promise<void>;
}

export default function MyNetworkSettingsView({
  themePreview,
  tabs,
  tabsProps,
  activeTab,
  isAbleToSave,
  isUpdating,
  isGithubConnected,
  isWalletConnected,
  networkAddress,
  isNetworkUnregistered,
  handleSubmit,
  updateNetworkData,
}: MyNetworkSettingsViewProps) {
  const { t } = useTranslation(["common", "custom-network", "bounty"]);

  return (
    <>
      <style>{themePreview}</style>

      <If condition={isNetworkUnregistered}>
        <RegisterNetworkWarning
          isConnected={isWalletConnected}
          networkAddress={networkAddress}
          updateNetworkData={updateNetworkData}
        />
      </If>

      <If condition={!isGithubConnected && activeTab !== "repositories"}>
        <WarningGithub />
      </If>

      <ScrollableTabs
        tabs={tabs}
      />

      {tabsProps.find(({ eventKey }) => activeTab === eventKey)?.component}

      <If condition={isAbleToSave}>
        <Row className="mt-3 mb-4">
          <Col>
            <ContractButton
              onClick={handleSubmit}
              disabled={isUpdating}
              isLoading={isUpdating}
            >
              <span>{t("custom-network:save-settings")}</span>
            </ContractButton>
          </Col>
        </Row>
      </If>
    </>
  );
}