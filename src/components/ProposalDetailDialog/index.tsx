import React, { useMemo, useState, useEffect } from "react";
import "./index.less";
import { Button, Modal, Radio, Space, message, Tooltip } from "antd";
import IconClose from "@/assets/images/icon-close.png";
import ProposalStatus from "../ProposalItemStatus";
import ProposalResults from "../ProposalResults";
import {
  Proposal,
  getUserVoteInfo,
  getProposalPermission,
} from "@/api/proposal";
import { ProposalStatusEnum } from "@/api/apis";
import { formatTimestamp, sha3 } from "@/utils";
// import { useDaoModel, useWalletModel } from '@/models';
import { useModel } from "umi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { CHAIN_NAME } from "@/utils/constant";
import { vote as voteProposal } from "@/api/server";
interface IProps {
  show: boolean;
  detail: Proposal;
  onClose: (updatedProposalId?: string) => void;
  inDao?: boolean;
}

export default (props: IProps) => {
  const { show, detail, onClose, inDao } = props;
  const [vote, setVote] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { currentDao, address } = useModel("app");
  const [voted, setVoted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [signConfirmContent, setSignConfirmContent] = useState(null);

  const totalSupporters = useMemo(() => {
    const totalVotersNum = detail.results.reduce((a, b) => a + b);
    if (totalVotersNum >= detail.ballotThreshold) {
      return totalVotersNum;
    } else {
      return `${totalVotersNum}/${detail.ballotThreshold}`;
    }
  }, [detail]);

  const handleVoteChange = (e: any) => {
    setVote(e.target.value);
  };

  const handleVoteSubmit = async () => {
    if (!vote) {
      message.warn("Please set one option to vote.");
      return;
    }
    try {
      setSubmitting(true);
      //@ts-ignore
      const params = {
        voter: address,
        collectionId: currentDao!.id,
        proposalId: detail.id,
        item: vote,
        sig: "",
        chain_name: CHAIN_NAME,
      };
      const result = await voteProposal(params);
      if (result) {
        message.success("Vote successful.");
        setSubmitting(false);
        onClose();
      } else {
        message.error("Vote failed");
        setSubmitting(false);
      }
      //   const msg = {
      //     type: "vote",
      //     data: { ...params },
      //   };
      //   window.Telegram.WebApp.sendData(JSON.stringify(msg));
    } catch (e) {
      setSubmitting(false);
      console.error(e);
      message.warn("Vote failed.");
      setSignConfirmContent(null);
    }
  };

  useEffect(() => {
    (async () => {
      if (show && address && currentDao && detail) {
        const res = await getUserVoteInfo({
          proposalId: detail.id,
          daoId: currentDao.id,
          address,
        });
        if (res) {
          setVoted(true);
          setVote(res.item);
        }
        if (detail.status === ProposalStatusEnum.OPEN) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
        if (currentDao?.centralized === 1) {
          // public dao
          setCanVote(true);
        } else {
          const res = await getProposalPermission(
            currentDao?.id,
            address,
            CHAIN_NAME
          );
          setCanVote(res);
        }
      }
    })();
  }, [show]);

  return (
    <Modal
      footer={null}
      className="common-modal"
      visible={show}
      closable={false}
      width={300}
    >
      <div className="container">
        <div className="header">
          <p className="end-time">
            End at {formatTimestamp(detail.endTime, "YYYY-MM-DD HH:mm:ss")}
          </p>
          <img src={IconClose} alt="" onClick={() => onClose()} />
        </div>
        <div className="header-content">
          <div className="header-left">
            <p className="title">{detail.title}</p>
            <p className="total-supporter">Votes - {totalSupporters}</p>
          </div>
          <div className="header-right">
            <ProposalStatus status={detail.status} />
          </div>
        </div>
        <div className="divide-line"></div>
        <div
          className="desc"
          dangerouslySetInnerHTML={{ __html: detail.description }}
        >
          {/* <p>{detail.description}</p> */}
        </div>
        <div className="vote-submit-results-container">
          <ProposalResults items={detail.items} results={detail.results} />
          {isOpen && canVote && (
            <div className="vote-container">
              <p className="vote-title">
                {voted ? "Your vote" : "Cast your vote"}
              </p>
              <Radio.Group
                onChange={handleVoteChange}
                value={vote}
                className="custom-radio"
              >
                <Space direction="vertical">
                  {detail.items.map((option, index) => (
                    <Radio
                      value={option}
                      key={index}
                      disabled={voted && vote !== option}
                      className="custom-radio-item"
                    >
                      {option}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
              {!voted && (
                <div>
                  <Button
                    type="primary"
                    onClick={handleVoteSubmit}
                    className="vote-btn"
                    loading={submitting}
                  >
                    Vote now
                  </Button>
                  <Tooltip title="Your vote can not be changed.">
                    <ExclamationCircleOutlined />
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
