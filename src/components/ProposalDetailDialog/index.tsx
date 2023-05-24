import React, { useMemo, useState, useEffect } from "react";
import "./index.less";
import {
  Button,
  Modal,
  Radio,
  Space,
  message,
  Tooltip,
  Checkbox,
  Input,
} from "antd";
import IconClose from "@/assets/images/icon-close.png";
import ProposalStatus from "../ProposalItemStatus";
import ProposalResults from "../ProposalResults";
import {
  Proposal,
  getUserVoteInfo,
  getProposalPermission,
  vote as voteProposal,
} from "@/api/proposal";
import {
  ProposalStatusEnum,
  getUserVotePermission,
  getProposalCommentList,
} from "@/api/apis";
import { formatTimestamp, sha3 } from "@/utils";
// import { useDaoModel, useWalletModel } from '@/models';
import { useModel } from "umi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { CHAIN_NAME } from "@/utils/constant";
import ProposalCommentsDialog from "../ProposalCommentsDialog";
const TextArea = Input.TextArea;
// import { vote as voteProposal } from "@/api/server";
interface IProps {
  show: boolean;
  detail: Proposal;
  onClose: (updatedProposalId?: string) => void;
  inDao?: boolean;
  noVote?: boolean;
}
const MaxCommentLength = 400;
export default (props: IProps) => {
  const { show, detail, onClose, inDao, noVote } = props;
  const [vote, setVote] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { currentDao, address } = useModel("app");
  const [voted, setVoted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [signConfirmContent, setSignConfirmContent] = useState(null);
  const [submitComment, setSubmitComment] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
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

  const getCommentsList = async () => {
    const params = {};
  };

  const handleCommentChange = (e: any) => {
    const value = e.target.value;
    setComment(value);
    if (value && value.length > MaxCommentLength) {
      setCommentError(`No more than ${MaxCommentLength} characters`);
    } else {
      setCommentError("");
    }
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
        comment: comment,
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
          const res = await getUserVotePermission({
            collection_id: currentDao?.id,
            voter_type: detail.voteType,
            voter: address,
            chain_name: CHAIN_NAME,
            proposal_id: detail.id,
          });
          setCanVote(res);
        }
      }
    })();
  }, [show]);

  return (
    <>
      <Modal
        footer={null}
        className="common-modal"
        visible={show}
        closable={false}
        // width={300}
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
              <p className="total-supporter">Vote(s) - {totalSupporters}</p>
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
            <div style={{ marginTop: "14px" }}>
              <Button type="link" onClick={() => setCommentModalOpen(true)}>
                Comments
              </Button>
            </div>
            {!noVote && isOpen && canVote && (
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
                {canVote && !voted && (
                  <div className="comment">
                    <Checkbox
                      checked={submitComment}
                      onChange={(e) => {
                        setSubmitComment(e.target.checked);
                      }}
                      className="proposal-start-now"
                    >
                      Submit Comment
                    </Checkbox>
                    {submitComment && (
                      <TextArea
                        value={comment}
                        onChange={handleCommentChange}
                        placeholder="Comment"
                      />
                    )}
                    {commentError && (
                      <p className="comment-error">{commentError}</p>
                    )}
                  </div>
                )}
                {!voted && (
                  <div>
                    <Button
                      type="primary"
                      onClick={handleVoteSubmit}
                      className="primary-btn vote-btn"
                      loading={submitting}
                    >
                      Vote
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
      <ProposalCommentsDialog
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        collection_id={currentDao!.id}
        proposal_id={detail.id}
      />
    </>
  );
};
