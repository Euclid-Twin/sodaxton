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
import TonWeb from "tonweb";

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
  readFile,
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
  const connect = useTonhubConnect();
  const [tonConnectUi] = useTonConnectUI();
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
      let releaseTime = Math.ceil(Date.now() / 1000 + 5 * 60);
      let cap = toNano("10");

      const exRate = base * 2; // 1 SOURCE = 2 SOLD
      let tx = await createDeployLaunchPadTx(
        releaseTime,
        cap,
        address,
        exRate,
        "kQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADq7pA",
        "kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN"
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
      //TODO save launchpad info to database
      // let info: any = await getLaunchpadInfo(tx.to);
      let info;
      if (!info) {
        info = {
          address: "kQCxIKjhSngK3TdH-FEdWvk_Z0SRi_yevI4gEr90YUXPIDq4", // tx.to,
          releaseTime: releaseTime,
          exRate: exRate,
          soldJetton: "kQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADq7pA",
          sourceJetton: "kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN",
          cap: 10,
          received: 0,
          owner: address,
        };
      }

      console.log("info: ", info);
      const msgData = { ...info, JETTON_WALLET_CODE: "", timeLockCode: "" };
      await saveTelegramMsgData({
        group_id: currentDao?.id! || "-1001986890351",
        message_id: info.address,
        type: "LaunchPad",
        data: JSON.stringify(msgData),
      });

      await transfer(info);
      // await participate(info);
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
    }
  };

  const transfer = async (info: any) => {
    try {
      const sourceTokenBalance = await getJettonBalance(
        info.sourceJetton,
        address
      );

      const soldTokenBalance = await getJettonBalance(info.soldJetton, address);

      console.log("balance sold: ", soldTokenBalance);
      console.log("balance source: ", sourceTokenBalance);

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
        }
      );

      await participate(info);
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
      console.log(e);
    }
  };

  const participate = async (info: any) => {
    let tx;
    if (info.sourceJetton) {
      const amount = toNano(1); //buy with 1 source
      tx = await getJettonTransferTx(
        info.sourceJetton,
        address,
        info.address,
        amount,
        0.2
      );
    } else {
      tx = {
        to: info.address,
        value: 0.5 + Number(fromNano(100000000)), // buy with 0.5 TON
      };
    }
    await sendTransaction(
      tx,
      "Transfer token",
      "Transfer successfully",
      "Transfer failed.",
      () => {
        Modal.destroyAll();
      }
    );
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
          label="Capacity"
          name="capacity"
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
          label="Release TIme"
          name="releaseTime"
          rules={[{ required: !startNow, message: "Release time is required" }]}
        >
          <DatePicker
            showTime
            showNow={false}
            placeholder="Start date"
            disabledDate={disabledDate}
            // disabledTime={disabledStartTime}
            className="common-date-picker"
          />
        </Form.Item>

        <Form.Item
          label="Target Token"
          name="targetToken"
          rules={[
            {
              required: true,
              message: "Please input target token contract address.",
            },
            {
              max: 64,
              type: "string",
              message: "Max length:64",
            },
          ]}
        >
          <Input className="dao-form-input" placeholder="Target Token" />
        </Form.Item>

        <Form.Item
          label="Stake Token"
          name="stakeToken"
          rules={[
            {
              required: true,
              message: "Please input stake token contract address.",
            },
            {
              max: 64,
              type: "string",
              message: "Max length:64",
            },
          ]}
        >
          <Input className="dao-form-input" placeholder="Stake Token" />
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
            placeholder="rate"
            onChange={(v) => setExchangeRate(v)}
          />
          <p className="exchange-rate-tip">
            1 Stake Token = {exchangeRate} Target Token
          </p>
        </Form.Item>

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
            htmlType="submit"
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
};
