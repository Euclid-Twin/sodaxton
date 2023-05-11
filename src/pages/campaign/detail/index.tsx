import React, { useMemo, useState, useEffect } from "react";
import "./index.less";
import { Button, Modal, Radio, Space, message, Tooltip } from "antd";
import {
  CampaignTaskType,
  ICampaign,
  ICampaignTask,
  getCampaignTaskList,
  saveCompletedTask,
  getChatMember,
} from "@/api";
import IconClose from "@/assets/images/icon-close.png";
import axios from "axios";
import { useModel, history } from "umi";
import { getBindResult } from "@/api/apis";
interface IProps {
  campaign?: ICampaign;
  visible: boolean;
  onClose: () => void;
}
export default (props: IProps) => {
  const { campaign, visible, onClose } = props;
  const [tasks, setTasks] = useState<ICampaignTask[]>([]);
  const { address, currentDao } = useModel("app");
  const fetchTasks = async () => {
    const res = await getCampaignTaskList(campaign!.campaign_id, address);
    setTasks(res.data);
  };
  useEffect(() => {
    if (visible && campaign) {
      fetchTasks();
    }
  }, [visible, campaign]);

  const getChatLink = async () => {
    try {
      const accessToken = process.env.BOT_TOKEN;
      const { data } = await axios.get(
        `https://api.telegram.org/bot${accessToken}/getChat?chat_id=${
          currentDao!.id
        }`
      );
      console.log("chat: ", data);
      if (data && data.result) {
        const res = data.result;
        if (res.invite_link) {
          return res.invite_link;
        } else if (res.active_usernames && res.active_usernames[0]) {
          return `https://t.me/${res.active_usernames[0]}`;
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const verifyInGroup = async (groupId: number) => {
    try {
      const binds = await getBindResult({
        addr: address,
      });
      const tid = binds[0].tid;
      const chatMember = await getChatMember(groupId, Number(tid));
      if (chatMember) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const saveTaskCompleted = async (task_id: number) => {
    await saveCompletedTask({
      address,
      campaign_id: campaign!.campaign_id,
      task_id,
    });
    await fetchTasks();
  };

  const handleVerify = async (task: ICampaignTask) => {
    if (task.task_type === CampaignTaskType.OpenTgGroup) {
      const chatLink = await getChatLink();
      if (chatLink) {
        window.open(chatLink);
        await saveTaskCompleted(task.task_id);
      } else {
        message.warn("No invite link of the tg group.");
        return;
      }
    } else if (task.task_type === CampaignTaskType.OpenDao) {
      await saveTaskCompleted(task.task_id);
      history.push(`/daos/${currentDao?.id}`);
    } else if (task.task_type === CampaignTaskType.JoinTgGroup) {
      const verified = await verifyInGroup(currentDao!.id);
      if (verified) {
        await saveTaskCompleted(task.task_id);
      } else {
        message.warn("You haven't joined the group.");
      }
    } else {
      //nothing happens
    }
  };

  return (
    <Modal
      footer={null}
      className="common-modal"
      open={visible}
      width={380}
      onCancel={onClose}
    >
      <div className="tasks-list">
        <div className="tasks-header">
          <p className="title">Base tasks</p>
        </div>
        {tasks.map((item) => (
          <div className="task-item">
            <p>{item.task}</p>
            {item.completed_by_addr && (
              <div className="completed">
                <span>{item.score}</span>
                <img src="/icon-task-completed.png" alt="" />
              </div>
            )}
            {!item.completed_by_addr && (
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
