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
  formatTimestamp,
  getCountdownTime,
  getJettonBalance,
  getLaunchpadInfo,
  getJettonTransferTx,
} from "@/utils/index";
import { Address, beginCell, fromNano, toNano } from "ton";
import { LaunchPadInfo, saveTelegramMsgData } from "@/api/apis";
import {
  isDaoAdmin,
  getPurchasedAmount,
  getAccountTimeLockAddr,
  tonClient,
  getDeployTimelockTx,
  getClaimSoldJettonTx,
  getWalletSeqno,
  waitWalletSeqnoIncrease,
  getClaimUnsoldJettonTx,
} from "@/utils";
import useSendTransaction from "@/hooks/useSendTransaction";

export default () => {
  const { currentDao, address, currentLaunchpad } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [startNow, setStartNow] = useState(false);
  const [launchpadState, setLaunchpadState] = useState<LaunchPadInfo>();
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);
  const [buyedSoldAmount, setBuyedSoldAmount] = useState(0);
  const [stakedSourceAmount, setStakedSourceAmount] = useState(0);
  const [unsoldAmount, setUnsoldAmount] = useState(0);
  const [sourceBalance, setSourceBalance] = useState(0);
  const [formShow, setFormShow] = useState(false);
  const [buyAmount, setBuyAmount] = useState(0);
  const { sendTransaction } = useSendTransaction();

  const fetchLaunchpadState = async () => {
    if (currentLaunchpad) {
      const info = await getLaunchpadInfo(currentLaunchpad?.address);
      info && setLaunchpadState(info);
    }
  };

  const releaseTime = useMemo(() => {
    if (currentLaunchpad) {
      return formatTimestamp(
        currentLaunchpad.releaseTime * 1000,
        "YYYY/MM/DD HH:MM"
      );
    }
  }, [currentLaunchpad]);

  const releaseTimePassed = useMemo(() => {
    if (currentLaunchpad) {
      return currentLaunchpad.releaseTime * 1000 > Date.now();
    }
    return false;
  }, [currentLaunchpad]);

  const sourceNeedStateAmount = useMemo(() => {
    return (buyAmount * currentLaunchpad!.exRate) / ExRate_BASE;
  }, [currentLaunchpad, buyAmount]);

  useEffect(() => {
    (async () => {
      if (currentLaunchpad) {
        const purchasedAmount = await getPurchasedAmount(
          currentLaunchpad,
          address
        );
        const stakedAmount =
          (purchasedAmount * ExRate_BASE) / currentLaunchpad.exRate;
        const unsold = await getJettonBalance(
          currentLaunchpad.soldJetton,
          currentLaunchpad.address
        );
        setBuyedSoldAmount(purchasedAmount);
        setStakedSourceAmount(stakedAmount);
        setUnsoldAmount(unsold);
      }
    })();
  }, [currentLaunchpad, address]);

  useEffect(() => {
    (async () => {
      if (currentDao && address) {
        const _isAdmin = await isDaoAdmin(address, Number(currentDao!.id));
        console.log("_isAdmin: ", _isAdmin);
        setIsAdmin(_isAdmin);
      }
    })();
  }, [currentDao, address]);

  useEffect(() => {
    (async () => {
      if (currentLaunchpad && address) {
        if (currentLaunchpad.sourceJetton) {
          const balance = await getJettonBalance(
            currentLaunchpad.sourceJetton,
            address
          );
          setSourceBalance(balance);
        } else {
          const balance = await tonClient.getBalance(Address.parse(address));
          setSourceBalance(Number(fromNano(balance)));
        }
      }
    })();
  }, [currentLaunchpad, address]);

  useEffect(() => {
    fetchLaunchpadState();
  }, [currentLaunchpad]);

  const handleBuy = () => {
    setFormShow(false);
  };
  const handleBuySubmit = async () => {
    if (!address) {
      message.warn("You need to login first.");
      return;
    }
    try {
      setSubmitting(true);
      let tx;
      const info = currentLaunchpad!;
      if (info.sourceJetton) {
        const amount = toNano(sourceNeedStateAmount); //buy with 1 source
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
        "Buy launchpad sold",
        "Buy successfully",
        "Buy failed.",
        () => {
          setFormShow(false);
        }
      );
      setSubmitting(false);
    } catch (e) {
      message.error("Buy failed.");
      setSubmitting(false);
    }
  };

  const handleClaim = async () => {
    if (!address) {
      message.warn("You need to login first.");
      return;
    }
    try {
      setSubmitting(true);
      const info = currentLaunchpad!;
      if (Date.now() / 1000 < info.releaseTime) {
        message.warn("LaunchPad not finish");
        return;
      }
      const accountTimeLockAddr = await getAccountTimeLockAddr(
        address,
        info.releaseTime
      );
      const contractStates = await tonClient.getContractState(
        accountTimeLockAddr
      );
      console.log("contractStates: ", contractStates);
      if (!contractStates.code || !contractStates.data) {
        const timelockDeployTx = await getDeployTimelockTx(
          info,
          address,
          accountTimeLockAddr.toFriendly()
        );
        const seqno = await getWalletSeqno(address);
        await sendTransaction(timelockDeployTx, "Deploy timelock", "", "");
        await waitWalletSeqnoIncrease(address, seqno);
      }
      const claimSoldTx = await getClaimSoldJettonTx(
        accountTimeLockAddr.toFriendly(),
        info,
        address
      );
      await sendTransaction(
        claimSoldTx,
        "Claim Sold Jetton",
        "Claim successfully",
        "Claim failed"
      );
      setSubmitting(false);
    } catch (e) {
      message.error("Claim failed.");
      setSubmitting(false);
    }
  };

  const adminClaimSourceJettonOrTon = async () => {
    const info = currentLaunchpad!;
    const tx = {
      to: info.address,
      value: 0.1,
      payload: beginCell()
        .storeUint(1, 32) // op
        .storeUint(0, 64) // query id
        .endCell()
        .toBoc()
        .toString("base64"),
    };
    await sendTransaction(
      tx,
      "Claim Source",
      "Claim source successfully",
      "Claim source faield"
    );
  };

  const adminClaimUnsoldJetton = async () => {
    const info = currentLaunchpad!;
    const tx = await getClaimUnsoldJettonTx(info, address);
    await sendTransaction(
      tx,
      "Claim sold",
      "Claim sold successfully",
      "Claim failed"
    );
  };

  return (
    <div className="page-container new-proposal-container">
      <h1 className="page-title">LaunchPad - Info</h1>
      <Back />
      <div className="launchpad-info">
        <div className="launchpad-info-item">
          <span className="label">Release Time</span>
          <span className="value">{releaseTime}</span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Capacity</span>
          <span className="value">{currentLaunchpad?.cap}</span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Exchange Rate</span>
          <span className="value">
            {currentLaunchpad?.exRate
              ? currentLaunchpad?.exRate / ExRate_BASE
              : 0}
          </span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Sold Jetton Address</span>
          <span className="value">{currentLaunchpad?.soldJetton}</span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Source Jetton Address</span>
          <span className="value">{currentLaunchpad?.sourceJetton}</span>
        </div>
      </div>

      <div className="launchpad-user-controls">
        <div className="launchpad-info-item">
          <span className="label">Your purchased amount: </span>
          <span className="value">{buyedSoldAmount}</span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Your staked amount: </span>
          <span className="value">{stakedSourceAmount}</span>
        </div>
        <div className="user-btns">
          <Button
            type="primary"
            className="default-btn btn-buy"
            disabled={releaseTimePassed}
            onClick={handleBuy}
          >
            Buy
          </Button>
          <Button
            type="primary"
            className="primary-btn btn-claim"
            loading={submitting}
            disabled={!releaseTimePassed}
            onClick={handleClaim}
          >
            Claim
          </Button>
        </div>
      </div>

      <div className="launchpad-admin-controls">
        <div className="launchpad-info-item">
          <span className="label">Unsold jetton amount: </span>
          <span className="value">{unsoldAmount}</span>
        </div>
        <div className="admin-btns">
          <Button
            type="primary"
            className="default-btn btn-buy"
            disabled={!releaseTimePassed}
            onClick={adminClaimUnsoldJetton}
          >
            Claim unsold jetton
          </Button>
          <Button
            type="primary"
            className="primary-btn btn-claim"
            loading={submitting}
            disabled={!releaseTimePassed}
            onClick={adminClaimSourceJettonOrTon}
          >
            Claim source jetton or TON
          </Button>
        </div>
      </div>
      <Modal
        footer={null}
        className="common-modal"
        visible={formShow}
        closable={false}
        width={300}
      >
        <Form
          form={form}
          autoComplete="off"
          layout="vertical"
          className="common-form buy-form"
          onFinish={handleBuySubmit}
        >
          <Form.Item
            label="Buy amount*"
            name="soldAmount"
            rules={[
              {
                required: true,
                message: "Please input buy amount",
              },
            ]}
          >
            <InputNumber
              className="dao-form-input"
              placeholder="Buy amount"
              controls={false}
              onChange={(val) => setBuyAmount(Number(val) || 0)}
            />
          </Form.Item>
          <div className="launchpad-info-item">
            <span className="label">Exchange Rate: </span>
            <span className="value">
              {currentLaunchpad!.exRate / ExRate_BASE}
            </span>
          </div>
          <div className="launchpad-info-item">
            <span className="label">
              {currentLaunchpad!.sourceJetton ? "Source" : "TON"} to stake:{" "}
            </span>
            <span className="value">
              {(buyAmount * currentLaunchpad!.exRate) / ExRate_BASE}
            </span>
          </div>
          <div className="launchpad-info-item">
            <span className="label">
              {" "}
              {currentLaunchpad!.sourceJetton ? "Source" : "TON"} Balance:
            </span>
            <span className="value">{sourceBalance}</span>
          </div>
          <div className="form-footer-btns">
            <Button
              type="default"
              className="default-btn btn-cancel"
              onClick={() => {
                form.resetFields();
                setFormShow(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              className="primary-btn btn-create"
              loading={submitting}
              htmlType="submit"
              disabled={sourceNeedStateAmount > sourceBalance}
            >
              OK
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
