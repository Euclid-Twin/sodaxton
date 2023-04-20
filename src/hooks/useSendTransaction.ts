import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTonhubConnect } from "react-ton-x";
import { WalletName } from "@/models/app";
import { useModel } from "umi";
import { useCallback, useMemo } from "react";
import { message, Modal } from "antd";
import {
  Address,
  beginCell,
  contractAddress,
  Cell,
  toNano,
  StateInit,
} from "ton";
import { TxConfirmModal } from "@/pages/collectionCreate";
export default () => {
  const connect = useTonhubConnect();
  const [tonConnectUi] = useTonConnectUI();
  const { currentDao, address, walletName } = useModel("app");
  const walletDisplay = useMemo(() => {
    if (walletName === WalletName.Tonkeeper) {
      return WalletName.Tonkeeper;
    } else {
      return process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox";
    }
  }, [walletName]);
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
      TxConfirmModal(walletDisplay);
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
          Modal.destroyAll();
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
        Modal.destroyAll();
        callback?.();
      }
    } catch (e) {
      console.log(e);
      message.error(failedMsg || "Send transaction failed.");
    } finally {
      Modal.destroyAll();
    }
  };
  return {
    sendTransaction,
  };
};
