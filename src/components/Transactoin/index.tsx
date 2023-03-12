import { useState, useEffect } from "react";
import { useTonhubConnect } from "react-ton-x";
import { useModel } from "umi";
import { toNano, beginCell, Address } from "ton";
import { TonhubConnector } from "ton-x";
import QRCode from "react-qr-code";
import { Button } from "antd";
export default () => {
  const { address } = useModel("app");
  const [resp, setResp] = useState("");
  const connect = useTonhubConnect();

  const tx = {
    value: "0.1",
    to: "UQDvfA-3nVYHKb3uqLWV6yo6uGK4dNkd2IgKIiThVTJQUEC2",
    state_init:
      "te6cckECJwEABNoAAgATAQNTgBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odAAAAAAAAAAAQEAMCAEsAyAPogBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odEAEU/wD0pBP0vPLICwQCAWIGBQAJoR+f4AUCAs4KBwIBIAkIAB0A8jLP1jPFgHPFszJ7VSAAOztRNDTP/pAINdJwgCafwH6QNQwECQQI+AwcFltbYAIBIAwLABE+kQwcLry4U2AC1wyIccAkl8D4NDTAwFxsJJfA+D6QPpAMfoAMXHXIfoAMfoAMPACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC6jocyEDdeMkAT4DA0NDU1ghAvyyaiErrjAl8EhA/y8IA4NAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAB9lE1xwXy4ZH6QCHwAfpA0gAx+gCCCvrwgBuhIZRTFaCh3iLXCwHDACCSBqGRNuIgwv/y4ZIhjj6CEAUTjZHIUAnPFlALzxZxJEkUVEagcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAQR5QQKjdb4g8AggKONSbwAYIQ1TJ22xA3RABtcXCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAkzAyNOJVAvADAgASEQCIaHR0cHM6Ly9hcGl2Mi10ZXN0LnBsYXR3aW4uaW8vYXNzZXRzL3Rvbi1jb2xsZWN0aW9uL1RPTnRlc3QvVGVzdENhdC8AiAFodHRwczovL2FwaXYyLXRlc3QucGxhdHdpbi5pby9hc3NldHMvdG9uLWNvbGxlY3Rpb24vVE9OdGVzdC9UZXN0Q2F0ART/APSkE/S88sgLFAIBYhwVAgEgFxYAJbyC32omh9IGmf6mpqGC3oahgsQCASAbGAIBIBoZAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNIh0CASAfHgA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBICEgABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkJiUkIwA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiVI2d/A==",
  };
  console.log("To: ", tx.to, Address.parse(tx.to).toFriendly());
  const collectionCreate = async () => {
    // Request body
    const request = {
      //@ts-ignore
      seed: connect.state.seed, // Session Seed
      //@ts-ignore
      appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
      to: tx.to, // Address.parse(tx.to).toFriendly(), // tx.to, // Destination
      value: toNano(tx.value).toString(), // Amount in nano-tons
      timeout: 5 * 60 * 1000, // 5 minut timeout
      stateInit: tx.state_init, // Optional serialized to base64 string state_init cell
      text: "Create Collection", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
      //   payload: tx.state_init, // Optional serialized to base64 string payload cell
    };
    const response = await connect.api.requestTransaction(request);
    setResp(JSON.stringify(response));
    console.log("tx resp: ", response);
    if (response.type === "rejected") {
      // Handle rejection
    } else if (response.type === "expired") {
      // Handle expiration
    } else if (response.type === "invalid_session") {
      // Handle expired or invalid session
    } else if (response.type === "success") {
      // Handle successful transaction
      const externalMessage = response.response; // Signed external message that was sent to the network
    } else {
      throw new Error("Impossible");
    }
  };

  const sign = async () => {
    const payloadToSign = Buffer.concat([
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("Some random string"),
    ]);
    const payload = beginCell()
      .storeBuffer(payloadToSign)
      .endCell()
      .toBoc({ idx: false })
      .toString("base64");
    const text = "Please, sign our terms or service and privacy policy";

    // Request body
    const request = {
      //@ts-ignore
      seed: connect.state.seed, // Session Seed
      //@ts-ignore
      appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
      timeout: 5 * 60 * 1000, // 5 minut timeout
      text: "Hello world", // Text to sign, presented to the user.
      payload: payload, // Optional serialized to base64 string payload cell
    };
    const response = await connect.api.requestSign(request);
    console.log("sign resp: ", response);
    alert(JSON.stringify(response));
    if (response.type === "rejected") {
      // Handle rejection
    } else if (response.type === "expired") {
      // Handle expiration
    } else if (response.type === "invalid_session") {
      // Handle expired or invalid session
    } else if (response.type === "success") {
      // Handle successful transaction
      const signature = response.signature;
      console.log("sig:", signature);

      // You can check signature on the backend with TonhubConnector.verifySignatureResponse
      //   let correctSignature = TonhubConnector.verifySignatureResponse({
      //     signature: signature,
      //     //@ts-ignore
      //     config: connect.state.walletConfig,
      //   });
    } else {
      throw new Error("Impossible");
    }
  };

  return (
    <div className="tx-container">
      <Button onClick={collectionCreate}>Create collection</Button>
      {/* <QRCode value={connect.state.link || ""} /> */}
      <p>Resp: </p>
      <p>{resp}</p>
    </div>
  );
};
