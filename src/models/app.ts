import { DaoItem } from "@/api";
import { useState } from "react";

export default () => {
  const [address, setAddress] = useState<string>("");
  const [currentDao, setCurrentDao] = useState<DaoItem>();

  return {
    address,
    setAddress,
    currentDao,
    setCurrentDao,
  };
};
