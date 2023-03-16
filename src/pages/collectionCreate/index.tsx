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
import { toNano } from "ton";

import { UploadOutlined } from "@ant-design/icons";
import Back from "@/components/Back";
import ProposalFormItems from "@/components/ProposalFormItems";
import { createProposal } from "@/api/server";
import { history, useLocation, useModel } from "umi";
import { CHAIN_NAME } from "@/utils/constant";
import { SUCCESS_CODE } from "@/utils/request";
import { uploadFile, genCollectionDeployTx } from "@/api";
import { useTonhubConnect } from "react-ton-x";

export default () => {
  const { address } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [fileUrl, setFileUrl] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const connect = useTonhubConnect();

  const handleCreate = async () => {
    if (!address) {
      message.warn(
        `Please login with ${
          process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"
        }.`
      );
      return;
    }
    if (!fileUrl) {
      message.warn("Please select image for your collection.");
      return;
    }

    try {
      setSubmitting(true);
      const values = await form.validateFields();
      console.log("values: ", values);

      const params = {
        owner: address,
        name: values.name,
        description: values.description,
        image: fileUrl,
      };

      const tx = await genCollectionDeployTx(params);
      const request = {
        //@ts-ignore
        seed: connect.state.seed, // Session Seed
        //@ts-ignore
        appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
        to: tx.to, // Destination
        value: toNano(tx.value).toString(), // Amount in nano-tons
        timeout: 5 * 60 * 1000, // 1 min timeout
        stateInit: tx.state_init, // Optional serialized to base64 string state_init cell
        text: "Create Collection", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
        // payload: tx.payload, // Optional serialized to base64 string payload cell
      };
      Modal.info({
        title: `Please confirm on ${
          process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"
        }`,
        content: (
          <div>
            <p>
              {`Please open the ${
                process.env.APP_ENV === "prod" ? "Tonhub" : "Sandbox"
              } wallet on your phone and confirm the transaction
              on the homepage`}
            </p>
          </div>
        ),
        onOk() {},
      });
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
        message.success("Create collection successfully.");
        history.push("/collections");
        const externalMessage = response.response; // Signed external message that was sent to the network
      } else {
        throw new Error("Impossible");
      }
      setSubmitting(false);
    } catch (e) {
      message.error("Create collection failed.");
      setSubmitting(false);
    }
  };

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
      // setFile(file);
      return false;
    },
    onChange: async (info: any) => {
      if (info.file) {
        getBase64(info.file).then((data: any) => setImgPreview(data));
        const ipfsRes = await uploadFile([info.file]);
        if (ipfsRes[0]) {
          setFileUrl(ipfsRes[0]);
        }
      }

      //   setFile(info.file);
    },
  };

  return (
    <div className="page-container new-collection-container">
      <h1 className="page-title">Create Collection</h1>
      <Back />
      <Form
        form={form}
        name="basic"
        autoComplete="off"
        layout="vertical"
        className="common-form collection-form"
        initialValues={{ voter_type: 1 }}
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
                <Button icon={<UploadOutlined />}>Select image</Button>
              </Upload>
              {imgPreview && (
                <img src={imgPreview} alt="" className="upload-preview" />
              )}
            </div>
          </Form.Item>
        </div>
      </Form>
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
          onClick={handleCreate}
          loading={submitting}
        >
          Create
        </Button>
      </div>
    </div>
  );
};
