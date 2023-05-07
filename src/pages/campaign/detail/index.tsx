import React, { useMemo, useState, useEffect } from "react";
import "./index.less";
import { Button, Modal, Radio, Space, message, Tooltip } from "antd";
import { ICampaign, ICampaignTask, getCampaignTaskList } from "@/api";

interface IProps {
  campaign?: ICampaign;
  visible: boolean;
  onClose: () => void;
}
export default (props: IProps) => {
  const { campaign, visible } = props;
  const [tasks, setTasks] = useState<ICampaignTask[]>([]);

  const fetchTasks = async () => {
    const res = await getCampaignTaskList(campaign!.campaign_id);
    setTasks(res.data);
  };
  useEffect(() => {
    if (visible && campaign) {
      fetchTasks();
    }
  }, [visible, campaign]);

  const handleVerify = async (task: ICampaignTask) => {};

  return (
    <Modal
      footer={null}
      className="common-modal"
      open={visible}
      closable={false}
      width={380}
    >
      <div className="tasks-list">
        <p className="title">Base tasks</p>
        {tasks.map((item) => (
          <div className="task-item">
            <p>{item.task}</p>
            {item.completed && (
              <div className="completed">
                <span>{item.score}</span>
                <img src="/icon-task-completed.png" alt="" />
              </div>
            )}
            {!item.completed && (
              <div className="not-completed" onClick={() => handleVerify(item)}>
                <span>{item.score}</span>
                <img src="/icon-detail-arrow.svg" alt="" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};
