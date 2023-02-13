import React, { useState } from "react";
import "./index.less";

import { Button, message, Modal, Select, Form, Input, DatePicker } from "antd";
import { history, useModel } from "umi";
import IconTwitter from "@/assets/images/icon-twitter-gray.svg";
import IconFB from "@/assets/images/icon-facebook-gray.svg";
// import { DaoItem, registerDao } from '@soda/soda-core';
import { DaoItem } from "@/api";
// import { useDaoRegistryContract } from "@/hooks/useContract";
export default () => {
  const { setCurrentDao } = useModel("app");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  //   const daoRegistry = useDaoRegistryContract();
  const collectionForDaoCreation = {
    collection: {
      id: "test-meme",
      image: "",
      name: "TEST MEME DAO",
    },
  };
  const createDao = async () => {
    // try {
    //   const values = await form.validateFields();
    //   console.debug("[extension] create dao: ", values);
    //   setSubmitting(true);
    //   message.info("Creating your DAO...");
    //   // const res = await registerDao({
    //   //     collectionId: collectionForDaoCreation?.collection.id,
    //   //     name: values.name,
    //   //     facebook: values.facebook,
    //   //     twitter: values.twitter,
    //   // });
    //   const tx = await daoRegistry.createDao(
    //     collectionForDaoCreation?.collection.id,
    //     values.name,
    //     values.facebook,
    //     values.twitter
    //   );
    //   const res = await tx.wait();
    //   if (res && res.error) {
    //     message.warn("Create DAO failed.");
    //     setSubmitting(false);
    //     return;
    //   }
    //   console.log("res: ", res);
    //   message.success("DAO is created successfully!");
    //   setSubmitting(false);
    //   return true;
    // } catch (e) {
    //   setSubmitting(false);
    //   console.error(e);
    //   message.warn("Create DAO failed.");
    //   return false;
    // }
  };

  const handleProceedCreate = async () => {
    const res = await createDao();
    if (!res) {
      return;
    }
    const values = form.getFieldsValue();
    const dao = {
      name: values.name,
      id: collectionForDaoCreation?.collection.id,
      image: collectionForDaoCreation?.collection.image,
    } as DaoItem;
    history.push("/daoNewProposal");
  };
  const handleCreate = async () => {
    const res = await createDao();
    if (!res) {
      return;
    }
    history.push("/dao");
  };

  const handleCancel = () => {
    history.goBack();
  };
  return (
    <div className="page-container dao-container">
      <p className="title">Create DAO on Soton</p>
      <div className="content">
        <div className="left-content">
          <div className="banner">
            <img
              src={collectionForDaoCreation?.collection.image}
              alt="banner"
            />
            <p>{collectionForDaoCreation?.collection.name}</p>
          </div>
          <p className="tip">
            This image should represent the logo and branding for your DAO.
          </p>
        </div>
        <div className="right-content">
          <Form
            form={form}
            name="basic"
            autoComplete="off"
            layout="vertical"
            className="common-form dao-form"
          >
            <Form.Item
              label="DAO Name"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Please input DAO name.",
                },
              ]}
            >
              <Input className="dao-form-input" placeholder="DAO name" />
            </Form.Item>
            <Form.Item
              label={
                <p className="label-twitter">
                  <img src={IconTwitter} alt="" />
                  <span>Founding Twitter Account</span>
                </p>
              }
              name="twitter"
              rules={[
                {
                  required: true,
                  message: "Please input funding twitter account.",
                },
              ]}
            >
              <Input
                className="dao-form-input"
                placeholder="Founding Twitter Account"
              />
            </Form.Item>
            <Form.Item
              label={
                <p className="label-twitter">
                  <img src={IconFB} alt="" />
                  <span>Founding Facebook Account</span>
                </p>
              }
              name="facebook"
              rules={[
                {
                  required: false,
                  message: "Please input funding facebook account.",
                },
              ]}
            >
              <Input
                className="dao-form-input"
                placeholder="Founding Facebook Account"
              />
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className="dao-footer-btns">
        {/* <Button
          className="btn-create-proceed"
          onClick={handleProceedCreate}
          loading={submitting}
        >
          Create & proceed to your first proposal
        </Button> */}
        <Button
          type="primary"
          className="btn-create"
          onClick={handleCreate}
          loading={submitting}
        >
          Create
        </Button>
        <Button type="default" className="btn-cancel" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
