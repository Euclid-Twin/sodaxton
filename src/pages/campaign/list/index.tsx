import Back from "@/components/Back";
import "./index.less";
import { useState, useEffect, useRef } from "react";
import { useModel, history } from "umi";
import InfiniteScroll from "react-infinite-scroll-component";
import { PAGE_SIZE } from "@/utils/constant";
import { Spin } from "antd";
import { CampaignStatus, ICampaign, getCampaignList } from "@/api";
import TasksModal from "../detail";
export default () => {
  const { address, currentDao } = useModel("app");
  const [list, setList] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const page = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<ICampaign>();
  const fetchList = async () => {
    if (!currentDao) return;
    const res = await getCampaignList(currentDao?.id, page.current, PAGE_SIZE);
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
    fetchList();
  }, []);

  return (
    <div className="page-container campaigns">
      <Back />
      <h1 className="page-title">IDO Campaign</h1>

      <InfiniteScroll
        dataLength={list.length}
        next={fetchList}
        hasMore={hasMore}
        loader={<Spin spinning></Spin>}
        height={500}
        className="dao-list campaign-list"
        // endMessage={
        //   <p style={{ textAlign: "center" }}>
        //     <b>Yay! You have seen it all</b>
        //   </p>
        // }
      >
        {list.map((item) => (
          <div
            className="campaign-item"
            onClick={() => {
              setCurrentCampaign(item);
              setModalVisible(true);
            }}
          >
            <div className="status">{item.status}</div>
            <img src={item.image_url} alt="" />
            <div className="info">
              <p className="title">{item.title}</p>
              <p className="desc">{item.description}</p>
              <div className="rewards">
                <span>Rewards Pool</span>
                <span
                  className="link"
                  onClick={() => window.open(item.rewards_url)}
                >
                  {item.rewards}
                </span>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p style={{ textAlign: "center", marginTop: "50px" }}>
            <b>There is no campaigns of this DAO.</b>
          </p>
        )}
      </InfiniteScroll>

      <TasksModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        campaign={currentCampaign}
      />
    </div>
  );
};
