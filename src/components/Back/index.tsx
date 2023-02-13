import "./index.less";
import { history } from "umi";
import { Button } from "antd";
export default () => {
  return (
    <Button
      className="back-btn"
      type="default"
      onClick={() => history.goBack()}
      style={{ borderRadius: 5 }}
    >
      Back
    </Button>
  );
};
