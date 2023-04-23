import { DaoItem } from "@/api";
import { LaunchPadInfo } from "@/api/apis";
import { useState } from "react";

export enum WalletName {
  Tonhub = "Tonhub",
  Tonkeeper = "Tonkeeper",
}

export default () => {
  const [address, setAddress] = useState<string>("");
  const [walletName, setWalletName] = useState<WalletName>();
  const [currentDao, setCurrentDao] = useState<DaoItem>();
  const [currentLaunchpad, setCurrentLaunchpad] = useState<LaunchPadInfo>({
    exrate: 0,
    releaseTime: 0,
  });

  return {
    address,
    setAddress,
    currentDao,
    setCurrentDao,
    walletName,
    setWalletName,
    currentLaunchpad,
    setCurrentLaunchpad,
  };
};
