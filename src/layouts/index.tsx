import { Link } from "umi";
import "../assets/global.less";
import "./index.less";
import {
  THEME,
  TonConnectUIProvider,
  useTonAddress,
} from "@tonconnect/ui-react";
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from "@tonconnect/ui-react";

import { useEffect, useState } from "react";
import { useModel } from "umi";
import Back from "@/components/Back";

import "./index.less";
import {
  RemoteConnectPersistance,
  TonhubConnectProvider,
  useTonhubConnect,
} from "react-ton-x";
import { Button, Modal } from "antd";
// TODO change to L3 client
export const tc = new TonClient({
  endpoint: "https://scalable-api.tonwhales.com/jsonRPC",
});
import useLocalStorage from "use-local-storage";
import isMobile from "is-mobile";
import QRCode from "react-qr-code";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TonClient } from "ton";
import { WalletName } from "@/models/app";
let wasPendingConnectionChecked = false;

// export default function Layout(props: any) {
//   return;
//   <QueryClientProvider client={queryClient}>
//     <TonhubConnectProvider
//       network={process.env.APP_ENV === "prod" ? "mainnet" : "testnet"}
//       url="https://ton.org/"
//       name="TON TWA BOT"
//       debug={false}
//       connectionState={connectionState}
//       setConnectionState={(s) => {
//         setConnectionState(s as RemoteConnectPersistance);
//       }}
//     >
//       <_TonConnecterInternal />
//       <div className="layout">{props.children}</div>;
//     </TonhubConnectProvider>
//   </QueryClientProvider>;
// }
export default (props: any) => {
  const queryClient = new QueryClient();
  const { address, setAddress } = useModel("app");
  const [connectionState, setConnectionState] =
    useLocalStorage<RemoteConnectPersistance>("connection", {
      type: "initing",
    });

  const connect: any = useTonhubConnect();
  // fix for stale connections, can probably be improved
  useEffect(() => {
    window.Telegram.WebApp.ready();
    if (!wasPendingConnectionChecked && connectionState?.type === "pending") {
      localStorage.removeItem("connection");
      window.location.reload();
    }
    wasPendingConnectionChecked = true;
  }, [connectionState]);

  return (
    <div>
      <TonConnectUIProvider
        manifestUrl={`${process.env.APP_URL}/tonconnect-manifest.json`}
        uiPreferences={{ theme: THEME.DARK }}
        walletsList={{ wallets: ["Tonkeeper"] }} //Tonhub can not login
      >
        <QueryClientProvider client={queryClient}>
          <TonhubConnectProvider
            network={process.env.APP_ENV === "prod" ? "mainnet" : "testnet"}
            url={process.env.APP_URL!}
            // url="https://ton.org"
            name="Soton TWA BOT"
            debug={true}
            connectionState={connectionState}
            setConnectionState={(s) => {
              setConnectionState(s as RemoteConnectPersistance);
            }}
          >
            <div className="layout">
              {props.children}
              {!address && <_TonConnecterInternal />}
            </div>
          </TonhubConnectProvider>
        </QueryClientProvider>
      </TonConnectUIProvider>
    </div>
  );
};

function _TonConnecterInternal(props: any) {
  const wallet = useTonWallet();
  const tonkeeperAddress = useTonAddress();
  const [connectType, setConnectType] = useState("");

  const connect: any = useTonhubConnect();
  const { setAddress, address, setWalletName } = useModel("app");
  // const isConnected = connect.state.type === "online";
  console.log(connect.state.type);
  console.log("tonkeeper wallet:", wallet, tonkeeperAddress);

  useEffect(() => {
    const addr = connect.state?.walletConfig?.address;
    if (addr && addr !== address) {
      setAddress(connect.state?.walletConfig?.address);
      setWalletName(WalletName.Tonhub);
    }
  }, [connect]);
  useEffect(() => {
    if (tonkeeperAddress) {
      setAddress(tonkeeperAddress);
      setWalletName(WalletName.Tonkeeper);
    }
  }, [tonkeeperAddress]);

  const handleLogout = () => {
    connect.api.revoke();
    setAddress("");
  };
  console.log("connectTYpe: ", connectType);
  const triggerTonkeeperClick = () => {
    const btn = document.getElementById("tc-connect-button");
    btn?.click();
  };
  return (
    <>
      {!address && (
        <div className="connect-container">
          <img src="/img-welcome.png" alt="" className="img-welcome" />
          <div className="connect-btns">
            <Button
              type="primary"
              className="primary-btn btn-connect"
              onClick={() => setConnectType(WalletName.Tonhub)}
            >
              Connect with Tonhub
            </Button>
            <Button
              type="primary"
              className="primary-btn btn-connect"
              onClick={() => {
                setConnectType(WalletName.Tonkeeper);
              }}
            >
              Connect with Tonkeeper
            </Button>
          </div>
          <div className="login-container">
            {connectType === WalletName.Tonhub && <TonConnect />}
            {connectType === WalletName.Tonkeeper && <TonkeeperConnect />}
            {/* <TonConnectButton
              style={{
                display: "none",
              }}
            /> */}
          </div>
        </div>
      )}
    </>
  );
}

function TonConnect({ type: WalletName }: any) {
  const connect = useTonhubConnect();
  // console.log("link: ", connect.state.link);
  return (
    <div>
      {connect.state.type === "initing" && (
        <span className="text-tip">Waiting for session</span>
      )}
      {connect.state.type === "pending" && (
        <div className="login-content">
          {isMobile() && (
            <Button
              className="primary-btn login-mobile-btn"
              onClick={() => {
                // @ts-ignore
                window.location.href = connect.state.link.replace(
                  process.env.APP_ENV === "prod" ? "ton://" : "ton-test://",
                  process.env.APP_ENV === "prod"
                    ? "https://tonhub.com/"
                    : "https://test.tonhub.com/"
                );
              }}
            >
              Open {process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"}{" "}
              Wallet{" "}
            </Button>
          )}
          {!isMobile() && (
            <div className="login-pc">
              <div className="login-qrcode">
                <QRCode value={connect.state.link} />
              </div>
              <p className="text-tip">
                Scan with your mobile{" "}
                {process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"} wallet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TonkeeperConnect() {
  const [universalLink, setUniversalLink] = useState("");

  const [tonConnectUi] = useTonConnectUI();
  const walletConnectionSource = {
    universalLink: "https://app.tonkeeper.com/ton-connect",
    bridgeUrl: "https://bridge.tonapi.io/bridge",
  };
  //@ts-ignore
  const connector = tonConnectUi.connector;
  const unsubscribe = connector.onStatusChange((walletInfo: any) => {
    // update state/reactive variables to show updates in the ui
    console.log(walletInfo);
  });
  useEffect(() => {
    const universalLink = connector.connect(walletConnectionSource);
    setUniversalLink(universalLink);
    console.log("tonConnectUi: ", universalLink);
  }, []);
  return (
    <div>
      <div className="login-content">
        {isMobile() && (
          <Button
            className="primary-btn login-mobile-btn"
            onClick={() => {
              // @ts-ignore
              window.location.href = universalLink;
            }}
          >
            Open Tonkeeper Wallet
          </Button>
        )}
        {!isMobile() && (
          <div className="login-pc">
            <div className="login-qrcode">
              <QRCode value={universalLink} />
            </div>
            <p className="text-tip">Scan with your mobile Tonkeeper wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
