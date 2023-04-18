import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTonhubConnect } from "react-ton-x";
import { WalletName } from "@/models/app";
import { useModel } from "umi";
import { useCallback } from "react";
import { message } from "antd";
import {
  Address,
  beginCell,
  contractAddress,
  Cell,
  toNano,
  StateInit,
} from "ton";
export default () => {
  const connect = useTonhubConnect();
  const [tonConnectUi] = useTonConnectUI();
  const { currentDao, address, walletName } = useModel("app");

  const sendTransaction = async (
    tx: {
      value: number | string;
      to: string;
      state_init?: string;
      payload?: string;
    },
    text: string,
    successMsg: string,
    failedMsg: string,
    callback?: () => void
  ) => {
    try {
      if (walletName === WalletName.Tonhub) {
        const request = {
          //@ts-ignore
          seed: connect.state.seed, // Session Seed
          //@ts-ignore
          appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
          to: tx.to, // Destination
          value: toNano(tx.value).toString(), // Amount in nano-tons
          timeout: 5 * 60 * 1000, // 1 min timeout
          stateInit: tx.state_init || undefined, // Optional serialized to base64 string state_init cell
          text, // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
          payload: tx.payload || undefined, // Optional serialized to base64 string payload cell
        };
        const response = await connect.api.requestTransaction(request);
        console.log("tx resp: ", response);
        if (response.type === "rejected") {
          // Handle rejection
          message.warn("Transaction rejected.");
        } else if (response.type === "expired") {
          // Handle expiration
          message.warn("Transaction expired. Please try again.");
        } else if (response.type === "invalid_session") {
          // Handle expired or invalid session
          message.warn(
            "Transaction or session expired. Please re-login and try again."
          );
        } else if (response.type === "success") {
          // Handle successful transaction
          message.success(successMsg || "Send transaction successfully.");
          callback?.();
        } else {
          throw new Error("Impossible");
        }
      } else {
        const _tx = {
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [
            {
              address: tx.to,
              amount: toNano(tx.value).toString(),
              stateInit: tx.state_init || undefined,
              payload: tx.payload || undefined,
              text: text,
            },
          ],
        };
        //@ts-ignore
        const resp = await tonConnectUi.connector.sendTransaction(_tx);
        console.log("tonkeeper resp: ", resp);
        message.success(successMsg || "Send transaction successfully.");
        callback?.();
      }
    } catch (e) {
      console.log(e);
      message.error(failedMsg || "Send transaction failed.");
    }
  };
  return {
    sendTransaction,
  };
};
