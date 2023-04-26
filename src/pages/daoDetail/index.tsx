import "./index.less";
import { useState, useEffect } from "react";
import { useParams, useModel } from "umi";

import {
  getProposalList,
  getProposalPermission,
  Proposal,
} from "@/api/proposal";
import { CHAIN_NAME } from "@/utils/constant";
import { formatTimestamp, getUrl } from "@/utils";
import { Pagination, Button, Modal, Spin, message } from "antd";
import { history } from "umi";
import ProposalItemStatus from "@/components/ProposalItemStatus";
import ProposalResults from "@/components/ProposalResults";
import ProposalDetailDialog from "@/components/ProposalDetailDialog";
import Back from "@/components/Back";
import axios from "axios";
import { getCollectionDaoByCollectionId, Collection } from "@/api";
const PAGE_SIZE = 10;

export default () => {
  const { currentDao, setCurrentDao, address } = useModel("app");
  const { id }: any = useParams();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<Proposal[]>([]);
  const [inDao, setInDao] = useState(false);
  const [proposal, setProposal] = useState<Proposal>();
  const [loading, setLoading] = useState(false);
  const [chatLink, setChatLink] = useState("");
  const [collectionDetail, setCollectionDetail] = useState<Collection>();
  const fetchDaoDetail = async (daoId: string) => {
    const collectionId = daoId;
    const collectionDao = await getCollectionDaoByCollectionId({
      id: collectionId,
    });
    if (collectionDao) {
      const dao = collectionDao.dao;
      dao.image = getUrl(dao.image);
      setCurrentDao(dao);
      setCollectionDetail(collectionDao.collection);
      return collectionDao;
    }
  };

  const getChatLink = async () => {
    try {
      const accessToken = process.env.BOT_TOKEN;
      const { data } = await axios.get(
        `https://api.telegram.org/bot${accessToken}/getChat?chat_id=${id}`
      );
      console.log("chat: ", data);
      if (data && data.result) {
        const res = data.result;
        if (res.invite_link) {
          setChatLink(res.invite_link);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchProposalList = async (daoId: string) => {
    try {
      setLoading(true);
      const listResp = await getProposalList({
        dao: daoId,
        page,
        gap: PAGE_SIZE,
        chain_name: CHAIN_NAME,
      });
      const list = listResp.data;
      setTotal(listResp.total);
      setList(list);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalPermission = async () => {
    const res = await getProposalPermission(
      currentDao!.id,
      address!,
      CHAIN_NAME
    );
    setInDao(res);
  };
  useEffect(() => {
    if (currentDao && address) {
      // fetchUserInDao();
      fetchProposalPermission();
    }
  }, [currentDao, address]);

  useEffect(() => {
    if (id) {
      fetchDaoDetail(id);
      getChatLink();
    }
  }, [id]);
  useEffect(() => {
    fetchProposalList(id);
  }, [page]);

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  const handleDetailDialogClose = (updatedProposalId?: string) => {
    setProposal(undefined);
    if (currentDao?.id) {
      fetchProposalList(currentDao!.id);
    }
  };

  return (
    <div className="page-container dao-detail-container">
      <Back />
      <h1 className="page-title">Dao detail</h1>
      <div className="dao-detail-header">
        <div className="dao-detail">
          <img src={currentDao?.image} alt="" />
          <div className="dao-detail-info">
            <p className="dao-name">{currentDao?.name}</p>
            <p className="dao-info-item">
              <span className="label">Create date</span>
              <span className="value">
                {formatTimestamp(currentDao?.startDate)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="launchpad-container">
        <Button
          type="default"
          className="primary-default btn-open-chat"
          onClick={() => {
            if (chatLink) {
              window.open(chatLink);
            } else {
              message.warn("No invite link for this group.");
            }
          }}
        >
          <img width={14} src="/icon-tg.png" alt="" />
          Open Chat
        </Button>
        <Button
          type="default"
          className="primary-default btn-open-chat"
          onClick={() => {
            history.push("/launchpads");
          }}
        >
          LaunchPad
        </Button>
        {collectionDetail?.enable_other_mint && (
          <Button
            type="default"
            className="primary-default btn-open-chat"
            onClick={() => {
              history.push(
                `/collection/mint?collection_addr=${collectionDetail?.contract}`
              );
            }}
          >
            Mint NFT
          </Button>
        )}
      </div>

      <div className="proposal-list-container">
        <div className="proposal-list-header">
          <p>Proposals</p>
          <Button
            type="primary"
            className="primary-btn btn-new-proposal"
            onClick={() => history.push("/proposals/create")}
            disabled={!inDao}
          >
            New Proposal
          </Button>
        </div>
        <Spin spinning={loading}>
          <div className="proposal-list">
            {list.map((item) => (
              <div
                className="proposal-detail"
                onClick={() => setProposal(item)}
              >
                <p className="proposal-title">{item.title}</p>
                <img src="/icon-detail-arrow.svg" alt="" />
              </div>
            ))}
          </div>
        </Spin>
        <div className="list-pagination">
          <Pagination
            total={total}
            pageSize={PAGE_SIZE}
            onChange={handleChangePage}
            current={page}
            showSizeChanger={false}
          />
        </div>
      </div>
      {proposal && (
        <ProposalDetailDialog
          show={proposal.id !== undefined}
          detail={proposal}
          onClose={handleDetailDialogClose}
        />
      )}
    </div>
  );
};
