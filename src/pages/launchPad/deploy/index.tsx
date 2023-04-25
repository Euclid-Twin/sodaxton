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
  Checkbox,
  Popover,
} from "antd";
import {
  Address,
  beginCell,
  contractAddress,
  Cell,
  toNano,
  StateInit,
  fromNano,
} from "ton";
import { JETTON_WALLET_CODE, transferBody } from "@/utils/jetton-minter.deploy";
import BN from "bn.js";
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
import { request } from "umi";
import {
  ExRate_BASE,
  getCountdownTime,
  getJettonBalance,
  getJettonTransferTx,
  getLaunchpadInfo,
  getWalletSeqno,
  readFile,
  waitWalletSeqnoIncrease,
} from "@/utils/index";
import { saveTelegramMsgData } from "@/api/apis";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTonhubConnect } from "react-ton-x";
import { WalletName } from "@/models/app";
import useSendTransaction from "@/hooks/useSendTransaction";

const createDeployLaunchPadTx = async (
  releaseTime: number,
  cap: number | BN,
  ownerAddress: string,
  exRate: number,
  soldJettonAddr: string,
  sourceJettonAddr?: string
) => {
  const timelockCode = await readFile("/build/timelock.cell");
  let sourceJetton: any = sourceJettonAddr
    ? Address.parse(sourceJettonAddr)
    : undefined;
  const soldJetton = Address.parse(soldJettonAddr);
  const owner = Address.parse(ownerAddress);
  let dataCell = beginCell()
    .storeRef(
      beginCell()
        .storeUint(releaseTime, 64)
        .storeUint(exRate, 64)
        .storeUint(cap, 64)
        .storeUint(0, 64)
        .endCell()
    )
    .storeAddress(sourceJetton)
    .storeAddress(soldJetton)
    .storeRef(JETTON_WALLET_CODE)
    .storeRef(timelockCode)
    .storeAddress(owner)
    .endCell();
  let cellFile = sourceJetton ? "/build/ido.cell" : "/build/ton-ido.cell";

  const codeCell = await readFile(cellFile);
  //   let codeCell = Cell.fromBoc(require(cellFile))[0];
  let init = { code: codeCell, data: dataCell };
  let initCell = beginCell()
    .storeBit(0)
    .storeBit(0)
    .storeBit(1)
    .storeBit(1)
    .storeBit(0)
    .storeRef(codeCell)
    .storeRef(dataCell)
    .endCell();

  // const state_init = Tonweb.Contract.createStateInit(init.code, init.data);
  // const state_init = new StateInit({ data: init.data, code: init.code });
  // const state_cell = new Cell();
  // state_init.writeTo(state_cell);
  const idoAddr = contractAddress({
    workchain: 0,
    initialCode: init.code,
    initialData: init.data,
  });

  return {
    to: idoAddr.toFriendly(),
    value: "0.15", // toNano("0.15"),
    state_init: initCell.toBoc().toString("base64"),
    // init: state_cell.toBoc().toString("base64"),
  };
};
const base = ExRate_BASE;
export default () => {
  const { currentDao, address, walletName } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [startNow, setStartNow] = useState(false);
  const [form] = Form.useForm();
  const [exchangeRate, setExchangeRate] = useState(0);
  const [useSourceTon, setUseSourceTon] = useState(false);
  const [soldBalance, setSoldBalance] = useState(0);

  const { sendTransaction } = useSendTransaction();

  const handleCreate = async () => {
    if (!address) {
      message.warn("You need to login first.");
      return;
    }
    try {
      setSubmitting(true);
      // await transfer();
      // return;
      const values = await form.getFieldsValue();
      console.log("values: ", values);
      const releaseTime = Math.ceil(values.releaseTime.valueOf() / 1000); //Math.ceil(Date.now() / 1000 + 5 * 60);
      const cap = toNano(values.cap); //toNano("10");
      const exRate = values.rate * base; //base * 2; // 1 SOURCE = 2 SOLD
      const soldAmount = cap.mul(toNano(exRate)).div(toNano(base));
      const soldBalance = await getJettonBalance(values.soldJetton, address);
      if (soldAmount.gt(toNano(soldBalance))) {
        message.error(
          `Your sold jetton balance not enough. Needs ${fromNano(
            soldAmount
          )} sold jetton to deploy launchpad.`
        );
        return;
      }
      const seqno = await getWalletSeqno(address);

      let tx = await createDeployLaunchPadTx(
        releaseTime,
        cap,
        address,
        exRate,
        values.soldJetton, //"kQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADq7pA",
        useSourceTon ? "" : values.sourceJetton //"kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN"
      );
      await sendTransaction(
        tx,
        "Deploy launchpad",
        "Deploy launchpad successfully",
        "Deploy launchpad failed",
        () => {
          Modal.destroyAll();
        }
      );
      await waitWalletSeqnoIncrease(address, seqno);
      // save launchpad info to database
      let info;
      if (!info) {
        info = {
          address: tx.to, //"kQCxIKjhSngK3TdH-FEdWvk_Z0SRi_yevI4gEr90YUXPIDq4", // tx.to,
          releaseTime: releaseTime,
          exRate: exRate,
          soldJetton: values.soldJetton, // "kQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADq7pA",
          sourceJetton: useSourceTon ? "" : values.sourceJetton, // "kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN",
          cap: values.cap,
          received: 0,
          owner: address,
        };
      }
      console.log("info: ", info);
      const msgData = { ...info };
      await saveTelegramMsgData({
        group_id: currentDao?.id!,
        message_id: info.address,
        type: "LaunchPad",
        data: JSON.stringify(msgData),
      });

      await transfer(info);
      // await participate(info);
      setSubmitting(false);
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  const transfer = async (info: any) => {
    try {
      let cap = toNano(info.cap);
      const exRate = info.exRate; //base * 2; // 1 SOURCE = 2 SOLD
      //TODO sold balance should > soldAmount
      const soldAmount = cap.mul(toNano(exRate)).div(toNano(base));
      console.log("soldAmount: ", fromNano(soldAmount));

      const tx = await getJettonTransferTx(
        info.soldJetton,
        address,
        info.address,
        soldAmount,
        0
      );
      await sendTransaction(
        tx,
        "Transfer token",
        "Transfer successfully",
        "Transfer failed.",
        () => {
          Modal.destroyAll();
          history.goBack();
        }
      );

      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
      console.log(e);
    }
  };

  const disabledDate = (current: any) => {
    // Can not select days before today and today
    return current && current < moment().startOf("day");
    // return current.unix() * 1000 < Date.now();
  };

  return (
    <div className="page-container new-deploy-container">
      <h1 className="page-title">LaunchPad - Deploy</h1>
      <Back />
      <Form
        form={form}
        name="basic"
        autoComplete="off"
        layout="vertical"
        className="common-form deploy-form"
        onFinish={handleCreate}
      >
        <Form.Item
          label={
            <div className="custom-form-label">
              <span>Capacity</span>
              <Popover
                content={"Total Staked Jetton To Accept"}
                trigger={["hover", "click"]}
                placement="topLeft"
              >
                <QuestionCircleOutlined />
              </Popover>
            </div>
          }
          name="cap"
          rules={[
            {
              required: true,
              message: "Please input capacity.",
            },
          ]}
        >
          <InputNumber
            className="dao-form-input"
            placeholder="Capacity"
            controls={false}
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="custom-form-label">
              <span>Release Time</span>
              <Popover
                content={"Time to enable user claim"}
                trigger={["hover", "click"]}
                placement="topLeft"
              >
                <QuestionCircleOutlined />
              </Popover>
            </div>
          }
          name="releaseTime"
          rules={[{ required: !startNow, message: "Release time is required" }]}
        >
          <DatePicker
            showTime
            showNow={false}
            placeholder="Release time"
            disabledDate={disabledDate}
            // disabledTime={disabledStartTime}
            className="common-date-picker"
          />
        </Form.Item>
        <Checkbox
          checked={useSourceTon}
          onChange={(e) => {
            setUseSourceTon(e.target.checked);
          }}
          className="use-source-ton"
        >
          Use TON
        </Checkbox>
        <Form.Item
          label={
            <div className="custom-form-label">
              <span>Staked Jetton</span>
              <Popover
                content={"Paid Jetton"}
                trigger={["hover", "click"]}
                placement="topLeft"
              >
                <QuestionCircleOutlined />
              </Popover>
            </div>
          }
          name="sourceJetton"
          rules={[
            {
              required: true,
              message: "Please input staked token contract address.",
            },
            {
              max: 64,
              type: "string",
              message: "Max length:64",
            },
          ]}
        >
          <Input
            className="dao-form-input"
            placeholder="Staked jetton"
            disabled={useSourceTon}
          />
        </Form.Item>
        <Form.Item
          label={
            <div className="custom-form-label">
              <span>Offering Jetton</span>
              <Popover
                content={"Jetton offering for this launchpad"}
                trigger={["hover", "click"]}
                placement="topLeft"
              >
                <QuestionCircleOutlined />
              </Popover>
            </div>
          }
          name="soldJetton"
          rules={[
            {
              required: true,
              message: "Please input offering jetton contract address.",
            },
            {
              max: 64,
              type: "string",
              message: "Max length:64",
            },
          ]}
        >
          <Input className="dao-form-input" placeholder="Offering jetton" />
        </Form.Item>

        <Form.Item
          label="Exchange Rate"
          name="rate"
          rules={[
            {
              required: true,
              message: "Please input exchange rate.",
            },
          ]}
        >
          <InputNumber
            className="dao-form-input"
            placeholder="Exchange rate"
            onChange={(v) => setExchangeRate(v)}
          />
        </Form.Item>
        <p className="exchange-rate-tip">
          1 {useSourceTon ? "TON" : "Staked"} = {exchangeRate} Offering
        </p>
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
            loading={submitting}
            htmlType="submit"
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
};
