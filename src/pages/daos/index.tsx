import { DaoItem, getDaoList } from "@/api";
import { useState, useEffect } from "react";
import { useModel, history } from "umi";
import { Pagination } from "antd";
import Back from "@/components/Back";
import "./index.less";
const PAGE_SIZE = 10;
export default () => {
  const { address } = useModel("app");
  const [daos, setDaos] = useState<DaoItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchDaos = async (_page: number) => {
    const res = await getDaoList({
      offset: (_page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      address,
    });
    setDaos(res.data);
    setTotal(res.total);
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
