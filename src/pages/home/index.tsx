import { useEffect, useState } from "react";
import { getBindResult, IBindResultData } from "@/api/apis";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import "./index.less";
import { Button } from "antd";

export default function HomePage() {
  const [bindData, setBindData] = useState<IBindResultData[]>([]);
  const connect: any = useTonhubConnect();
  const getBind = async () => {
    if (connect.state?.walletConfig?.address) {
      const params = {
        addr: connect.state?.walletConfig?.address,
        // tid: "",
      };
      const res: IBindResultData[] = await getBindResult(params);
      console.log(res);
      setBindData(res);
    }
  };
  useEffect(() => {
    getBind();
  }, [connect]);

  const handleBind = () => {
    const msg = {
      type: "bind_addr",
      data: {
        address: connect.state?.walletConfig?.address,
      },
    };
    window.Telegram.WebApp.sendData(JSON.stringify(msg));
  };

  return (
    <div className="home-container">
      <h1>Welcome to Soton</h1>
      <h3>Your address: </h3>
      <p className="address-display">{connect.state?.walletConfig?.address}</p>
      {bindData.length === 0 && (
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
