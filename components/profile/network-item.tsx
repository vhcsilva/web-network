import { ReactNode, useState } from "react";

import { useTranslation } from "next-i18next";

import ArrowDown from "assets/icons/arrow-down";
import ArrowUp from "assets/icons/arrow-up";
import ArrowUpRight from "assets/icons/arrow-up-right";

import Button from "components/button";
import NetworkLogo from "components/network-logo";

import { useAppState } from "contexts/app-state";

import { formatNumberToCurrency } from "helpers/formatNumber";

import { FlexColumn, FlexRow } from "./wallet-balance";

export default function NetworkItem({
  key,
  children,
  type,
  amount,
  symbol,
  handleNetworkLink,
  iconNetwork,
  networkName,
  subNetworkText,
}: {
  children?: ReactNode;
  key?: number | string;
  type?: "network" | "voting";
  networkName: string;
  subNetworkText?: string;
  iconNetwork: string;
  amount: string | number;
  symbol: string;
  handleNetworkLink?: () => void;
}) {
  const { t } = useTranslation(["profile"]);
  const [isDropdown, setIsDropDown] = useState<boolean>(false);
  const {
    state: { Settings: settings },
  } = useAppState();

  function ArrowComponent() {
    return !isDropdown ? (
      <ArrowDown width={10} height={8} />
    ) : (
      <ArrowUp width={10} height={8} />
    );
  }

  function renderAmount() {
    return (
      <FlexRow className={`${type === "voting" && "caption-medium"}  mt-2`}>
        <span className="text-white mr-1">
          {formatNumberToCurrency(amount)}
        </span>
        <span className="text-primary">{symbol}</span>
      </FlexRow>
    );
  }

  function renderType() {
    const isNetwork = type === "network";
    return (
      <>
        <FlexRow className={`${!isNetwork && "justify-content-between"}`}>
          <FlexRow className={`${isNetwork && "col-3"}`}>
            <FlexColumn className="justify-content-center me-2">
              <NetworkLogo
                src={`${settings?.urls?.ipfs}/${iconNetwork}`}
                alt={`${networkName} logo`}
                isBepro={networkName?.toLowerCase() === "bepro"}
                size="md"
              />
            </FlexColumn>
            <FlexColumn className="justify-content-center">
              <FlexRow>{networkName}</FlexRow>

              {!isNetwork && (
                <FlexRow>
                  <span className="text-gray">{subNetworkText}</span>
                </FlexRow>
              )}
            </FlexColumn>
          </FlexRow>
          {isNetwork ? (
            <>
              <FlexRow className="col-3 justify-content-center">
                {renderAmount()}
              </FlexRow>
              <FlexRow className="col-3 justify-content-center">
                <FlexColumn className="justify-content-center">
                  <div
                    className="px-1 py-0 mt-1 ms-4 cursor-pointer border border-gray-700 bg-gray-850 border-radius-4"
                    onClick={handleNetworkLink}
                  >
                    <ArrowUpRight />
                  </div>
                </FlexColumn>
              </FlexRow>
              <div
                className="col-3 d-flex justify-content-end"
                onClick={() => setIsDropDown(!isDropdown)}
              >
                <FlexColumn className="justify-content-center mt-1">
                  <ArrowComponent />
                </FlexColumn>
              </div>
            </>
          ) : (
            <FlexColumn className="justify-content-center">
              <FlexRow>
                {renderAmount()}
                {handleNetworkLink && (
                  <Button className="button-gray-850 ms-3">
                    <span>{t("go-to-network")}</span>{" "}
                    <ArrowUpRight className="w-9-p h-9-p" />
                  </Button>
                )}
              </FlexRow>
            </FlexColumn>
          )}
        </FlexRow>
        {isDropdown && <FlexRow className="mt-3">{children}</FlexRow>}
      </>
    );
  }

  return (
    <div
      className="bg-gray-900 p-3 border border-gray-850 border-radius-4 my-2"
      key={key}
    >
      {renderType()}
    </div>
  );
}
