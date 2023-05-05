import { DaoItem, getDaoList } from "@/api";
import { useState, useEffect, useRef } from "react";
import { useModel, history } from "umi";
import { Pagination, Spin, Input } from "antd";
import Back from "@/components/Back";
import "./index.less";
import { getUrl } from "@/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import { PAGE_SIZE } from "@/utils/constant";
const { Search } = Input;
enum ListSwitchEnum {
  All_List,
  My_List,
}
export default () => {
  const { address } = useModel("app");
  const [daos, setDaos] = useState<DaoItem[]>([]);
  const page = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [name, setName] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listSwitch, setListSwitch] = useState<ListSwitchEnum>(
    ListSwitchEnum.My_List
  );
  const fetchDaos = async (_name?: string) => {
    try {
      if (daos.length === 0) {
        setLoading(true);
      }
      const params = {
        offset: (page.current - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        name: _name || name,
        address: "",
      };
      if (listSwitch === ListSwitchEnum.My_List) {
        params.address = address;
      }
      const res = await getDaoList(params);
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
        res.data.forEach((item) => {
          item.image = getUrl(item.image);
        });
        setDaos([...daos, ...res.data]);
        setTotal(res.total);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  // const handleChangePage = (newPage: number, pageSize: number | undefined) => {
  //   setPage(newPage);
  //   fetchDaos(newPage);
  // };
  const handleListSwitch = (val: ListSwitchEnum) => {
    if (val !== listSwitch) {
      setListSwitch(val);
      setDaos([]);
      page.current = 1;
    }
  };
  useEffect(() => {
    fetchDaos();
  }, [address, listSwitch, name]);
  return (
    <div className="page-container daos-container">
      <Back />
      <h1 className="page-title">DAOs & Tokens</h1>
      <div className="page-header">
        <Search
          className="dao-list-search-input"
          placeholder="Search..."
          onSearch={(value) => {
            page.current = 1;
            setName(value);
            setDaos([]);
            if (value === name) {
              fetchDaos(value);
            }
          }}
        />
        <div className="list-switch">
          <span
            className={
              listSwitch === ListSwitchEnum.My_List ? "switch-active" : ""
            }
            onClick={() => handleListSwitch(ListSwitchEnum.My_List)}
          >
            My DAOs
          </span>
          <i>/</i>
          <span
            className={
              listSwitch === ListSwitchEnum.All_List ? "switch-active" : ""
            }
            onClick={() => handleListSwitch(ListSwitchEnum.All_List)}
          >
            Explore DAOs
          </span>
        </div>
      </div>
      <Spin spinning={loading}>
        <InfiniteScroll
          dataLength={daos.length}
          next={fetchDaos}
          hasMore={hasMore}
          loader={<Spin spinning={daos.length > 0}></Spin>}
          // scrollableTarget={id}
          height={500}
          className="dao-list"
          endMessage={
            <p style={{ textAlign: "center" }}>
              <b>Yay! You have seen it all</b>
            </p>
          }
        >
          {daos.map((item) => (
            <li>
              <div
                className="dao-item"
                onClick={() => {
                  history.push(`/daos/${item.id}`);
                }}
              >
                <img className="dao-logo" src={item.image} alt="" />
                <span>{item.name}</span>
                <img
                  src="/icon-detail-arrow.svg"
                  alt=""
                  className="detail-arrow"
                />
              </div>
            </li>
          ))}
          {daos.length === 0 && (
            <p style={{ textAlign: "center" }}>
              <b>{`${
                listSwitch === ListSwitchEnum.My_List
                  ? "You don't have any DAO."
                  : ""
              }`}</b>
            </p>
          )}
        </InfiniteScroll>
      </Spin>
      {/* <div className="daos-pagination">
        <Pagination
          total={total}
          pageSize={PAGE_SIZE}
          onChange={handleChangePage}
          current={page}
          showSizeChanger={false}
          size="small"
        />
      </div> */}
    </div>
  );
};
