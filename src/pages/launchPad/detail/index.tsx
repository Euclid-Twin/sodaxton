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
  sleep,
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
  getJettonDetails,
} from "@/utils";
import useSendTransaction from "@/hooks/useSendTransaction";

export default () => {
  const { currentDao, address, currentLaunchpad } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [launchpadState, setLaunchpadState] = useState<LaunchPadInfo>();
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);
  const [buyedSoldAmount, setBuyedSoldAmount] = useState(0);
  const [stakedSourceAmount, setStakedSourceAmount] = useState(0);
  const [unsoldAmount, setUnsoldAmount] = useState(0);
  const [launchpadSourceBalance, setLaunchpadSourceBalance] = useState(0);
  const [sourceBalance, setSourceBalance] = useState(0);
  const [formShow, setFormShow] = useState(false);
  const [buyAmount, setBuyAmount] = useState(0);
  const [soldMetadata, setSoldMetadata] = useState<any>();
  const [sourceMetadata, setSourceMetadata] = useState<any>();
  const { sendTransaction } = useSendTransaction();

  const startTime = useMemo(() => {
    if (currentLaunchpad) {
      return formatTimestamp(
        currentLaunchpad.startTime * 1000,
        "YYYY/MM/DD HH:MM"
      );
    }
  }, [currentLaunchpad]);

  const durationPassed = useMemo(() => {
    if (currentLaunchpad) {
      return (
        (currentLaunchpad.startTime + currentLaunchpad.duration) * 1000 <
        Date.now()
      );
    }
    return false;
  }, [currentLaunchpad]);

  const startTimePassed = useMemo(() => {
    if (currentLaunchpad) {
      return currentLaunchpad.startTime * 1000 < Date.now();
    }
    return false;
  }, [currentLaunchpad]);

  const sourceNeedStateAmount = useMemo(() => {
    if (currentLaunchpad) {
      return (buyAmount * ExRate_BASE) / currentLaunchpad.exRate;
    }
    return 0;
  }, [currentLaunchpad, buyAmount]);

  const fetchAmount = async () => {
    if (currentLaunchpad && address) {
      const purchasedAmount = await getPurchasedAmount(
        currentLaunchpad,
        address
      );
      const stakedAmount =
        (purchasedAmount * ExRate_BASE) / currentLaunchpad.exRate;
      setBuyedSoldAmount(purchasedAmount);
      setStakedSourceAmount(stakedAmount);
    }
  };
  const fetchUnsoldAmount = async () => {
    if (currentLaunchpad.address) {
      if (currentLaunchpad.soldJetton) {
        const unsold = await getJettonBalance(
          currentLaunchpad.soldJetton,
          currentLaunchpad.address
        );
        setUnsoldAmount(unsold);
      }

      if (currentLaunchpad.sourceJetton) {
        const balance = await getJettonBalance(
          currentLaunchpad.sourceJetton,
          currentLaunchpad.address
        );
        setLaunchpadSourceBalance(balance);
      } else {
        const balance = await tonClient.getBalance(
          Address.parse(currentLaunchpad.address)
        );
        setLaunchpadSourceBalance(Number(fromNano(balance)));
      }
    }
  };

  useEffect(() => {
    (async () => {
      await sleep(1); //avoid exceed 10 requests per second
      await fetchAmount();
      await sleep(1); //avoid exceed 10 requests per second
      await fetchUnsoldAmount();
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
    (async () => {
      if (currentLaunchpad.soldJetton) {
        const jetton = await getJettonDetails(currentLaunchpad.soldJetton);
        setSoldMetadata(jetton.metadata);
      }
      if (currentLaunchpad.sourceJetton) {
        const jetton = await getJettonDetails(currentLaunchpad.sourceJetton);
        setSourceMetadata(jetton.metadata);
      }
    })();
  }, [currentLaunchpad]);

  // useEffect(() => {
  //   fetchLaunchpadState();
  // }, [currentLaunchpad]);

  const handleBuy = () => {
    setFormShow(true);
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
      const seqno = await getWalletSeqno(address);
      await sendTransaction(
        tx,
        "Stake",
        "Stake successfully",
        "Stake failed.",
        async () => {
          setFormShow(false);
        }
      );
      await waitWalletSeqnoIncrease(address, seqno);
      fetchAmount();
      fetchUnsoldAmount();
      setSubmitting(false);
    } catch (e) {
      message.error("Stake failed.");
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
      if (Date.now() / 1000 < info.startTime + info.duration) {
        message.warn("LaunchPad not finish");
        return;
      }
      const accountTimeLockAddr = await getAccountTimeLockAddr(
        address,
        info.startTime + info.duration
      );
      const contractStates = await tonClient.getContractState(
        accountTimeLockAddr
      );
      console.log("contractStates: ", contractStates);
      const seqno = await getWalletSeqno(address);
      if (!contractStates.code || !contractStates.data) {
        const timelockDeployTx = await getDeployTimelockTx(
          info,
          address,
          accountTimeLockAddr.toFriendly()
        );

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
      await waitWalletSeqnoIncrease(address, seqno + 1);
      fetchAmount();
      fetchUnsoldAmount();
    } catch (e) {
      message.error("Claim failed.");
      setSubmitting(false);
    }
  };

  const adminClaimSourceJettonOrTon = async () => {
    try {
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
      const seqno = await getWalletSeqno(address);
      await sendTransaction(
        tx,
        "Claim Staked Jetton",
        "Claim Staked Jetton successfully",
        "Claim Staked Jetton faield"
      );
      await waitWalletSeqnoIncrease(address, seqno);
      await fetchUnsoldAmount();
      setSubmitting(false);
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  const adminClaimUnsoldJetton = async () => {
    try {
      setSubmitting(true);
      const info = currentLaunchpad!;
      const tx = await getClaimUnsoldJettonTx(info, address);
      const seqno = await getWalletSeqno(address);

      await sendTransaction(
        tx,
        "Claim Offering Jetton",
        "Claim Offering Jetton successfully",
        "Claim Offering Jetton"
      );
      await waitWalletSeqnoIncrease(address, seqno);
      await fetchUnsoldAmount();
      setSubmitting(false);
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container new-proposal-container">
      <h1 className="page-title">LaunchPad - Info</h1>
      <Back />
      <div className="launchpad-info">
        <div className="launchpad-info-item">
          <span className="label">Start Time: </span>
          <span className="value">{startTime}</span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Duration</span>
          <span className="value">
            {currentLaunchpad?.duration / (24 * 3600)} Days
          </span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Stake Balance: </span>
          <span className="value">
            {launchpadSourceBalance} / {currentLaunchpad?.cap}
          </span>
        </div>

        <div className="launchpad-info-item">
          <span className="label">Offering Jetton: </span>
          <span
            className="value value-link"
            onClick={() => {
              window.open(
                `${process.env.TON_API_EXPLORER}/account/${currentLaunchpad?.soldJetton}`
              );
            }}
          >
            {soldMetadata?.name} ({soldMetadata?.symbol})
          </span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Staked Jetton: </span>
          <span
            className="value value-link"
            onClick={() => {
              if (currentLaunchpad.sourceJetton) {
                window.open(
                  `${process.env.TON_API_EXPLORER}/account/${currentLaunchpad?.sourceJetton}`
                );
              }
            }}
          >
            {currentLaunchpad.sourceJetton
              ? `${sourceMetadata?.name} (${sourceMetadata?.symbol})`
              : "TON"}
          </span>
        </div>
        <div className="launchpad-info-item">
          <span className="label">Exchange Rate:</span>
          <span className="value">
            1 {currentLaunchpad.sourceJetton ? "Staked" : "TON"} ={" "}
            {currentLaunchpad?.exRate / ExRate_BASE} Offering
          </span>
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
            disabled={!startTimePassed || durationPassed || unsoldAmount === 0}
            onClick={handleBuy}
            loading={submitting}
          >
            Stake
          </Button>
          <Button
            type="primary"
            className="primary-btn btn-claim"
            loading={submitting}
            disabled={!durationPassed || stakedSourceAmount === 0}
            onClick={handleClaim}
          >
            Claim
          </Button>
        </div>
      </div>
      {isAdmin && (
        <div>
          <p>(Admin only)</p>

          <div className="launchpad-admin-controls">
            <div className="launchpad-info-item">
              <span className="label">Offering Jetton in pool: </span>
              <span className="value">{unsoldAmount}</span>
            </div>
            <div className="admin-btns">
              <Button
                type="primary"
                className="default-btn btn-claim-jetton"
                disabled={!durationPassed || unsoldAmount === 0}
                onClick={adminClaimUnsoldJetton}
                loading={submitting}
              >
                Withdraw Offering Jetton in Pool
              </Button>
              <Button
                type="primary"
                className="default-btn btn-claim-source"
                loading={submitting}
                disabled={!durationPassed || launchpadSourceBalance === 0}
                onClick={adminClaimSourceJettonOrTon}
              >
                Claim Staked Jetton or TON
              </Button>
            </div>
          </div>
        </div>
      )}
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
            {/* <span className="value">
              {currentLaunchpad?.exRate / ExRate_BASE}
            </span> */}
            <span className="value">
              1 {currentLaunchpad.sourceJetton ? "Staked" : "TON"} ={" "}
              {currentLaunchpad?.exRate / ExRate_BASE} Offering
            </span>
          </div>
          <div className="launchpad-info-item">
            <span className="label">
              {currentLaunchpad!.sourceJetton ? "Stake Jetton" : "TON"}
            </span>
            <span className="value">
              {(buyAmount * ExRate_BASE) / currentLaunchpad!.exRate}
            </span>
          </div>
          <div className="launchpad-info-item">
            <span className="label">Balance:</span>
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
