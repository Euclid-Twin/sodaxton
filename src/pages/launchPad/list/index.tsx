import "./index.less";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useModel, history } from "umi";
import { LaunchPadInfo, getTgRawMessages } from "@/api/apis";
import { message, Spin, Button } from "antd";
import Back from "@/components/Back";
import InfiniteScroll from "react-infinite-scroll-component";

import { PAGE_SIZE } from "@/utils/constant";
import { isDaoAdmin, getJettonDetails } from "@/utils";

export default () => {
  const [list, setList] = useState<LaunchPadInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const page = useRef(1);

  const { currentDao, address, walletName, setCurrentLaunchpad } =
    useModel("app");

  useEffect(() => {
    (async () => {
      if (currentDao && address) {
        const _isAdmin = await isDaoAdmin(address, Number(currentDao!.id));
        console.log("_isAdmin: ", _isAdmin);
        setIsAdmin(_isAdmin);
      }
    })();
  }, [currentDao, address]);
  const getLaunchPads = async () => {
    // if (currentDao) {
    try {
      setLoading(true);
      const res = await getTgRawMessages(Number(currentDao?.id));
      const _list = res.map((item: any) => JSON.parse(item.data));
      const metadatas = [];
      for (const item of _list) {
        const data = await Promise.all([
          getJettonDetails(item.soldJetton),
          item.sourceJetton
            ? getJettonDetails(item.sourceJetton)
            : Promise.resolve("TON"),
        ]);
        metadatas.push(data);
      }
      for (let i = 0; i < _list.length; i++) {
        if (metadatas[i][0] && metadatas[i][1]) {
          _list[i].soldName =
            metadatas[i][0].metadata.name +
            ` (${metadatas[i][0].metadata.symbol})`;
          _list[i].sourceName =
            metadatas[i][1] === "TON"
              ? "TON"
              : metadatas[i][1].metadata.name +
                ` (${metadatas[i][1].metadata.symbol})`;
        }
      }
      if (res.length > 0) {
        page.current += 1;
        if (res.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
      console.log(list);
      setList([...list, ..._list]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const addressDisplay = (addr: string) => {
    if (addr) {
      return addr.substr(0, 8) + "..." + addr.substr(-8);
    } else {
      return "TON";
    }
  };

  useEffect(() => {
    getLaunchPads();
  }, []);

  return (
    <div className="page-container launchpad-list-container">
      <Back />
      <h1 className="page-title">LaunchPad - List</h1>
      <div className="launchpad-btns-container">
        {isAdmin && (
          <Button
            type="primary"
            className="primary-btn btn-deploy-launchpad"
            onClick={() => {
              history.push("/launchpad/deploy");
            }}
          >
            Deploy a LaunchPad
          </Button>
        )}
      </div>

      <InfiniteScroll
        dataLength={list.length}
        next={getLaunchPads}
        hasMore={hasMore}
        loader={<Spin spinning={loading}></Spin>}
        // scrollableTarget={id}
        height={500}
        className="dao-list"
        endMessage={
          <p className="list-end-text">
            <b>Yay! You have seen it all</b>
          </p>
        }
      >
        {list.map((item) => (
          <li>
            <div
              className="dao-item"
              onClick={() => {
                setCurrentLaunchpad(item);
                history.push(`/launchpad/detail`);
              }}
            >
              <div className="launchpad-list-item">
                <p>
                  Offering:{" "}
                  <span className="launchpad-list-addr">
                    {/* {addressDisplay(item.soldJetton)} */}
                    {item.soldName}
                  </span>{" "}
                </p>
                <p>
                  Staked:{" "}
                  <span className="launchpad-list-addr">
                    {/* {addressDisplay(item.sourceJetton)} */}
                    {item.sourceName}
                  </span>
                </p>
              </div>

              <img
                src="/icon-detail-arrow.svg"
                alt=""
                className="detail-arrow"
              />
            </div>
          </li>
        ))}
      </InfiniteScroll>
    </div>
  );
};
