import dayjs from "dayjs";

export const formatTimestamp = (
  timestamp?: number | string,
  format: string = "MM/DD/YYYY"
) => {
  if (!timestamp) return "";
  return dayjs(timestamp).format(format);
};

export const sha3 = (str: string) => {};
