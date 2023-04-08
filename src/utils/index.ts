import dayjs from "dayjs";
import { message } from "antd";
import TonWeb from "tonweb";

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
