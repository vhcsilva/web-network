import { Col, Row } from "react-bootstrap";

import { useTranslation } from "next-i18next";

import ContractButton from "components/contract-button";
import If from "components/If";
import ScrollableTabs from "components/navigation/scrollable-tabs/view";
import WarningGithub from "components/profile/my-network-settings/warning-github";

import { MiniTabsItem } from "types/components";

import { TabsProps } from "./controller";


interface MyNetworkSettingsViewProps {
  themePreview: string;
  tabs: MiniTabsItem[];
  tabsProps: TabsProps[];
  activeTab: string;
  isAbleToSave?: boolean;
  isUpdating?: boolean;
  isGithubConnected?: boolean;
  handleSubmit: () => Promise<void>;
}

export default function MyNetworkSettingsView({
  themePreview,
  tabs,
  tabsProps,
  activeTab,
  isAbleToSave,
  isUpdating,
  isGithubConnected,
  handleSubmit,
}: MyNetworkSettingsViewProps) {
  const { t } = useTranslation(["common", "custom-network", "bounty"]);

  return (
    <>
      <style>{themePreview}</style>

      <If condition={!isGithubConnected}>
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