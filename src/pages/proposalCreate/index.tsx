import React, { useState, useEffect } from "react";
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

import ProposalFormItems from "@/components/ProposalFormItems";
import { createProposal } from "@/api/proposal";
import { history, useLocation, useModel } from "umi";
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

  const [form] = Form.useForm();

  const handleCreate = async () => {};
  const disabledDate = (current: any) => {
    // Can not select days before today and today
    return current && current < moment().endOf("day");
  };
  const getSnapShotBlockheight = (startTimeMilliseconds: number) => {};
  return (
    <div className="page-container new-proposal-container">
      <h1 className="page-title">New Proposal</h1>
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
            <p>{currentDao?.name}</p>
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
            name="period"
            rules={[
              {
                required: true,
                message: "Please input period",
              },
            ]}
          >
            <RangePicker
              dropdownClassName="custom-range-picker"
              disabledDate={disabledDate}
              showTime={{
                defaultValue: [
                  moment("00:00:00", "HH:mm:ss"),
                  moment("23:59:59", "HH:mm:ss"),
                ],
              }}
              onChange={(val: any) => {
                if (val && val.length === 2) {
                  getSnapShotBlockheight(val[0].valueOf());
                }
              }}
            />
          </Form.Item>
          <div className="snapshot-blockheight">
            <span>Block height: </span>
            {/* <span className="snapshot-block-item">{snapshotBlock}</span> */}
            {/* <span className="snapshot-block-item-divide"> - </span> */}
            {/* <span className="snapshot-block-item">{snapshotBlock[1]}</span> */}
            {/* <Tooltip title="Extra time will refer to the actual block height when the DAO is created.">
              <ExclamationCircleOutlined />
            </Tooltip> */}
          </div>
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
            <Select options={VoterBallotOptions} />
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
          type="primary"
          className="btn-create"
          onClick={handleCreate}
          loading={submitting}
        >
          Create
        </Button>
        <Button
          type="default"
          className="btn-cancel"
          onClick={() => {
            history.push("/daoDetail");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
