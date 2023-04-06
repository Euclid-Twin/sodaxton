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
  Upload,
} from "antd";
const TextArea = Input.TextArea;
import AttributeFormItems from "@/components/AttributeFormItems";
import { UploadOutlined } from "@ant-design/icons";
import Back from "@/components/Back";
import ProposalFormItems from "@/components/ProposalFormItems";
import { createProposal } from "@/api/server";
import { history, useLocation, useModel } from "umi";
import { CHAIN_NAME } from "@/utils/constant";
import { SUCCESS_CODE } from "@/utils/request";
import {
  uploadFile,
  genCollectionDeployTx,
  genNFTMintTx,
  getChatMember,
} from "@/api";
import { getCollectionByContract, getCreatedCollectionList } from "@/api/apis";
import { toNano, Address } from "ton";
import { useTonhubConnect } from "react-ton-x";
import { TxConfirmModal } from "../collectionCreate";
import { WalletName } from "@/models/app";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { getUrl } from "@/utils";
import { request } from "umi";
import {
  getBindResult,
  IBindResultData,
  saveTelegramNFTMsgData,
} from "@/api/apis";

const TonWeb = require("tonweb");

export default () => {
  const { address, walletName } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [fileUrl, setFileUrl] = useState();
  const [file, setFile] = useState(null);
  const [imgPreview, setImgPreview] = useState();
  const [collections, setCollections] = useState([]);
  const connect = useTonhubConnect();
  const [tonConnectUi] = useTonConnectUI();
  const [uploadLoading, setUploadLoading] = useState(false);

  const walletDisplay = useMemo(() => {
    if (walletName === WalletName.Tonkeeper) {
      return WalletName.Tonkeeper;
    } else {
      return process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox";
    }
  }, [walletName]);
  const sendToChat = async (collectionContract: string, nftId: number) => {
    try {
      const collection = await getCollectionByContract(collectionContract);

      if (collection && collection.dao) {
        const chatId = collection.id;
        const binds = await getBindResult({
          addr: address,
        });
        const tid = binds[0].tid;
        const chatMember = await getChatMember(chatId, Number(tid));
        const values = await form.validateFields();
        let caption = `#${nftId} ${values.name}\n` + `${values.description}\n`;
        if (values.attributes && values.attributes.length > 0) {
          for (const item of values.attributes) {
            caption += `${item.trait_type}: ${item.value};`;
          }
        }
        if (caption.length > 1000) {
          caption = caption.substring(0, 1000);
        }
        if (chatMember) {
          caption += `\n@${chatMember || ""}`;
        }
        const reply_markup = {
          inline_keyboard: [
            [
              {
                text: "Like",
                callback_data: "like",
              },
              {
                text: "Dislike",
                callback_data: "dislike",
              },
              {
                text: "Follow",
                callback_data: "follow",
              },
            ],
          ],
        };
        const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("chat_id", chatId);
        formData.append("caption", caption);
        formData.append("reply_markup", JSON.stringify(reply_markup));
        const res = await request(url, {
          method: "POST",
          data: formData,
          requestType: "form",
        });
        console.log("sendToChat: ", res);
        if (res.ok && res.result) {
          const saveRes = await saveTelegramNFTMsgData({
            group_id: chatId,
            message_id: res.result.message_id,
            type: "JSON",
            data: JSON.stringify(res.result),
          });
          console.log("saveRes: ", saveRes);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const addSticker = async () => {};
  const handleCreate = async () => {
    if (!address) {
      message.warn(`Please login with ${walletDisplay}.`);
      return;
    }
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      console.log("values: ", values);
      if (!fileUrl) {
        message.warn("Please select image for your NFT.");
        return;
      }
      const collection: any = collections.find(
        (item: any) => item.value === values.collection
      );
      const params = {
        owner: address,
        collection: {
          name: collection!.label,
          address: collection!.value,
        },
        name: values.name,
        description: values.description,
        image: fileUrl,
        attributes: values.attributes || [],
      };
      const tx = await genNFTMintTx(params);
      TxConfirmModal(walletDisplay);
      if (walletName === WalletName.Tonhub) {
        const request = {
          //@ts-ignore
          seed: connect.state.seed, // Session Seed
          //@ts-ignore
          appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
          to: collection.value, // Destination
          value: toNano(tx.value).toString(), // Amount in nano-tons
          timeout: 5 * 60 * 1000, // 1 min timeout
          // stateInit: tx.state_init, // Optional serialized to base64 string state_init cell
          text: "Mint NFT", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
          payload: tx.payload, // Optional serialized to base64 string payload cell
        };

        const response = await connect.api.requestTransaction(request);

        console.log("tx resp: ", response);
        if (response.type === "rejected") {
          // Handle rejection
          message.warn("Transaction rejected.");
        } else if (response.type === "expired") {
          // Handle expiration
          message.warn("Transaction expired. Please try again.");
        } else if (response.type === "invalid_session") {
          // Handle expired or invalid session
          message.warn(
            "Transaction or session expired. Please re-login and try again."
          );
        } else if (response.type === "success") {
          // Handle successful transaction
          message.success("Mint NFT successfully.");
          await sendToChat(collection.value, tx.token_id);
          history.goBack();
          Modal.destroyAll();
        } else {
          throw new Error("Impossible");
        }
      } else {
        const _tx = {
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [
            {
              address: collection.value,
              amount: toNano(tx.value).toString(),
              payload: tx.payload,
              text: "Mint NFT",
            },
          ],
        };
        //@ts-ignore
        const resp = await tonConnectUi.connector.sendTransaction(_tx);
        console.log("tonkeeper resp: ", resp);
        message.success("Mint NFT successfully.");
        await sendToChat(collection.value, tx.token_id);
        history.goBack();
        Modal.destroyAll();
      }
      setSubmitting(false);
    } catch (e) {
      if (walletName === WalletName.Tonkeeper && e.message) {
        message.warn(e.message);
      }
      message.error("Mint NFT failed.");
      setSubmitting(false);
      console.log(e);
    } finally {
      Modal.destroyAll();
    }
  };

  const fetchCollections = async (page: number) => {
    if (address) {
      const res = await getCreatedCollectionList({
        creator: address,
        page: 1,
        gap: 1000, //TODO
      });
      const _list = res.data.filter((item) => item.deployed);
      const list = _list.map((item: any) => ({
        value: item.addr,
        label: item.name,
      }));

      setCollections(list);
    }
  };

  useEffect(() => {
    fetchCollections(1);
  }, [address]);

  const getBase64 = (file: any) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const uploadProps = {
    accept: ".jpg,.png",
    maxCount: 1,
    itemRender: () => "",
    beforeUpload: (file) => {
      setFile(file);
      return false;
    },
    onChange: async (info: any) => {
      try {
        if (info.file) {
          setUploadLoading(true);
          getBase64(info.file).then((data: any) => setImgPreview(data));
          const ipfsRes = await uploadFile([info.file]);
          if (ipfsRes[0]) {
            setFileUrl(ipfsRes[0]);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setUploadLoading(false);
      }
    },
  };

  return (
    <div className="page-container new-collection-container">
      <h1 className="page-title">Mint NFT</h1>
      <Back />
      <Form
        form={form}
        name="basic"
        autoComplete="off"
        layout="vertical"
        className="common-form collection-form"
        initialValues={{ voter_type: 1 }}
        onFinish={handleCreate}
      >
        <div className="form-left-content">
          <Form.Item
            label="Name*"
            name="name"
            rules={[
              {
                required: true,
                message: "Please input name.",
              },
              {
                max: 64,
                type: "string",
                message: "Max length:64",
              },
            ]}
          >
            <Input className="dao-form-input" placeholder="Name" />
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
          <Form.Item label="Image" name="image">
            <div className="img-upload-container">
              <Upload className="img-upload" {...uploadProps}>
                <Button loading={uploadLoading} icon={<UploadOutlined />}>
                  Select image
                </Button>
              </Upload>
              {imgPreview && (
                <img src={imgPreview} alt="" className="upload-preview" />
              )}
            </div>
          </Form.Item>
          <Form.Item
            label="Collection"
            name="collection"
            rules={[
              {
                required: true,
                message: "Please select voter ballot type.",
              },
            ]}
          >
            <Select options={collections} className="proposal-form-selector" />
          </Form.Item>
          <Form.Item label="Attributes" name="attributes" rules={[]}>
            <AttributeFormItems />
          </Form.Item>
        </div>
        <div className="collection-footer-btns">
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
            disabled={!fileUrl}
            htmlType="submit"
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
};
