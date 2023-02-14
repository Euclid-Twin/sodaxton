import { useEffect, useState, useMemo } from "react";
import { getBindResult, IBindResultData } from "@/api/apis";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import "./index.less";
import { Button } from "antd";
import { useModel, Link } from "umi";
import TonWalletConnect from "@/components/TonWalletConnect";

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

  return (
    <div className="home-container">
      <h1 className="page-title">Welcome to Soton</h1>
      {/* <p>InitData: {JSON.stringify(initData, null, 2)}</p>
      <p>DataUnsafe: {JSON.stringify(dataUnsafe, null, 2)}</p> */}
      {address && (
        <>
          <h3 style={{ fontSize: "20px", fontWeight: 500 }}>Your address: </h3>
          <p className="address-display">{address}</p>
        </>
      )}

      {bindData.length === 0 && address && (
        <div className="bind-addr">
          <Button
            type="primary"
            style={{ borderRadius: "5px", height: "32px" }}
            onClick={handleBind}
          >
            Bind your address with Telegram
          </Button>
        </div>
      )}
      {bindData.length > 0 && address && (
        <div className="navs">
          <Link to="/daos">View Daos</Link>
        </div>
      )}
      <TonWalletConnect />
    </div>
  );
}
