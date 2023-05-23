import InfiniteScroll from "react-infinite-scroll-component";
import { PAGE_SIZE } from "@/utils/constant";
import "./index.less";
import { useState, useEffect, useRef } from "react";
import { getProposalCommentList } from "@/api/apis";
import { Modal, Spin } from "antd";
import { formatTimestamp } from "@/utils";

interface IProps {
  open: boolean;
  onClose: () => void;
  collection_id: string;
  proposal_id: string;
}
export default (props: IProps) => {
  const { open, onClose, collection_id, proposal_id } = props;
  const page = useRef(1);
  const [hasMore, setHasMore] = useState(true);

  const [list, setList] = useState<{ comment: string; vote_time: number }[]>(
    []
  );
  const fetchList = async () => {
    const params = {
      page: page.current,
      gap: PAGE_SIZE,
      collection_id,
      proposal_id,
    };
    const res = await getProposalCommentList(params);
    if (res && res.data) {
      if (res.data.length > 0) {
        setHasMore(true);
        page.current += 1;
        if (res.data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
      setList([...list, ...res.data]);
    }
  };
  useEffect(() => {
    if (open) {
      fetchList();
    }
    return () => {
      page.current = 1;
      setList([]);
    };
  }, [open]);
  return (
    <Modal
      footer={null}
      className="common-modal"
      open={open}
      onCancel={onClose}
      destroyOnClose
    >
      <div className="comments-modal-title">Comments</div>
      <div className="comments-list">
        <InfiniteScroll
          dataLength={list.length}
          next={fetchList}
          hasMore={hasMore}
          loader={<Spin spinning></Spin>}
          height={500}
          className="dao-list"
        >
          {list.map((item) => (
            <div className="comment-item">
              <p>{item.comment}</p>
              <p className="vote-time">{formatTimestamp(item.vote_time)}</p>
            </div>
          ))}
          {list.length === 0 && <p className="no-data">No data</p>}
        </InfiniteScroll>
      </div>
    </Modal>
  );
};
