import { DaoItem } from "@/api";
import { useState } from "react";

export enum WalletName {
  Tonhub = "Tonhub",
  Tonkeeper = "Tonkeeper",
}

export default () => {
  const [address, setAddress] = useState<string>("");
  const [walletName, setWalletName] = useState<WalletName>();
  const [currentDao, setCurrentDao] = useState<DaoItem>();

  return {
    address,
    setAddress,
    currentDao,
    setCurrentDao,
    walletName,
    setWalletName,
  };
};
