import { Col } from "react-bootstrap";

import { useTranslation } from "next-i18next";

import InternalLink from "components/internal-link";
import MyNetworkSettings from "components/network/settings/controller";
import NothingFound from "components/nothing-found";
import ProfileLayout from "components/profile/profile-layout";

import { Network } from "interfaces/network";

import { SearchBountiesPaginated } from "types/api";

interface MyNetworkPageViewProps {
  myNetwork: Network;
  bounties: SearchBountiesPaginated;
  updateEditingNetwork: () => Promise<void>;
}

export default function MyNetworkPageView({
  myNetwork,
  bounties,
  updateEditingNetwork,
}: MyNetworkPageViewProps) {
  const { t } = useTranslation(["common", "custom-network"]);

  return(
    <ProfileLayout>
      { !myNetwork &&
        <Col className="pt-5">
          <NothingFound description={t("custom-network:errors.not-found")}>
            <InternalLink
              href={"/new-network"}
              label={String(t("actions.create-one"))}
              uppercase
            />
          </NothingFound>
        </Col>
      ||
        <Col xs={12}>
          <MyNetworkSettings
            bounties={bounties}
            network={myNetwork}
            updateEditingNetwork={updateEditingNetwork}
          />
        </Col>
      }
    </ProfileLayout>
  );
}