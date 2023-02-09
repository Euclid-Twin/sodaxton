import "./index.less";
import { useState, useEffect } from "react";
import { useParams, useModel } from "umi";
import { getCollectionDaoByCollectionId } from "@/api";
import {
  getProposalList,
  getProposalPermission,
  Proposal,
} from "@/api/proposal";
import { CHAIN_NAME } from "@/utils/constant";
import { formatTimestamp } from "@/utils";
import { Pagination, Button, Modal } from "antd";
import { history } from "umi";
import ProposalItemStatus from "@/components/ProposalItemStatus";
import ProposalResults from "@/components/ProposalResults";
const PAGE_SIZE = 10;

export default () => {
  const { currentDao, setCurrentDao, address } = useModel("app");
  const { id }: any = useParams();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<Proposal[]>([]);
  const [inDao, setInDao] = useState(false);
  const [proposal, setProposal] = useState<Proposal>({});

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
      fetchProposalList(id);
    }
  }, [page]);

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  return (
    <div className="page-container dao-detail-container">
      <h1 className="page-title">Dao detail</h1>
      <Button
        type="primary"
        className="btn-new-proposal"
        onClick={() => history.push("/proposals/create")}
        disabled={!inDao}
      >
        New Proposal
      </Button>
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
            onChange={handleChangePage}
            current={page}
            showSizeChanger={false}
          />
        </div>
      </div>
      <Modal
        open={proposal.id !== undefined}
        footer={null}
        onCancel={() => setProposal({})}
        destroyOnClose
        style={{}}
      >
        <div className="proposal-content">
          <p className={"proposal-title"}>{proposal!.title}</p>
          <p
            className={"proposal-desc"}
            dangerouslySetInnerHTML={{ __html: proposal!.description }}
          >
            {/* {item.description} */}
          </p>
          <div className={"proposal-item-footer"}>
            <ProposalItemStatus status={proposal!.status} />
            <p className="start-date-time">
              Duration: {formatTimestamp(proposal!.startTime)} -{" "}
              {formatTimestamp(proposal!.endTime)}
            </p>
          </div>
          <ProposalResults
            items={proposal!.items}
            results={proposal!.results}
          />
        </div>
      </Modal>
    </div>
  );
};
