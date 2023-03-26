import "./index.less";
import { useState, useEffect, useRef } from "react";
import { Pagination, Button, Modal, Spin, Input } from "antd";
import Back from "@/components/Back";
import { PAGE_SIZE } from "@/utils/constant";
import { useModel, history } from "umi";
import { getCreatedCollectionList } from "@/api/apis";
import { getUrl } from "@/utils";
import { ReloadOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
const { Search } = Input;
export default () => {
  const { address } = useModel("app");
  const page = useRef(1);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState("");

  const fetchCollections = async () => {
    if (address) {
      setLoading(true);
      const res = await getCreatedCollectionList({
        creator: address,
        page: page.current,
        gap: PAGE_SIZE,
        name,
      });
      if (res && res.data) {
        if (res.data.length > 0) {
          page.current += 1;
          if (res.data.length < PAGE_SIZE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
        const list = res.data.filter((item) => item.deployed);
        list.forEach((item: any) => (item.image = getUrl(item.image)));
        setCollections([...collections, ...list]);

        setTotal(res.total);
        setLoading(false);
      }
    }
  };

  // const handleChangePage = (newPage: number, pageSize: number | undefined) => {
  //   setPage(newPage);
  //   fetchCollections(newPage);
  // };
  useEffect(() => {
    fetchCollections();
  }, [address, name]);
  return (
    <div className="page-container collections-container">
      <Back />
      <h1 className="page-title">Collections</h1>
      <div className="list-header">
        <div className="list-header-btns">
          <Button
            type="primary"
            className="primary-btn btn-create"
            onClick={() => history.push("/collection/create")}
          >
            Create Collection
          </Button>
          <Button
            type="primary"
            className="primary-btn btn-create"
            onClick={() => history.push("/collection/mint")}
          >
            Mint NFT
          </Button>
        </div>
        <Button
          type="primary"
          shape="circle"
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => {
            setCollections([]);
            page.current = 1;
            fetchCollections();
          }}
        />
      </div>
      <Search
        className="dao-list-search-input"
        placeholder="Search..."
        onSearch={(value) => {
          page.current = 1;
          setName(value);
          setCollections([]);
        }}
      />
      <InfiniteScroll
        dataLength={total}
        next={fetchCollections}
        hasMore={hasMore}
        loader={<Spin spinning></Spin>}
        // scrollableTarget={id}
        height={500}
        className="collection-list"
      >
        {collections.map((item) => (
          <li>
            <div
              className="collection-item"
              onClick={() =>
                window.open(
                  `${process.env.GETGEMS_COLLECTION_URL}/${item.addr}`
                )
              }
            >
              <img className="collection-logo" src={item.image} alt="" />
              <span>{item.name}</span>
              <img
                src="/icon-detail-arrow.svg"
                alt=""
                className="detail-arrow"
              />
            </div>
          </li>
        ))}
      </InfiniteScroll>
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
