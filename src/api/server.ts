import { ICreateProposalParams } from "./apis";
import { httpRequest, HttpRequestType } from "@/utils/request";
const API_HOST = process.env.TON_SERVER;
console.log("tonserver: ", API_HOST);
export const createProposal = async (params: any) => {
  const url = `${API_HOST}/api/new-proposal`;
  const res = await httpRequest({ url, params, type: HttpRequestType.POST });
  console.debug("[core-dao] createProposal: ", res);
  return res;
};

export const vote = async (params: {
  voter: string;
  collectionId: string;
  proposalId: string;
  item: string;
  sig: string;
  chain_name: string;
}) => {
  const { voter, collectionId, proposalId, item, sig, chain_name } = params;
  const url = `${API_HOST}/api/vote`;
  return await httpRequest({ url, params, type: HttpRequestType.POST });
};
