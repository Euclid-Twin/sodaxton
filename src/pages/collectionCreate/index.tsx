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

import { UploadOutlined } from "@ant-design/icons";
import Back from "@/components/Back";
import ProposalFormItems from "@/components/ProposalFormItems";
import { createProposal } from "@/api/server";
import { history, useLocation, useModel } from "umi";
import { CHAIN_NAME } from "@/utils/constant";
import { SUCCESS_CODE } from "@/utils/request";

export default () => {
  const { address } = useModel("app");
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState();
  const [imgPreview, setImgPreview] = useState();

  const handleCreate = async () => {
    if (!address) {
      message.warn("Metamask not found.");
      return;
    }
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      console.log("values: ", values);
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
    onChange: (info: any) => {
      setFile(info.file);
      if (info.file) {
        getBase64(info.file).then((data) => setImgPreview(data));
      }
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
