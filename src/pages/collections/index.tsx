import "./index.less";
import { useState, useEffect } from "react";
import { Pagination, Button, Modal, Spin } from "antd";
import Back from "@/components/Back";
import { PAGE_SIZE } from "@/utils/constant";
import { useModel, history } from "umi";
import { getCreatedCollectionList } from "@/api/apis";
import { getUrl } from "@/utils";

export default () => {
  const { address } = useModel("app");

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchCollections = async (page: number) => {
    if (address) {
      const res = await getCreatedCollectionList({
        creator: address,
        page,
        gap: PAGE_SIZE,
      });
      res.data.forEach((item: any) => (item.image = getUrl(item.image)));
      setCollections(res.data);
      setTotal(res.total);
    }
  };

  const handleChangePage = (newPage: number, pageSize: number | undefined) => {
    setPage(newPage);
    fetchCollections(newPage);
  };
  useEffect(() => {
    fetchCollections(1);
  }, [address]);
  return (
    <div className="page-container collections-container">
      <Back />
      <h1 className="page-title">Collections</h1>
      <div className="list-header">
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
      <ul className="collection-list">
        <Spin spinning={loading} className="list-loading">
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
        </Spin>
      </ul>
      <div className="daos-pagination">
        <Pagination
          total={total}
          pageSize={PAGE_SIZE}
          onChange={handleChangePage}
          current={page}
          showSizeChanger={false}
          size="small"
        />
      </div>
    </div>
  );
};
