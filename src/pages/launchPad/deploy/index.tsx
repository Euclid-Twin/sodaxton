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
import { getCountdownTime, getJettonBalance } from "@/utils/index";
import { saveTelegramMsgData } from "@/api/apis";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTonhubConnect } from "react-ton-x";
import { WalletName } from "@/models/app";
import useSendTransaction from "@/hooks/useSendTransaction";

function toBuffer(ab) {
  var buf = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

const readFile = async (file: string): Promise<Cell> => {
  const response = await fetch(file);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => {
      console.log(reader.result);
      const codeCell = Cell.fromBoc(toBuffer(reader.result))[0];
      console.log(file, codeCell);
      resolve(codeCell);
    });
    reader.readAsArrayBuffer(blob);
  });
};
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
const base = 1000000;
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
  const sendToChat = async (proposal: any) => {
    try {
      const text =
        `${proposal.title}(${proposal.ballotThreshold})\n` +
        `${proposal.description}\n` +
        `${VoterBallotOptions[proposal.voterType - 1].label}\n`;
      const reply_markup = {
        inline_keyboard: [
          ...proposal.items.map((item: string, index: number) => [
            {
              text: item,
              callback_data: `soton_vote:${proposal.id}:${index}`,
            },
          ]),
        ],
      };
      const msg = {
        chat_id: proposal.daoId,
        text,
        reply_markup,
      };
      const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
      const res = await request(url, {
        method: "POST",
        data: msg,
      });
      console.log("sendToChat: ", res);
      const countdowns = getCountdownTime(proposal.startTime);
      const msg2 = {
        chat_id: proposal.daoId,
        text: `This proposal will start in ${countdowns[0]}:${countdowns[1]}:${countdowns[2]}.`,
        reply_to_message_id: res?.result?.message_id,
      };
      if (res.ok && res.result) {
        saveTelegramMsgData({
          group_id: proposal.daoId,
          message_id: res.result.message_id,
          type: "proposal",
          data: proposal.id,
        }).then((saveRes) => {
          console.log("saveRes: ", saveRes);
        });
      }
      request(url, {
        method: "POST",
        data: msg2,
      }).then((res2) => {
        console.log("sendToChat: ", res2);
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleCreate = async () => {
    if (!address) {
      message.warn("You need to login first.");
      return;
    }
    try {
      setSubmitting(true);
      await transfer();
      return;
      const values = await form.getFieldsValue();
      let releaseTime = Math.ceil(Date.now() / 1000 + 5 * 60);
      let cap = toNano("10");

      const exRate = base * 2; // 1 SOURCE = 2 SOLD
      let tx = await createDeployLaunchPadTx(
        releaseTime,
        cap,
        address,
        exRate,
        "kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN",
        "EQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADqwHK"
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
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
    }
  };

  const transfer = async () => {
    try {
      const launchpadAddress = Address.parse(
        "kQBsDiMXpG6ZOHs3pp29h-VmCfT3TEGF1ne3-KC4LlGQAsco"
      );

      // const soldToken = await getJettonWallet(
      //   "kQBajc2rmhof5AR-99pfLmoUlV3Nzcle6P_Mc_KnacsViccN"
      // );

      const sourceToken = await getJettonBalance(
        "EQAjJTzAyKOHuyTpqcLLgNdTdJcbRfmxm9kNCJvvESADqwHK",
        ""
      );

      // console.log("balance1: ", soldToken);
      console.log("balance2: ", sourceToken);

      let cap = toNano("10");
      const exRate = base * 2; // 1 SOURCE = 2 SOLD
      const soldAmount = cap.mul(toNano(exRate)).div(toNano(base));
      console.log("soldAmount: ", soldAmount.toNumber());
      const tx = {
        to: launchpadAddress.toFriendly(),
        value: 0.2,
        payload: transferBody(launchpadAddress, soldAmount)
          .toBoc()
          .toString("base64"),
      };
      await sendTransaction(tx, "Transfer token", "", "");
    } catch (e) {
      setSubmitting(false);
      console.log(e);
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
    return current && current < moment().startOf("day");
    // return current.unix() * 1000 < Date.now();
  };

  const disabledStartTime = (current: any) => {
    return {
      disabledHours: () => range(0, 24).splice(4, 20),
      disabledMinutes: () => range(30, 60),
      disabledSeconds: () => [55, 56],
    };
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
