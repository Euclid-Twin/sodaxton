import * as Api from "./apis";
import { Collection, NFT } from "./apis";
import { CHAIN_NAME, PLATFORM } from "@/utils/constant";
import {
  HttpRequestType,
  httpRequest,
  API_HOST,
  SUCCESS_CODE,
} from "@/utils/request";
export interface CollectionDao {
  collection: Collection;
  dao: DaoItem;
}

export const getCollectionDaoByCollectionId = async (params: {
  id: string;
  chainId?: number;
}): Promise<CollectionDao | null> => {
  const item = await Api.getCollectionDaoByCollectionId(params);
  if (!item) return null;
  const dao = item.dao;
  // TODO: DAO share the same id with collection
  if (dao) {
    if (!dao.id) dao.id = item.id;
    if (!dao.img) dao.img = item.img;
    if (!dao.name) dao.name = item.name;
  }
  return {
    collection: {
      id: item.id,
      name: item.name,
      image: item.img,
    },
    dao: toDaoItem(dao),
  };
};
export interface DaoItem {
  name: string;
  startDate: number;
  totalMember: number;
  accounts: any;
  id: string;
  image: string;
  centralized: number;
  tags: string[];
  types: string[];
  status: string;
  isMyDao?: boolean;
}
export const toDaoItem = (d: Api.IDaoItem): DaoItem => {
  return {
    name: d.name,
    startDate: d.start_date,
    totalMember: d.total_member,
    accounts: {
      facebook: d.facebook,
      twitter: d.twitter,
    },
    id: d.id,
    image: d.img,
    centralized: d.centralized,
    tags: d.tags,
    types: d.types,
    status: d.status,
  };
};
export const createDao = async () => {};
export const getDaoList = async (params: {
  address?: string;
  name?: string;
  offset?: number;
  limit?: number;
  //   chain_name: string;
}): Promise<{ total: number; data: DaoItem[] }> => {
  const { address, name, offset, limit = 10 } = params;
  let page: number = 1;
  if (offset && limit && limit > 0) page = Math.floor(offset / limit) + 1;
  const daos = await Api.getDaoList({
    addr: address,
    name,
    page,
    gap: limit,
    chain_name: CHAIN_NAME,
  });
  const res: { total: number; data: DaoItem[] } = {
    total: daos.total,
    data: [],
  };
  for (const d of daos.data) {
    res.data.push(toDaoItem(d));
  }
  return res;
};

export const getDaoDetail = async () => {};
export const editDao = async () => {};

export const bind1WithWeb3Proof = async (params: {
  address: string;
  appid: string;
  sig?: string;
  pubkey?: string;
  // chain_name: string;
}) => {
  const { address, appid, sig, pubkey } = params;
  return Api.bind1WithWeb3Proof({
    addr: address,
    platform: PLATFORM,
    tid: appid,
    sig: sig,
    pubkey: pubkey,
    chain_name: CHAIN_NAME,
  });
};

export const unbind = async (params: {
  addr: string;
  tid: string;
  sig?: string;
  pubkey?: string;
  platform?: string;
  chain_name?: string;
}) => {
  params.platform = PLATFORM;
  params.chain_name = CHAIN_NAME;
  const url = `${API_HOST}/unbind-addr`;
  const res = await httpRequest({ url, params, type: HttpRequestType.POST });
  console.debug("[core-account] unbindAddr: ", params, res);
  if (res.error) return false;
  return true;
};
export interface BindInfo {
  address: string;
  application: string;
  appid: string;
  contentId?: string;
}
export const getBindResult = async (params: {
  address?: string;
  application?: string;
  appid?: string;
}): Promise<BindInfo[]> => {
  const { address, application, appid } = params;
  const res = [];
  // FIXME: add application query
  const bindRes = await Api.getBindResult({
    addr: address,
    tid: appid,
  });
  for (const b of bindRes) {
    res.push({
      address: b.addr,
      application: b.platform,
      appid: b.tid,
      contentId: b.content_id,
    });
  }
  return res;
};

export const genCollectionDeployTx = async (params: {
  owner: string;
  name: string;
  image: string;
  description: string;
  social_links?: string[];
}) => {
  const url = `${API_HOST}/nft/collection/gen`;
  const data = {
    chain_name: CHAIN_NAME,
    owner: params.owner,
    royalty: 0.1,
    royalty_address: params.owner,
    metadata: {
      name: params.name,
      image: params.image,
      cover_image: params.image,
      description: params.description,
      social_links: params.social_links || [""],
    },
  };
  const res = await httpRequest({
    url,
    params: data,
    type: HttpRequestType.POST,
  });
  console.log("[gen-collection-tx]: ", res);
  return res.data;
};

export const genNFTMintTx = async (params: {
  owner: string;
  collection: {
    name: string;
    address: string;
  };
  name: string;
  description: string;
  image: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  content_type?: string;
  content_url?: string;
}) => {
  const url = `${API_HOST}/nft/item/gen`;
  const data = {
    chain_name: CHAIN_NAME,
    owner: params.owner,
    collection: {
      name: params.collection.name,
      addr: params.collection.address,
    },
    metadata: {
      name: params.name,
      image: params.image,
      description: params.description,
      attributes: params.attributes || [],
      content_type: params.content_type || "image",
      content_url: params.content_url || params.image,
    },
  };
  const res = await httpRequest({
    url,
    params: data,
    type: HttpRequestType.POST,
  });
  console.log("[gen-collection-tx]: ", res);
  return res.data;
};

export const uploadFile = async (files: File[]) => {
  const url = `${API_HOST}/nft/upload-img`;
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", file);
  }
  const res = await httpRequest({
    url,
    params: formData,
    type: HttpRequestType.POST,
    requestType: "form",
  });
  console.log("uploadFile: ", res);
  return res.data;
};

export const getChatMember = async (chatId: number, userId: number) => {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
  const res = await httpRequest({
    url,
    params: null,
    type: HttpRequestType.GET,
  });
  const { user } = res.result;
  return user?.username;
};

export const createNewStickerSet = async (
  name: string,
  userId: number,
  file: File
) => {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/createNewStickerSet`;
  const formData = new FormData();
  const res = await httpRequest({
    url,
  });
};
