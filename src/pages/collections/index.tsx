import "./index.less";
import { useState, useEffect, useRef } from "react";
import { Pagination, Button, Modal, Spin, Input } from "antd";
import Back from "@/components/Back";
import { PAGE_SIZE } from "@/utils/constant";
import { useModel, history } from "umi";
import { getCreatedCollectionList } from "@/api/apis";
import { formatAddress, getUrl } from "@/utils";
import { ReloadOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import useForceUpdate from "@/hooks/useForceUpdate";
import { fallbackCopyTextToClipboard } from "@/utils";

const { Search } = Input;
export default () => {
  const { address } = useModel("app");
  const page = useRef(1);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState("");
  const { factor, forceUpdate } = useForceUpdate();
  const inputRef = useRef(null);
  const fetchCollections = async (_name?: string) => {
    if (address) {
      if (collections.length === 0) {
        setLoading(true);
      }

      const res = await getCreatedCollectionList({
        creator: address,
        page: page.current,
        gap: PAGE_SIZE,
        name: _name || name,
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

  const handleSearch = (value?: string) => {
    page.current = 1;
    setCollections([]);

    fetchCollections(value);
  };
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === "Enter") {
        if (document.activeElement === inputRef?.current?.input) {
          const value = inputRef?.current?.input?.value;
          handleSearch(value);
        }
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  // const handleChangePage = (newPage: number, pageSize: number | undefined) => {
  //   setPage(newPage);
  //   fetchCollections(newPage);
  // };
  useEffect(() => {
    fetchCollections();
  }, [address, name, factor]);
  return (
    <div className="page-container collections-container">
      <Back />
      <h1 className="page-title">NFT Collections</h1>
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
            setLoading(true);
            forceUpdate();
          }}
        />
      </div>
      <div className="search-container">
        <img src="/icon-search.png" alt="" className="icon-search" />

        <Input
          className="dao-list-search-input"
          placeholder="Search..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          ref={inputRef}
        />
      </div>
      <Spin spinning={loading}>
        <InfiniteScroll
          dataLength={collections.length}
          next={fetchCollections}
          hasMore={hasMore}
          loader={<Spin spinning={collections.length > 0}></Spin>}
          // scrollableTarget={id}
          height={500}
          className="collection-list"
          // endMessage={
          //   <p style={{ textAlign: "center" }}>
          //     <b>Yay! You have seen it all</b>
          //   </p>
          // }
        >
          {collections.map((item) => (
            <li>
              <div className="collection-item">
                <div
                  className="collection-info"
                  onClick={() => {
                    fallbackCopyTextToClipboard(
                      formatAddress(item.addr),
                      "Collection contract copied!"
                    );
                  }}
                >
                  <img className="collection-logo" src={item.image} alt="" />
                  <span>{item.name}</span>
                </div>

                <div
                  className="collection-link"
                  onClick={() =>
                    window.open(
                      `${process.env.GETGEMS_COLLECTION_URL}/${item.addr}`
                    )
                  }
                >
                  <img
                    src="/icon-detail-arrow.svg"
                    alt=""
                    className="detail-arrow"
                  />
                </div>
              </div>
            </li>
          ))}
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
