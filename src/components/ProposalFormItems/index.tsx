import React, { useState } from "react";
import "./index.less";
import { Input, Button } from "antd";
import { CloseOutlined, CheckOutlined } from "@ant-design/icons";
interface IProps {
  value?: string[];
  onChange?: (items: string[]) => void;
  [key: string]: any;
}

export default (props?: IProps) => {
  const { value = [], onChange, ...rest } = props || {};
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const handleDelete = (index: number) => {
    const _values = [...value];
    _values.splice(index);
    onChange?.(_values);
  };
  const handleSave = () => {
    if (!inputVal) return;
    if (inputVal.includes("|")) {
      setError('Please do not enter "|".');
      return;
    } else {
      setError("");
    }
    const _values = [...value, inputVal];
    onChange?.(_values);
    setInputVal("");
  };

  return (
    <div className="proposal-form-items">
      <ul className="items-list">
        {value.map((item, index) => (
          <li key={index}>
            <p className="items-list-item">{item}</p>
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
        <Input
          value={inputVal}
          onChange={(e) => {
            const value = e.target.value;
            setInputVal(value);
            if (value && value.includes("|")) {
              setError('Please do not enter "|".');
            } else {
              setError("");
            }
          }}
          onPressEnter={(e) => handleSave()}
          status={error ? "error" : ""}
        />
        <Button
          type="primary"
          shape="circle"
          icon={<CheckOutlined />}
          onClick={handleSave}
        />
        {error && <p className="items-error-text">{error}</p>}
      </div>
    </div>
  );
};
