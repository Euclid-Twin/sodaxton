import { useEffect, useState, useMemo } from "react";
import { getBindResult, IBindResultData } from "@/api/apis";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import { toNano, beginCell } from "ton";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

import "./index.less";
import { Button, Modal, message } from "antd";
import { useModel, Link, history, useLocation, Location } from "umi";
import TonWalletConnect from "@/components/TonWalletConnect";
import IconCopy from "@/assets/images/copy.svg";
import { fallbackCopyTextToClipboard } from "@/utils";
import CollectionTx from "@/components/Transactoin";
import { PLATFORM } from "@/utils/constant";
import { bind1WithWeb3Proof, unbind } from "@/api";
import { WalletName } from "@/models/app";
export default function HomePage() {
  const [bindData, setBindData] = useState<IBindResultData[]>([]);
  const { address, setAddress, walletName } = useModel("app");
  const [initData, setInitData] = useState();
  const [dataUnsafe, setDataUnsafe] = useState();
  const [bindLoading, setBindLoading] = useState(false);
  const [unbindLoading, setUnbindLoading] = useState(false);

  const connect = useTonhubConnect();
  const [tonConnectUi] = useTonConnectUI();

  const location: Location = useLocation();
  console.log(location.query);
  const tid = location.query?.tid as string;
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
    // window.Telegram.WebApp.ready();
    // const initData = window.Telegram.WebApp.initData || "";
    // const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
    // setInitData(initData);
    // setDataUnsafe(initDataUnsafe);
  }, []);

  const getPk = (str: string) => {
    const arrs = str.split(",");
    return arrs[1].split("=")[1];
  };

  const signConfirm = () => {
    Modal.info({
      title: `Please confirm on ${
        process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"
      }`,
      content: (
        <div>
          <p>
            {`Please open the ${
              process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"
            } wallet on your phone and confirm the signature
          on the homepage`}
          </p>
        </div>
      ),
      onOk() {},
    });
  };

  const reload = () => {
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleBind = async () => {
    // const msg = {
    //   type: "bind_addr",
    //   data: {
    //     address: address,
    //   },
    // };
    // window.Telegram.WebApp.sendData(JSON.stringify(msg));
    try {
      setBindLoading(true);
      if (walletName === WalletName.Tonkeeper) {
        const res = await bind1WithWeb3Proof({
          address,
          appid: tid!,
        });
        if (res) {
          message.success(
            `TON address "${addressDisplay}" has been bound to your Telegram account.`
          );
          getBind(); //refresh page
        } else {
          message.error("Bind failed.");
        }
      } else {
        signConfirm();
        const platform = PLATFORM;
        const payloadToSign = Buffer.concat([
          Buffer.from([0, 0, 0, 0]),
          Buffer.from(platform + tid),
        ]);
        const payload = beginCell()
          .storeBuffer(payloadToSign)
          .endCell()
          .toBoc({ idx: false })
          .toString("base64");
        // const text = "Please, sign our terms or service and privacy policy";
        const text = "Bind your address with Telegram";
        // Request body
        const request = {
          //@ts-ignore
          seed: connect.state.seed, // Session Seed
          //@ts-ignore
          appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
          timeout: 5 * 60 * 1000, // 5 minut timeout
          text: text, // Text to sign, presented to the user.
          payload: payload, // Optional serialized to base64 string payload cell
        };
        const response = await connect.api.requestSign(request);
        if (response.type === "rejected") {
          // Handle rejection
          message.warn("Transaction rejected");
        } else if (response.type === "expired") {
          // Handle expiration
          message.warn("Transaction expired");
        } else if (response.type === "invalid_session") {
          // Handle expired or invalid session
          message.warn(
            "Session or transaction expired. Please re-login and tray again."
          );
        } else if (response.type === "success") {
          // Handle successful transaction
          const sig = response.signature;

          const res = await bind1WithWeb3Proof({
            address,
            appid: tid!,
            sig,
            pubkey: getPk(connect.state.walletConfig.walletConfig),
          });
          if (res) {
            message.success(
              `TON address "${addressDisplay}" has been bound to your Telegram account.`
            );
            getBind(); //refresh page
          } else {
            message.error("Bind failed.");
          }
        } else {
          throw new Error("Impossible");
        }
      }
      setBindLoading(false);
    } catch (e) {
      console.log(e);
      message.error("Bind failed.");
    } finally {
      setBindLoading(false);
      Modal.destroyAll();
    }
  };
  const handleUnbind = async () => {
    // const msg = {
    //   type: "unbind_addr",
    //   data: {
    //     address: address,
    //   },
    // };
    // window.Telegram.WebApp.sendData(JSON.stringify(msg));
    try {
      setUnbindLoading(true);
      if (walletName === WalletName.Tonkeeper) {
        const res = await unbind({
          addr: address,
          tid: tid!,
        });
        if (res) {
          message.success(`Your TON address is unbound.`);
          getBind(); //refresh page
        } else {
          message.error("Unbind failed.");
        }
      } else {
        signConfirm();
        const platform = PLATFORM;
        const payloadToSign = Buffer.concat([
          Buffer.from([0, 0, 0, 0]),
          Buffer.from(platform + tid),
        ]);
        const payload = beginCell()
          .storeBuffer(payloadToSign)
          .endCell()
          .toBoc({ idx: false })
          .toString("base64");
        const text = "Unbind your address with Telegram";
        // Request body
        const request = {
          //@ts-ignore
          seed: connect.state.seed, // Session Seed
          //@ts-ignore
          appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
          timeout: 5 * 60 * 1000, // 5 minut timeout
          text: text, // Text to sign, presented to the user.
          payload: payload, // Optional serialized to base64 string payload cell
        };
        const response = await connect.api.requestSign(request);
        if (response.type === "rejected") {
          // Handle rejection
          message.warn("Transaction rejected");
        } else if (response.type === "expired") {
          // Handle expiration
          message.warn("Transaction expired");
        } else if (response.type === "invalid_session") {
          // Handle expired or invalid session
          message.warn(
            "Session or transaction expired. Please re-login and tray again."
          );
        } else if (response.type === "success") {
          // Handle successful transaction
          const sig = response.signature;
          const res = await unbind({
            addr: address,
            tid: tid!,
            sig,
            pubkey: getPk(connect.state.walletConfig.walletConfig),
          });
          if (res) {
            message.success(`Your TON address is unbound.`);
            getBind(); //refresh page
          } else {
            message.error("Unbind failed.");
          }
        } else {
          throw new Error("Impossible");
        }
      }
      setUnbindLoading(false);
    } catch (e) {
      message.error("Unbind failed.");
      console.log(e);
    } finally {
      setBindLoading(false);
      Modal.destroyAll();
    }
  };

  const addressDisplay = useMemo(() => {
    if (address) {
      return address.substring(0, 4) + "..." + address.substr(-4);
    }
  }, [address]);

  const handleLogout = () => {
    if (walletName === WalletName.Tonhub) {
      connect.api.revoke();
      setAddress("");
    } else {
      tonConnectUi.disconnect();
      setAddress("");
    }
  };

  return (
    <div className="home-container">
      {address && (
        <div className="home-content">
          <h1 className="page-title home-title">Welcome to Soton</h1>

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
                loading={bindLoading}
              >
                Bind your address with Telegram
              </Button>
            )}
            {bindData.length > 0 && (
              <Button
                type="primary"
                className="default-btn bind-btn"
                onClick={handleUnbind}
                loading={unbindLoading}
              >
                Unbind your address with Telegram
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
            {bindData.length > 0 && (
              <Button
                type="primary"
                className="primary-btn bind-btn"
                onClick={() => history.push("/collections")}
              >
                Collections
              </Button>
            )}
          </div>
        </div>
      )}
      {/* <CollectionTx /> */}
      {address && (
        <div
          style={{
            marginTop: "20px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button className="default-btn logout-btn" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
      {/* <TonWalletConnect /> */}
    </div>
  );
}
