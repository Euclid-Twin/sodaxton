import { DaoItem, getDaoList } from "@/api";
import { useState, useEffect } from "react";
import { useModel, history } from "umi";
import { Pagination, Spin } from "antd";
import Back from "@/components/Back";
import "./index.less";
import { getUrl } from "@/utils";
const PAGE_SIZE = 10;
export default () => {
  const { address } = useModel("app");
  const [daos, setDaos] = useState<DaoItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchDaos = async (_page: number) => {
    try {
      setLoading(true);
      const res = await getDaoList({
        offset: (_page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        address,
      });
      res.data.forEach((item) => {
        item.image = getUrl(item.image);
      });
      setDaos(res.data);
      setTotal(res.total);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  const handleChangePage = (newPage: number, pageSize: number | undefined) => {
    setPage(newPage);
    fetchDaos(newPage);
  };
  useEffect(() => {
    fetchDaos(1);
  }, [address]);
  return (
    <div className="page-container daos-container">
      <Back />
      <h1 className="page-title">DAOs</h1>
      <ul className="dao-list">
        <Spin spinning={loading} className="list-loading">
          {daos.map((item) => (
            <li>
              <div
                className="dao-item"
                onClick={() => history.push(`/daos/${item.id}`)}
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
