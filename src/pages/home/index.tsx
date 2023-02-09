import { useEffect, useState, useMemo } from "react";
import { getBindResult, IBindResultData } from "@/api/apis";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import "./index.less";
import { Button } from "antd";
import { useModel } from "umi";

export default function HomePage() {
  const [bindData, setBindData] = useState<IBindResultData[]>([]);
  const { address } = useModel("app");
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
      <h1>Welcome to Soton</h1>
      <h3>Your address: </h3>
      <p className="address-display">{address}</p>
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
    </div>
  );
}
