import { useState } from "react";

import { useTranslation } from "next-i18next";
import getConfig from "next/config";

import NetworkLogoAndColorsSettingsView from "components/network/settings/logo-and-colors/view";

import { useAppState } from "contexts/app-state";
import { useNetworkSettings } from "contexts/network-settings";
import { addToast } from "contexts/reducers/change-toaster";

import { getQueryableText, urlWithoutProtocol } from "helpers/string";

import { MetamaskErrors } from "interfaces/enums/Errors";
import { RegistryEvents } from "interfaces/enums/events";
import { Network } from "interfaces/network";

import useApi from "x-hooks/use-api";
import useBepro from "x-hooks/use-bepro";
import { useNetwork } from "x-hooks/use-network";

const { publicRuntimeConfig } = getConfig();

interface NetworkLogoAndColorsSettingsProps {
  network: Network;
  errorBigImages: boolean
  networkNeedRegistration: boolean;
  updateEditingNetwork: () => void;
}

export default function NetworkLogoAndColorsSettings({
  network,
  errorBigImages,
  networkNeedRegistration,
  updateEditingNetwork,
}: NetworkLogoAndColorsSettingsProps) {
  const { t } = useTranslation(["common", "custom-network"]);
  const [isRegistering, setIsRegistering] = useState(false);

  const { processEvent } = useApi();
  const {state, dispatch} = useAppState();
  const { updateActiveNetwork } = useNetwork();
  const { handleAddNetworkToRegistry } = useBepro();
  const {
    details,
    fields,
    settings,
  } = useNetworkSettings();
  
  const isObjectEmpty = (objectName) => {
    return Object.keys(objectName).length === 0
  }

  const handleColorChange = (value) => fields.colors.setter(value);

  const isCurrentNetwork = (!!network &&
                            !!state.Service?.network?.active &&
                            network?.networkAddress === state.Service?.network?.active?.networkAddress);
  const isConnected = !!state.currentUser?.walletAddress && !!state.currentUser?.accessToken;
  const isRegisterButtonDisabled = !isConnected || isRegistering;

  const handleIconChange = (value) => fields.logo.setter(value, "icon");
  const handleFullChange = (value) => fields.logo.setter(value, "full");

  function handleRegisterNetwork() {
    if (!network) return;

    setIsRegistering(true);

    handleAddNetworkToRegistry(network.networkAddress)
      .then((txInfo) => {
        return processEvent(RegistryEvents.NetworkRegistered, undefined, {
          fromBlock: txInfo.blockNumber,
        });
      })
      .then(() => {
        if (isCurrentNetwork) updateActiveNetwork(true);

        return updateEditingNetwork();
      })
      .catch((error) => {
        if (error?.code !== MetamaskErrors.UserRejected)
          dispatch(addToast({
              type: "danger",
              title: t("actions.failed"),
              content: t("custom-network:errors.failed-to-create-network", {
                error,
              }),
          }));

        console.debug("Failed to add to registry",
                      network.networkAddress,
                      error);
      })
      .finally(() => setIsRegistering(false));
  }


  return(
    <NetworkLogoAndColorsSettingsView
      isNetworkUnregistered={networkNeedRegistration}
      isRegisterButtonDisabled={isRegisterButtonDisabled}
      isConnected={isConnected}
      isRegistering={isRegistering}
      baseUrl={urlWithoutProtocol(publicRuntimeConfig?.urls?.api)}
      network={network}
      queryableNetworkName={network?.name ? getQueryableText(network?.name) : null}
      iconLogoField={details?.iconLogo}
      fullLogoField={details?.fullLogo}
      isLogosSizeTooLarge={errorBigImages}
      networkTheme={settings?.theme}
      isEmptyTheme={isObjectEmpty(settings?.theme?.colors)}
      onClickRegisterNetwork={handleRegisterNetwork}
      onIconLogoChange={handleIconChange}
      onFullLogoChange={handleFullChange}
      onColorChange={handleColorChange}
    />
  );
}
