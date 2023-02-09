import * as Api from "./apis";
import { Collection, NFT } from "./apis";
import { CHAIN_NAME } from "@/utils/constant";
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
  application: string;
  appid: string;
  sig: string;
  chain_name: string;
}) => {
  const { address, application, appid, sig, chain_name } = params;
  return Api.bind1WithWeb3Proof({
    addr: address,
    platform: application,
    tid: appid,
    sig,
    chain_name,
  });
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
