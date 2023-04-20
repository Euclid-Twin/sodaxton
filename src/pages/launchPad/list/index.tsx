import "./index.less";
import { useState, useEffect } from "react";
import { useParams, useModel } from "umi";
import { getTgRawMessages } from "@/api/apis";
import { message } from "antd";
import {
  getAccountTimeLockAddr,
  tonClient,
  getDeployTimelockTx,
  getClaimSoldJettonTx,
} from "@/utils";
import useSendTransaction from "@/hooks/useSendTransaction";

export default () => {
  const [list, setList] = useState([]);
  const {
    currentDao,
    address = "kQCkeUfuGycIp6EJN3LdqhdlOd7aNdLEqxk5LnQYij1Q6EHZ",
    walletName,
  } = useModel("app");
  const { sendTransaction } = useSendTransaction();

  const getLaunchPads = async () => {
    // if (currentDao) {
    const list = await getTgRawMessages(
      Number(currentDao?.id || "-1001986890351")
    );
    console.log(list);
    setList(list);
    //test
    const launchPadInfo = JSON.parse(list[1].data);
    console.log("launchPadInfo: ", launchPadInfo);
    await claimSoldJetton(launchPadInfo);
    // }
  };

  const claimSoldJetton = async (info: any) => {
    if (Date.now() / 1000 < info.releaseTime) {
      message.warn("LaunchPad not finish");
      return;
    }
    const accountTimeLockAddr = await getAccountTimeLockAddr(
      address,
      info.releaseTime
    );
    const contractStates = await tonClient.getContractState(
      accountTimeLockAddr
    );
    if (!contractStates.code || !contractStates.data) {
      const timelockDeployTx = await getDeployTimelockTx(
        info.releaseTime,
        address,
        accountTimeLockAddr.toFriendly()
      );
      await sendTransaction(timelockDeployTx, "Deploy timelock", "", "");
    }
    const claimSoldTx = await getClaimSoldJettonTx(
      accountTimeLockAddr.toFriendly(),
      info,
      address
    );
    await sendTransaction(
      claimSoldTx,
      "Claim Sold Jetton",
      "Claim successfully",
      "Claim failed"
    );
  };
  useEffect(() => {
    getLaunchPads();
  }, []);

  return <div></div>;
};
