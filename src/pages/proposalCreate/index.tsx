import React, { useState, useEffect, useMemo } from "react";
import "./index.less";
import {
  Button,
  message,
  Modal,
  Select,
  Form,
  Input,
  DatePicker,
  Tooltip,
  InputNumber,
} from "antd";
const TextArea = Input.TextArea;
const { RangePicker } = DatePicker;
import moment from "moment";
import {
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import Back from "@/components/Back";
import ProposalFormItems from "@/components/ProposalFormItems";
import { createProposal } from "@/api/server";
import { history, useLocation, useModel } from "umi";
import { CHAIN_NAME } from "@/utils/constant";
import { SUCCESS_CODE } from "@/utils/request";
const VoterBallotOptions = [
  {
    value: 1,
    label: "1 ballot per address (NFT holder)",
  },
  {
    value: 2,
    label: "1 ballot per NFT",
  },
  // {
  //   value: 3,
  //   label: '1 ballot per SON',
  // },
];
export default () => {
  const { currentDao, address } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [form] = Form.useForm();

  const handleCreate = async () => {
    if (!address) {
      message.warn("Metamask not found.");
      return;
    }
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      // const startTime = values.period[0].valueOf();
      // const endTime = values.period[1].valueOf();
      const startTime = values.startTime.valueOf() + 5 * 60 * 1000;
      const endTime = values.endTime.valueOf();
      console.log();
      const params = {
        creator: address,
        snapshotBlock: 0,
        daoId: currentDao!.id,
        title: values.title,
        description: values.description,
        startTime,
        endTime,
        ballotThreshold: values.ballot_threshold,
        items: values.items,
        voterType: values.voter_type,
        sig: "",
        chain_name: CHAIN_NAME,
      };
      const result: any = await createProposal(params);
      if (result && result.code === SUCCESS_CODE) {
        message.success("Your proposal is created successfully.");
        history.goBack();
        setSubmitting(false);
      } else {
        if (result && result.error.includes("Duplicate entry")) {
          message.error("Proposal's title or description is duplicated.");
          setSubmitting(false);
          return;
        }
        message.error("Create proposal failed.");
        setSubmitting(false);
      }
      setSubmitting(false);
      //   const msg = {
      //     type: "create_proposal",
      //     data: { ...params },
      //   };
      //   window.Telegram.WebApp.sendData(JSON.stringify(msg));
      setSubmitting(false);
    } catch (e) {
      console.error("[extension-proposal] newProposal: ", e);
      message.error("Create proposal failed.");
      setSubmitting(false);
    }
  };
  const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };
  const disabledDate = (current: any) => {
    // Can not select days before today and today
    // return current && current < moment().startOf("day");
    return current.unix() * 1000 < Date.now();
  };

  const disabledStartTime = (current: any) => {
    return {
      disabledHours: () => range(0, 24).splice(4, 20),
      disabledMinutes: () => range(30, 60),
      disabledSeconds: () => [55, 56],
    };
  };

  const getSnapShotBlockheight = (startTimeMilliseconds: number) => {};
  return (
    <div className="page-container new-proposal-container">
      <h1 className="page-title">New Proposal</h1>
      <Back />
      <Form
        form={form}
        name="basic"
        autoComplete="off"
        layout="vertical"
        className="common-form proposal-form"
        initialValues={{ voter_type: 1 }}
      >
        <div className="form-left">
          <div className="banner">
            <img src={currentDao?.image} alt="banner" />
            <p>{currentDao?.name || "test meme dao"}</p>
          </div>
          <div className="form-left-content">
            <Form.Item
              label="Title*"
              name="title"
              rules={[
                {
                  required: true,
                  message: "Please input title.",
                },
                {
                  max: 64,
                  type: "string",
                  message: "Max length:64",
                },
              ]}
            >
              <Input className="dao-form-input" placeholder="Title" />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={[
                {
                  required: true,
                  message: "Please input description.",
                },
                {
                  max: 10240,
                  type: "string",
                  message: "Max length:10240",
                },
              ]}
            >
              <TextArea
                className="dao-form-input dao-form-textarea"
                rows={4}
                placeholder="Description"
              />
            </Form.Item>
          </div>
        </div>
        <div className="form-right">
          <Form.Item
            label="Period*"
            name="startTime"
            rules={[{ required: true, message: "Start date is required" }]}
          >
            <DatePicker
              showTime
              placeholder="Start date"
              disabledDate={disabledDate}
              // disabledTime={disabledStartTime}
              className="proposal-date-picker"
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            rules={[{ required: true, message: "End date is required" }]}
          >
            <DatePicker
              showNow={false}
              showTime
              placeholder="End date"
              disabledDate={disabledDate}
              className="proposal-date-picker"
            />
          </Form.Item>
          <Form.Item
            label={
              <p className="label-ballot-threshold">
                <span>Ballot Target Threshold* </span>
                <Tooltip title="When ballots received exceed the target threshold, your proposal will become valid.">
                  <QuestionCircleOutlined />
                </Tooltip>
              </p>
            }
            name="ballot_threshold"
            rules={[
              {
                required: true,
                message: "Please input ballot target threshold.",
              },
              {
                pattern: /^[1-9][0-9]*$/,
                message: "Please input valid number.",
              },
            ]}
          >
            <Input
              className="dao-form-input"
              placeholder="Target ballot threshold"
            />
          </Form.Item>
          <Form.Item
            label="Voter ballot*"
            name="voter_type"
            rules={[
              {
                required: true,
                message: "Please select voter ballot type.",
              },
            ]}
          >
            <Select
              options={VoterBallotOptions}
              className="proposal-form-selector"
            />
          </Form.Item>
          <Form.Item
            label="Voting Option(s)*"
            name="items"
            rules={[
              {
                required: true,
                message: "Please input item content.",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value && value.length > 1) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Please enter at least two options.")
                  );
                },
              }),
            ]}
          >
            <ProposalFormItems />
          </Form.Item>
          {/* <Form.Item label="Who can participate" name="participator">
        <Input className="dao-form-input" value="Owner" disabled />
      </Form.Item> */}
        </div>
      </Form>
      <div className="proposal-footer-btns">
        <Button
          type="default"
          className="default-btn btn-cancel"
          onClick={() => {
            history.goBack();
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          className="primary-btn btn-create"
          onClick={handleCreate}
          loading={submitting}
        >
          Create
        </Button>
      </div>
    </div>
  );
};
