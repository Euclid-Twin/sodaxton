import "../daoDetail/index.less";
import { useState, useEffect } from "react";
import { useLocation, useParams, useModel } from "umi";
import {
  getProposalList,
  getProposalPermission,
  Proposal,
} from "@/api/proposal";
import { CHAIN_NAME } from "@/utils/constant";
import { getCollectionDaoByCollectionId } from "@/api";
import { Pagination, Button, Modal } from "antd";
import { formatTimestamp } from "@/utils";
import ProposalDetailDialog from "@/components/ProposalDetailDialog";

const PAGE_SIZE = 10;

export default () => {
  const location: any = useLocation();
  console.log(location);
  const { currentDao, setCurrentDao, address } = useModel("app");

  const { dao } = location.query;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<Proposal[]>([]);
  const [proposal, setProposal] = useState<Proposal>();

  const fetchDaoDetail = async (daoId: string) => {
    const collectionId = daoId;
    const collectionDao = await getCollectionDaoByCollectionId({
      id: collectionId,
    });
    if (collectionDao) {
      const dao = collectionDao.dao;
      setCurrentDao(dao);
      return collectionDao;
    }
  };

  const fetchProposalList = async (daoId: string) => {
    const listResp = await getProposalList({
      dao: daoId,
      page,
      gap: PAGE_SIZE,
      chain_name: CHAIN_NAME,
    });
    const list = listResp.data;
    setTotal(listResp.total);
    setList(list);
  };

  useEffect(() => {
    fetchDaoDetail(dao);
  }, [dao]);
  useEffect(() => {
    fetchProposalList(dao);
  }, [dao, page]);

  return (
    <div className="page-container dao-detail-container">
      <h1 className="page-title">Dao detail</h1>
      <div className="dao-detail-header">
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
      <div className="proposal-list-container">
        <div className="proposal-list-header">
          <p>Proposals</p>
        </div>
        <div className="proposal-list">
          {list.map((item) => (
            <div className="proposal-detail" onClick={() => setProposal(item)}>
              <p className="proposal-title">{item.title}</p>
            </div>
          ))}
        </div>
        <div className="list-pagination">
          <Pagination
            total={total}
            pageSize={PAGE_SIZE}
            onChange={(page: number) => setPage(page)}
            current={page}
            showSizeChanger={false}
          />
        </div>
      </div>
      {proposal && (
        <ProposalDetailDialog
          show={proposal.id !== undefined}
          detail={proposal}
          onClose={() => setProposal(undefined)}
          noVote={true}
        />
      )}
    </div>
  );
};
