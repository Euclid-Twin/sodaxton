import { useEffect, useState, useMemo } from "react";
import { getBindResult, IBindResultData } from "@/api/apis";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import "./index.less";
import { Button } from "antd";
import { useModel, Link, history } from "umi";
import TonWalletConnect from "@/components/TonWalletConnect";
import IconCopy from "@/assets/images/copy.svg";
import { fallbackCopyTextToClipboard } from "@/utils";
console.log("tonserver: ", process.env.TON_SERVER);
export default function HomePage() {
  const [bindData, setBindData] = useState<IBindResultData[]>([]);
  const { address } = useModel("app");
  const [initData, setInitData] = useState();
  const [dataUnsafe, setDataUnsafe] = useState();
  // const address = useMemo(() => {
  //   return connect.state?.walletConfig?.address;
  // }, [connect]);
  const getBind = async () => {
    if (address) {
      const params = {
        addr: address,
        // tid: "",
      };
      const res: IBindResultData[] = await getBindResult(params);
      console.log(res);
      setBindData(res);
    }
  };
  useEffect(() => {
    getBind();
  }, [address]);

  useEffect(() => {
    window.Telegram.WebApp.ready();

    const initData = window.Telegram.WebApp.initData || "";
    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
    setInitData(initData);
    setDataUnsafe(initDataUnsafe);
  }, []);

  const handleBind = () => {
    const msg = {
      type: "bind_addr",
      data: {
        address: address,
      },
    };
    window.Telegram.WebApp.sendData(JSON.stringify(msg));
  };

  const addressDisplay = useMemo(() => {
    if (address) {
      return address.substring(0, 4) + "..." + address.substr(-4);
    }
  }, [address]);

  return (
    <div className="home-container">
      {address && (
        <div className="home-content">
          <h1 className="page-title">Welcome to Soton</h1>

          <p className="text-tip">Your address: </p>
          <div className="address-display">
            <span>{addressDisplay}</span>
            <img
              src={IconCopy}
              alt=""
              onClick={() => fallbackCopyTextToClipboard(address)}
            />
          </div>
          <div className="bind-addr">
            {bindData.length === 0 && (
              <Button
                type="primary"
                className="primary-btn bind-btn"
                onClick={handleBind}
              >
                Bind your address with Telegram
              </Button>
            )}
            {bindData.length > 0 && (
              <Button
                type="primary"
                className="primary-btn bind-btn"
                onClick={() => history.push("/daos")}
              >
                View DAOs
              </Button>
            )}
          </div>
        </div>
      )}
      <TonWalletConnect />
    </div>
  );
}
