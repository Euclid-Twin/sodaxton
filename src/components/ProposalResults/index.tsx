import React, { useMemo } from "react";
import styles from "./index.less";
import { Progress } from "antd";
interface IProps {
  items: string[];
  results: number[];
}

export default (props: IProps) => {
  const { items = [], results = [] } = props;
  const ProgressColors = ["#302CFF", "#F8C35D"];

  const percents = useMemo(() => {
    const total = results.reduce((a, b) => a + b, 0);
    if (total > 0) {
      return results.map((item) => Math.floor((item * 100) / total));
    } else {
      return results.map((item) => 0);
    }
  }, [results]);

  return (
    <div className={styles["proposal-results-container"]}>
      <p className={styles["title"]}>Current Results</p>

      {items.map((item, index) => (
        <div className={styles["vote-item"]} key={index}>
          <div className={styles["vote-data-container"]}>
            <p className={styles["vote-desc"]}>{item}</p>
            <div className={styles["vote-data"]}>
              <p>{percents[index] + "%"}</p>
            </div>
          </div>
          <Progress
            percent={percents[index]}
            showInfo={false}
            className={styles["custom-progress"]}
            strokeColor={ProgressColors[index % 2]}
          />
          <p className={styles["vote-nums"]}>{results[index]} Vote(s)</p>
        </div>
      ))}
    </div>
  );
};
