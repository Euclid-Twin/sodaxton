import dayjs from "dayjs";
import { message } from "antd";
import TonWeb from "tonweb";
import {
  Address,
  beginCell,
  fromNano,
  toNano,
  Cell,
  contractAddress,
  TonClient,
} from "ton";
import BN from "bn.js";
import { OPS } from "@/utils/ops";
import { LaunchPadInfo, getBindResult } from "@/api/apis";
import { getChatAdmins } from "@/api";
import { makeGetCall, cellToAddress } from "./lib/make-get-call";
import { readJettonMetadata } from "./lib/jetton-minter";
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
export function toBuffer(ab) {
  var buf = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

export const readFile = async (file: string): Promise<Cell> => {
  const response = await fetch(file);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => {
      console.log(reader.result);
      const codeCell = Cell.fromBoc(toBuffer(reader.result))[0];
      console.log(file, codeCell);
      resolve(codeCell);
    });
    reader.readAsArrayBuffer(blob);
  });
};

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

const { JettonMinter, JettonWallet } = TonWeb.token.jetton;
export const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
    apiKey: process.env.TON_CENTER_API_TOKEN,
  })
);
export const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
  apiKey: process.env.TON_CENTER_API_TOKEN,
});
export const getJettonBalance = async (jettonAddr: string, owner: string) => {
  const minter = await new JettonMinter(tonweb.provider, {
    adminAddress: new TonWeb.Address(owner),
    jettonContentUri: "",
    jettonWalletCodeHex: "",
    address: jettonAddr,
  });
  const walletAddr = await minter.getJettonWalletAddress(
    new TonWeb.Address(owner)
  );
  const jettonWallet = new JettonWallet(tonweb.provider, {
    address: walletAddr,
  });
  const data = await jettonWallet.getData();
  // console.log("getJettonBalance", data.balance.toNumber());
  return Number(fromNano(data.balance));
};

export const getJettonTransferTx = async (
  jettonAddr: string,
  from: string,
  to: string,
  amount: BN,
  forwardAmount: number
) => {
  const minter = await new JettonMinter(tonweb.provider, {
    adminAddress: new TonWeb.Address(from),
    jettonContentUri: "",
    jettonWalletCodeHex: "",
    address: jettonAddr,
  });
  const walletAddr = await minter.getJettonWalletAddress(
    new TonWeb.Address(from)
  );
  const jettonWallet = new JettonWallet(tonweb.provider, {
    address: walletAddr,
  });
  const body = await getJettonTransferBody(
    Address.parse(to),
    amount,
    toNano(forwardAmount)
  );
  const payload = toBuffer(await body.toBoc()).toString("base64");
  console.log(
    "jettonWallet address: ",
    jettonWallet.address!.toString(true, true, true)!
  );
  return {
    to: jettonWallet.address!.toString(true, true, true),
    value: 0.2 + +forwardAmount,
    payload: payload,
  };
};
export const ExRate_BASE = 1000000;
export const getLaunchpadInfo = async (launchpadAddr: string) => {
  try {
    const launchpadData = await tonweb.provider.call2(
      launchpadAddr.toString(),
      "get_info"
    );

    const result = {
      address: launchpadAddr,
      startTime: launchpadData[0].toNumber(),
      duration: launchpadData[1].toNumber(),
      exRate: launchpadData[2].toNumber(), // includes base
      sourceJetton:
        launchpadData[3].bits.length > 200
          ? launchpadData[3].beginParse().loadAddress().toString()
          : null,
      soldJetton: launchpadData[4].beginParse().loadAddress().toString(),
      cap: Number(fromNano(launchpadData[5])),
      received: Number(fromNano(launchpadData[6])),
      // JETTON_WALLET_CODE: launchpadData[6],
      // timeLockCode: launchpadData[7],
      owner: launchpadData[9].beginParse().loadAddress().toString(),
    };
    if (result.sourceJetton) {
      result.sourceJetton = Address.parse(result.sourceJetton).toFriendly();
    }
    if (result.soldJetton) {
      result.soldJetton = Address.parse(result.soldJetton).toFriendly();
    }
    if (result.owner) {
      result.owner = Address.parse(result.owner).toFriendly();
    }
    console.log("launchpadData: ", result);
    return result;
  } catch (e) {
    console.log(e);
    return null;
  }
};
const getJettonTransferBody = (
  toOwnerAddress: Address,
  jettonValue: number | BN,
  forwardAmount?: number | BN
) => {
  return beginCell()
    .storeUint(OPS.Transfer, 32)
    .storeUint(0, 64) // queryid
    .storeCoins(jettonValue)
    .storeAddress(toOwnerAddress)
    .storeAddress(null) // TODO RESP?
    .storeDict(null) // custom payload
    .storeCoins(forwardAmount ?? 0) // forward ton amount
    .storeRefMaybe(null) // forward payload - TODO??
    .endCell();
};

export const isDaoAdmin = async (address: string, chat_id: number) => {
  // get bind and tid;
  // get chat admins;
  // check tid in admins
  const binds = await getBindResult({ addr: address });
  const bind = binds.find((item) => item.platform === "Telegram");
  if (bind) {
    const admins: any[] = await getChatAdmins(chat_id);
    return admins.findIndex((item) => item.user.id === Number(bind.tid)) > -1;
  }
  return false;
};

export async function getAccountTimeLockAddr(account: string, endTime: number) {
  let timelockCode = await readFile("/build/timelock.cell");
  let dataCell = beginCell()
    .storeUint(endTime, 64)
    .storeAddress(Address.parse(account))
    .endCell();
  return contractAddress({
    workchain: 0,
    initialCode: timelockCode,
    initialData: dataCell,
  });
}

export async function getDeployTimelockTx(
  launchpadInfo: LaunchPadInfo,
  account: string,
  timelockAddress: string
) {
  let timelockCode = await readFile("/build/timelock.cell");
  let dataCell = beginCell()
    .storeUint(launchpadInfo.startTime + launchpadInfo.duration, 64)
    .storeAddress(Address.parse(account))
    .endCell();
  const initCell = beginCell()
    .storeBit(0)
    .storeBit(0)
    .storeBit(1)
    .storeBit(1)
    .storeBit(0)
    .storeRef(timelockCode)
    .storeRef(dataCell)
    .endCell();
  return {
    to: timelockAddress,
    value: 0.1,
    state_init: initCell.toBoc().toString("base64"),
  };
}

export async function getClaimSoldJettonTx(
  timelockAddress: string,
  launchpadInfo: any,
  account: string
) {
  const minter = await new JettonMinter(tonweb.provider, {
    adminAddress: new TonWeb.Address(account),
    jettonContentUri: "",
    jettonWalletCodeHex: "",
    address: launchpadInfo.soldJetton,
  });
  const walletAddr = await minter.getJettonWalletAddress(
    new TonWeb.Address(timelockAddress)
  );
  const jettonWallet = new JettonWallet(tonweb.provider, {
    address: walletAddr,
  });
  const jettonWalletAddress = jettonWallet.address!.toString(true, true, true);
  const purchasedAmount = await getJettonBalance(
    launchpadInfo.soldJetton,
    timelockAddress
  );
  console.log("purchased amount is", purchasedAmount);
  const body = getJettonTransferBody(
    Address.parse(account),
    toNano(purchasedAmount)
  );
  const payload = beginCell()
    .storeAddress(Address.parse(jettonWalletAddress))
    .storeRef(body)
    .endCell();
  return {
    to: timelockAddress,
    value: 0.1,
    payload: payload.toBoc().toString("base64"),
  };
}
export async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
export const getWalletSeqno = async (address: string) => {
  const walletContract = tonClient.openWalletFromAddress({
    source: Address.parse(address),
  });
  const seqno = await walletContract.getSeqNo();
  console.log("seqno:", seqno);
  return seqno;
};

export const waitWalletSeqnoIncrease = async (
  address: string,
  oldSeqno: number,
  interval: number = 2,
  maxWait: number = 10
) => {
  console.log("wait starts");
  const seqno = await getWalletSeqno(address);
  if (seqno > oldSeqno) {
    console.log("wait ends");
    return;
  } else {
    let wait = 0;
    while (true) {
      await sleep(interval);
      wait += interval;
      const seqno = await getWalletSeqno(address);
      if (seqno > oldSeqno) {
        console.log("wait ends");
        return;
      }
      if (wait >= maxWait) {
        console.log("wait exceeds");
        return;
      }
    }
  }
};

export const getClaimUnsoldJettonTx = async (
  launchpadInfo: any,
  account: string
) => {
  const balance = await getJettonBalance(
    launchpadInfo.soldJetton,
    launchpadInfo.address
  );
  return {
    to: launchpadInfo.address,
    value: 0.1,
    payload: beginCell()
      .storeUint(2, 32) // op
      .storeUint(0, 64) // query id
      .storeUint(toNano(balance), 64)
      .endCell()
      .toBoc()
      .toString("base64"),
  };
};

export const getPurchasedAmount = async (
  launchpadInfo: LaunchPadInfo,
  account: string
) => {
  const accountTimeLockAddr = await getAccountTimeLockAddr(
    account,
    launchpadInfo.startTime + launchpadInfo.duration
  );
  const timelockAddress = new TonWeb.Address(accountTimeLockAddr.toFriendly());
  const minter = await new JettonMinter(tonweb.provider, {
    adminAddress: new TonWeb.Address(account),
    jettonContentUri: "",
    jettonWalletCodeHex: "",
    address: launchpadInfo.soldJetton,
  });
  const walletAddr = await minter.getJettonWalletAddress(timelockAddress);
  const jettonWallet = new JettonWallet(tonweb.provider, {
    address: walletAddr,
  });
  const purchasedAmount = await getJettonBalance(
    launchpadInfo.soldJetton,
    accountTimeLockAddr.toFriendly()
  );
  console.log("purchased amount is", purchasedAmount);
  return purchasedAmount;
};

export const getJettonDetails = async (address: string) => {
  try {
    const contractAddr = Address.parse(address);
    const minter = await makeGetCall(
      contractAddr,
      "get_jetton_data",
      [],
      async ([totalSupply, __, adminCell, contentCell]) => ({
        ...(await readJettonMetadata(contentCell as unknown as Cell)),
        admin: cellToAddress(adminCell),
        totalSupply: totalSupply as BN,
      }),
      tonClient
    );
    console.log("jetton: ", minter);
    return minter;
  } catch (e) {
    console.log(e);
    return { metadata: {} };
  }
};
