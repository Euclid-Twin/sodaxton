import React, { useState } from "react";
import "./index.less";
import { Input, Button } from "antd";
import { CloseOutlined, CheckOutlined } from "@ant-design/icons";

interface AttributeItem {
  trait_type: string;
  value: string;
}
interface IProps {
  value?: AttributeItem[];
  onChange?: (items: AttributeItem[]) => void;
  [key: string]: any;
}

export default (props?: IProps) => {
  const { value = [], onChange, ...rest } = props || {};
  const [inputVal, setInputVal] = useState("");
  const [inputKey, setInputKey] = useState("");

  const [error, setError] = useState("");

  const handleDelete = (index: number) => {
    const _values = [...value];
    _values.splice(index);
    onChange?.(_values);
  };
  const handleSave = () => {
    if (!inputVal && !inputKey) return;

    const _values = [...value, { trait_type: inputKey, value: inputVal }];
    onChange?.(_values);
    setInputVal("");
    setInputKey("");
  };

  return (
    <div className="proposal-form-items">
      <ul className="items-list">
        {value.map((item, index) => (
          <li key={index}>
            <p className="items-list-item">{item.trait_type}</p>
            <p className="items-list-item">{item.value}</p>

            <Button
              type="primary"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => handleDelete(index)}
            />
          </li>
        ))}
      </ul>
      <div className="items-input">
        <div className="attr-item">
          <label htmlFor="">Trait Type</label>
          <Input
            className="dao-form-input"
            placeholder="Enter trait type"
            value={inputKey}
            onChange={(e) => {
              const value = e.target.value;
              setInputKey(value);
            }}
            status={error ? "error" : ""}
          />
          <label htmlFor="">Value</label>
          <Input
            className="dao-form-input"
            placeholder="Enter trait value"
            value={inputVal}
            onChange={(e) => {
              const value = e.target.value;
              setInputVal(value);
            }}
            status={error ? "error" : ""}
          />
        </div>
        <Button
          type="primary"
          shape="circle"
          className="btn-save"
          size="small"
          icon={<CheckOutlined />}
          onClick={handleSave}
        />
        {error && <p className="items-error-text">{error}</p>}
      </div>
    </div>
  );
};
