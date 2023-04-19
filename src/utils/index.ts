import dayjs from "dayjs";
import { message } from "antd";
import TonWeb from "tonweb";
import { Address, Cell, Slice } from "ton";

export const formatTimestamp = (
  timestamp?: number | string,
  format: string = "MM/DD/YYYY"
) => {
  if (!timestamp) return "";
  return dayjs(timestamp).format(format);
};

export const sha3 = (str: string) => {};

export function fallbackCopyTextToClipboard(text: string, tip?: string) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful ? "successful" : "unsuccessful";
    message.success(tip || "Copied!");
    console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    // message.error('Copy Failed');
    // message({ content: "Copy Failed" });
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
}

export const getUrl = (uri: string, config?: any): string => {
  if (!uri) return "";
  let source: string = uri;
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }
  if (source.startsWith("ipfs://")) {
    source = source.substring(7);
  }
  source = `https://ipfs.io/ipfs/${source}`;
  return source;
};

export const formatAddress = (addr: string) => {
  return new TonWeb.Address(addr).toString(true, true, true);
};

export const getCountdownTime = (timeMilSecs: number) => {
  const now = new Date().getTime();
  const distance = timeMilSecs - now;

  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return [hours, minutes, seconds];
};

export const getJettonBalance = async (jettonAddr: string, owner: string) => {
  const tonweb = new TonWeb(
    new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
      apiKey: process.env.TON_CENTER_API_TOKEN,
    })
  );
  const { JettonMinter, JettonWallet } = TonWeb.token.jetton;
  const minter = await new JettonMinter(tonweb.provider, {
    adminAddress: new TonWeb.Address(""),
    jettonContentUri: "",
    jettonWalletCodeHex: "",
    address: jettonAddr,
  });
  const walletAddr = await minter.getJettonWalletAddress(
    new TonWeb.Address("owner")
  );
  const jettonWallet = new JettonWallet(tonweb.provider, {
    address: walletAddr,
  });
  const data = await jettonWallet.getData();
  return data.balance;
};

export const getLaunchpadInfo = async (launchpadAddr: string) => {
  const tonweb = new TonWeb(
    new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
      apiKey: process.env.TON_CENTER_API_TOKEN,
    })
  );
  const launchpadData = await tonweb.provider.call2(
    launchpadAddr.toString(),
    "get_info"
  );
  return {
    releaseTime: launchpadData.result[0] as bigint,
    exRate: launchpadData.result[1] as bigint,
    sourceJetton:
      (launchpadData.result[2] as Slice).remaining > 2
        ? (launchpadData.result[2] as Slice).readAddress()
        : null,
    soldJetton: (launchpadData.result[3] as Slice).readAddress(),
    cap: launchpadData.result[4] as bigint,
    received: launchpadData.result[5] as bigint,
    JETTON_WALLET_CODE: launchpadData.result[6] as Cell,
    timeLockCode: launchpadData.result[7] as Cell,
    owner: (launchpadData.result[8] as Slice).readAddress(),
  };
};
