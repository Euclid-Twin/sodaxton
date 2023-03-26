import {
  HttpRequestType,
  httpRequest,
  API_HOST,
  SUCCESS_CODE,
} from "@/utils/request";
import { CHAIN_NAME } from "@/utils/constant";
export enum AssetType {
  FT = 0,
  PFT = 1,
  NFT = 2,
  Other = 3,
}
export interface Collection {
  id: string;
  name: string;
  image?: string;
}
export type Token = {
  type: AssetType;
  chainId?: number;
  contract: string;
  balance?: number;
};
export interface NFT extends Token {
  tokenId?: string;
  source?: string;
  owner?: string;
  minter?: string;
  meta?: any;
}

export type TokenCache = {
  chainId?: number;
  contract?: string;
  tokenId?: string;
  source?: string;
};

export enum ProposalStatusEnum {
  SOON,
  OPEN,
  VALID,
  INVALID,
}
export enum ProposalVoteEnum {
  ADDRESS = 1,
  NFT = 2,
  SON = 3,
}
export interface IDaoItem {
  name: string;
  start_date: number;
  total_member: number;
  facebook: string;
  twitter: string;
  id: string;
  img: string;
  isMyDao?: boolean;
  centralized: number;
  tags: string[];
  types: string[];
  status: string;
}
export interface IGetDaoListParams {
  addr?: string;
  name?: string;
  page: number;
  gap: number;
  chain_name: string;
}
export interface IGetDaoListResult {
  total: number;
  data: IDaoItem[];
}
export const getDaoList = async (
  params: IGetDaoListParams
): Promise<IGetDaoListResult> => {
  const url = `${API_HOST}/dao`;
  const res = await httpRequest({ url, params });
  console.debug("[core-dao] getDaoList: ", res);
  // FIXME: handle error
  if (res.error) return { total: 0, data: [] };
  return res.data;
};

export interface IProposalItem {
  id: string;
  title: string;
  description: string;
  start_time: number;
  snapshot_block: number;
  end_time: number;
  ballot_threshold: number;
  status: ProposalStatusEnum;
  items: string[]; // vote options
  results: number[]; // votes
  voter_type: ProposalVoteEnum; // 1: one vote per address, 2: one vote per NFT, 3: on vote per SON
}
export const getProposalStatus = (
  item: IProposalItem,
  blockheight?: Number
): ProposalStatusEnum => {
  // return ProposalStatusEnum.OPEN; //TODO for test

  const now = Date.now();
  const totalVotes = item.results.reduce((a, b) => a + b);
  if (item.items.length === 1 && totalVotes >= item.ballot_threshold) {
    return ProposalStatusEnum.VALID;
  }
  if (now < item.start_time) {
    return ProposalStatusEnum.SOON;
  } else if (now > item.start_time && now < item.end_time) {
    if (blockheight) {
      return item.snapshot_block <= blockheight
        ? ProposalStatusEnum.OPEN
        : ProposalStatusEnum.SOON;
    } else {
      return ProposalStatusEnum.OPEN;
    }
  } else if (now >= item.end_time) {
    if (totalVotes >= item.ballot_threshold) {
      return ProposalStatusEnum.VALID;
    } else {
      return ProposalStatusEnum.INVALID;
    }
  }
};

export const getProposalPermission = async (
  dao: string,
  address: string,
  chain_name: string
): Promise<boolean> => {
  const url = `${API_HOST}/proposal/permission`;
  const params = {
    dao,
    addr: address,
    chain_name,
  };
  const res = await httpRequest({ url, params });
  console.debug("[core-dao] getProposalPermission: ", res);
  // FIXME: handle error
  return res.data;
};

export interface IGetProposalListParams {
  dao: string;
  page?: number;
  gap?: number;
  chain_name: string;
  currentBlockHeight?: number;
}
export interface IGetProposalListResult {
  total: number;
  data: IProposalItem[];
}
export const getProposalList = async (
  params: IGetProposalListParams
): Promise<IGetProposalListResult> => {
  const v2 = API_HOST.slice(0, API_HOST.length - 1) + "2";
  const url = `${v2}/proposal`;
  const res = await httpRequest({ url, params });
  console.debug("[core-dao] getProposalList: ", res);
  // FIXME: handle error
  if (res.error) return { total: 0, data: [] };
  const result = res.data;

  //get current block height
  // let currentBlockHeight = 0;
  // if (!params.chain_name.includes('flow')) {
  //     const blockRes: any = await invokeWeb3Api({
  //         module: 'eth',
  //         method: 'getBlockNumber',
  //     });
  //     const { result } = blockRes;
  //     currentBlockHeight = result || 0;
  // }

  result.data.forEach(
    (temp: any) =>
      (temp.status = getProposalStatus(temp, params.currentBlockHeight))
  );
  return result;
};

export interface ICreateProposalParams {
  creator: string;
  snapshot_block: number;
  collection_id: string;
  title: string;
  description: string;
  start_time: number;
  end_time: number;
  ballot_threshold: number;
  items: string[];
  voter_type: number;
  sig: string;
  chain_name: string;
}
export const createProposal = async (params: ICreateProposalParams) => {
  const url = `${API_HOST}/proposal/create`;
  const res = await httpRequest({ url, params, type: HttpRequestType.POST });
  console.debug("[core-dao] createProposal: ", res);
  return res;
};

export interface IVoteProposalParams {
  voter: string;
  collection_id: string;
  proposal_id: string;
  item: string;
  sig: string;
  chain_name: string;
}
export const vote = async (params: IVoteProposalParams) => {
  const url = `${API_HOST}/proposal/vote`;
  const res = await httpRequest({ url, params, type: HttpRequestType.POST });
  console.debug("[core-dao] vote: ", res);
  if (res.error || res.code !== SUCCESS_CODE) {
    return false;
  } else {
    return true;
  }
};

export interface IGetUserVoteParams {
  proposal_id: string;
  collection_id: string;
  addr: string;
}
export interface IGetUserVoteResult {
  collection_id: string;
  id: string;
  voter: string;
  item: string;
  votes: string;
}
export const getUserVoteInfo = async (
  params: IGetUserVoteParams
): Promise<IGetUserVoteResult | null> => {
  const url = `${API_HOST}/proposal/votes`;
  const res = await httpRequest({ url, params });
  console.debug("[core-dao] getUserVoteInfo: ", res);
  // FIXME: handle error
  if (res.error) return null;
  return res.data;
};

export interface IBind1Params {
  addr: string;
  tid: string;
  sig?: string;
  platform: string;
  chain_name: string;
  pubkey?: string;
}
export const bind1WithWeb3Proof = async (params: IBind1Params) => {
  const url = `${API_HOST}/bind-addr`;
  const res = await httpRequest({ url, params, type: HttpRequestType.POST });
  console.debug("[core-account] bind1WithWeb3Proof: ", params, res);
  if (res.error) return false;
  return true;
};

export interface IGetBindResultParams {
  addr?: string;
  tid?: string;
}
export interface IBindResultData {
  addr: string;
  tid: string;
  platform: string;
  content_id?: string;
}
export const getBindResult = async (
  params: IGetBindResultParams
): Promise<IBindResultData[]> => {
  const url = `${API_HOST}/bind-attr`;
  if (!params.addr) {
    return [];
  }
  try {
    const res = await httpRequest({ url, params });
    console.debug("[core-account] getBindResult: ", params, res);
    if (res.error) return [];
    return res.data as IBindResultData[];
  } catch (e) {
    console.error(e);
    return [];
  }
};
export interface ICollectionItem {
  id: string;
  name: string;
  img: string;
  dao: IDaoItem;
}
export const getCollectionDaoByCollectionId = async (params: {
  id: string;
  chainId?: number;
}): Promise<ICollectionItem | null> => {
  const { id, chainId } = params;
  const url = `${API_HOST}/collection/${id}`;
  const res = await httpRequest({ url });
  console.debug("[core-dao] getCollectionDaoByCollectionId: ", res);
  // FIXME: handle error
  if (res.error) return null;
  return res.data || null;
};

export const getUserVotePermission = async (params: {
  voter_type: number;
  collection_id: string | number;
  voter: string;
  chain_name: string;
  proposal_id: string;
}) => {
  const url = `${API_HOST}/proposal/votes/num`;
  const res = await httpRequest({ url, params, type: HttpRequestType.GET });
  console.debug("getUserVotePermission: ", res);
  const { data } = res;
  if ((typeof data === "number" && data > 0) || (data && data.votes > 0)) {
    return true;
  } else {
    return false;
  }
};

export const getCreatedCollectionList = async (params: {
  creator: string;
  page?: number;
  gap?: number;
  chain_name?: string;
  name?: string;
}) => {
  const url = `${API_HOST}/collection/created-by`;
  params.chain_name = CHAIN_NAME;
  const res = await httpRequest({ url, params, type: HttpRequestType.GET });
  return res;
};
