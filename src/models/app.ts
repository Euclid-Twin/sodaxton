import { DaoItem } from "@/api";
import { LaunchPadInfo } from "@/api/apis";
import { useState, useEffect } from "react";

export enum WalletName {
  Tonhub = "Tonhub",
  Tonkeeper = "Tonkeeper",
}

export default () => {
  const [connectorLoading, setConnectorLoading] = useState(true);
  const [address, setAddress] = useState<string>("");
  const [walletName, setWalletName] = useState<WalletName>();
  const [currentDao, setCurrentDao] = useState<DaoItem>();
  const [currentLaunchpad, setCurrentLaunchpad] = useState<LaunchPadInfo>({
    exrate: 0,
    releaseTime: 0,
  });

  useEffect(() => {
    setTimeout(() => {
      setConnectorLoading(false);
    }, 3000);
    if (address) {
      setConnectorLoading(false);
    }
  }, [address]);

  return {
    address,
    setAddress,
    currentDao,
    setCurrentDao,
    walletName,
    setWalletName,
    currentLaunchpad,
    setCurrentLaunchpad,
    connectorLoading,
    setConnectorLoading,
  };
};
