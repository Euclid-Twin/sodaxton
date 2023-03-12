import { useEffect } from "react";
import { useTonhubConnect } from "react-ton-x";
import { useModel } from "umi";
import { toNano, beginCell } from "ton";
import { TonhubConnector } from "ton-x";
import QRCode from "react-qr-code";
import { Button } from "antd";
export default () => {
  const { address } = useModel("app");
  const connect = useTonhubConnect();

  const tx = {
    value: "0.1",
    to: "UQCb1oXI5gk3t-1F7L-3KTVqDh7r-2Fj5v4NmospR1y1aCcU",
    state_init:
      "te6cckECJwEABN4AAgATAQNTgBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odAAAAAAAAAAAQEAMCAEsAZAPogBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odEAEU/wD0pBP0vPLICwQCAWIGBQAJoR+f4AUCAs4KBwIBIAkIAB0A8jLP1jPFgHPFszJ7VSAAOztRNDTP/pAINdJwgCafwH6QNQwECQQI+AwcFltbYAIBIAwLABE+kQwcLry4U2AC1wyIccAkl8D4NDTAwFxsJJfA+D6QPpAMfoAMXHXIfoAMfoAMPACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC6jocyEDdeMkAT4DA0NDU1ghAvyyaiErrjAl8EhA/y8IA4NAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAB9lE1xwXy4ZH6QCHwAfpA0gAx+gCCCvrwgBuhIZRTFaCh3iLXCwHDACCSBqGRNuIgwv/y4ZIhjj6CEAUTjZHIUAnPFlALzxZxJEkUVEagcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAQR5QQKjdb4g8AggKONSbwAYIQ1TJ22xA3RABtcXCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAkzAyNOJVAvADAgASEQCMaHR0cHM6Ly9hcGl2Mi10ZXN0LnBsYXR3aW4uaW8vYXNzZXRzL3Rvbi1jb2xsZWN0aW9uL1RPTnRlc3QvU29jYXRUZXN0LwCMAWh0dHBzOi8vYXBpdjItdGVzdC5wbGF0d2luLmlvL2Fzc2V0cy90b24tY29sbGVjdGlvbi9UT050ZXN0L1NvY2F0VGVzdAEU/wD0pBP0vPLICxQCAWIcFQIBIBcWACW8gt9qJofSBpn+pqahgt6GoYLEAgEgGxgCASAaGQAttPR9qJofSBpn+pqahgKL4J4AjgA+ALAAL7Xa/aiaH0gaZ/qamoYNiDoaYfph/0gGEABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAICzSIdAgEgHx4APUWvAEcCHwBXeAGMjLBVjPFlAE+gITy2sSzMzJcfsAgCASAhIAAbPkAdMjLAhLKB8v/ydCAALQByMs/+CjPFslwIMjLARP0APQAywDJgBOfRBjgEit8ADoaYGAuNhIrfB9IBgA6Y/pn/aiaH0gaZ/qamoYQQg0npyoKUBdRxQbr4KA6EEIVGWAVrhACGRlgqgC54sSfQEKZbUJ5Y/ln4Dni2TAIH2AcBsoueOC+XDIkuAA8YES4AFxgRLgAfGBGBmB4AJCYlJCMAPI4V1NQwEDRBMMhQBc8WE8s/zMzMye1U4F8EhA/y8AAsMjQB+kAwQUTIUAXPFhPLP8zMzMntVACmNXAD1DCON4BA9JZvpSCOKQakIIEA+r6T8sGP3oEBkyGgUyW78vQC+gDUMCJUSzDwBiO6kwKkAt4Ekmwh4rPmMDJQREMTyFAFzxYTyz/MzMzJ7VQAYDUC0z9TE7vy4ZJTE7oB+gDUMCgQNFnwBo4SAaRDQ8hQBc8WE8s/zMzMye1Ukl8F4gfJxJ4=",
  };
  const collectionCreate = async () => {
    // Request body
    const request = {
      //@ts-ignore
      seed: connect.state.seed, // Session Seed
      //@ts-ignore
      appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
      to: tx.to, // Destination
      value: toNano(tx.value).toString(), // Amount in nano-tons
      timeout: 5 * 60 * 1000, // 5 minut timeout
      stateInit: tx.state_init, // Optional serialized to base64 string state_init cell
      text: "Create Collection", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
      //payload: "....", // Optional serialized to base64 string payload cell
    };
    const response = await connect.api.requestTransaction(request);
    alert("tx resp:", JSON.stringify(response));
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
    alert("sig resp: ", JSON.stringify(response));
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
    </div>
  );
};
