import { useState } from "react";

export default () => {
  const [address, setAddress] = useState();
  return {
    address,
    setAddress,
  };
};
