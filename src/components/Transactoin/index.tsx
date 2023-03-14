import { useState, useEffect } from "react";
import { useTonhubConnect } from "react-ton-x";
import { useModel } from "umi";
import { toNano, beginCell, Address } from "ton";
import {
  TonhubConnector,
  TonhubCreatedSession,
  TonhubSessionAwaited,
  TonhubWalletConfig,
  TonhubTransactionRequest,
  TonhubTransactionResponse,
} from "ton-x";
import QRCode from "react-qr-code";
import { Button } from "antd";
const TonWeb = require("tonweb");
const { NftItem, NftCollection } = TonWeb.token.nft;
import { genNFMintTx } from "@/api";
export default () => {
  const { address } = useModel("app");
  const [resp, setResp] = useState("");
  const connect = useTonhubConnect();
  const [link, setLink] = useState("");
  const connector = new TonhubConnector({ network: "testnet" }); //Set network "sandbox" for testnet
  const tx = {
    value: "0.1",
    to: "UQDvfA-3nVYHKb3uqLWV6yo6uGK4dNkd2IgKIiThVTJQUEC2",
    state_init:
      "te6cckECJwEABNoAAgATAQNTgBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odAAAAAAAAAAAQEAMCAEsAyAPogBSPKP3DZOEU9CEm7lu1QuynO9tGuliVYyclzoMRR6odEAEU/wD0pBP0vPLICwQCAWIGBQAJoR+f4AUCAs4KBwIBIAkIAB0A8jLP1jPFgHPFszJ7VSAAOztRNDTP/pAINdJwgCafwH6QNQwECQQI+AwcFltbYAIBIAwLABE+kQwcLry4U2AC1wyIccAkl8D4NDTAwFxsJJfA+D6QPpAMfoAMXHXIfoAMfoAMPACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC6jocyEDdeMkAT4DA0NDU1ghAvyyaiErrjAl8EhA/y8IA4NAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAB9lE1xwXy4ZH6QCHwAfpA0gAx+gCCCvrwgBuhIZRTFaCh3iLXCwHDACCSBqGRNuIgwv/y4ZIhjj6CEAUTjZHIUAnPFlALzxZxJEkUVEagcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAQR5QQKjdb4g8AggKONSbwAYIQ1TJ22xA3RABtcXCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAkzAyNOJVAvADAgASEQCIaHR0cHM6Ly9hcGl2Mi10ZXN0LnBsYXR3aW4uaW8vYXNzZXRzL3Rvbi1jb2xsZWN0aW9uL1RPTnRlc3QvVGVzdENhdC8AiAFodHRwczovL2FwaXYyLXRlc3QucGxhdHdpbi5pby9hc3NldHMvdG9uLWNvbGxlY3Rpb24vVE9OdGVzdC9UZXN0Q2F0ART/APSkE/S88sgLFAIBYhwVAgEgFxYAJbyC32omh9IGmf6mpqGC3oahgsQCASAbGAIBIBoZAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNIh0CASAfHgA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBICEgABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkJiUkIwA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiVI2d/A==",
  };

  console.log("To: ", tx.to, Address.parse(tx.to).toFriendly());
  const uriPrefix = "https://apiv2-test.platwin.io/assets/ton-collection/";
  const Chain_Name = process.env.CHAIN_ENV;
  const name = "TestCat";
  //@ts-ignore
  const addr = connect.state.walletConfig.address;
  const owner = new TonWeb.Address(addr);
  const apiKey =
    "978d26f0fd2ce513ef5541edc85c9dafd1576f0754ba1ec43ab81cd3b107c3fd";
  const tonweb = new TonWeb(
    new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
      apiKey: apiKey,
    })
  );
  const nftCollection = new NftCollection(tonweb.provider, {
    ownerAddress: owner,
    royalty: 0.1,
    royaltyAddress: owner,
    collectionContentUri: `${uriPrefix}${Chain_Name}/${name}`,
    nftItemContentBaseUri: `${uriPrefix}${Chain_Name}/${name}/`,
    nftItemCodeHex: NftItem.codeHex,
  });
  const collectionCreate = async () => {
    const nftCollectionAddress = await nftCollection.getAddress();
    console.log(
      "collection address=",
      nftCollectionAddress.toString(true, true, true)
    );
    const stateInit = (await nftCollection.createStateInit()).stateInit;
    const stateInitBoc = await stateInit.toBoc(false);
    const stateInitBase64 = TonWeb.utils.bytesToBase64(stateInitBoc);
    // Request body
    const request = {
      //@ts-ignore
      seed: connect.state.seed, // Session Seed
      //@ts-ignore
      appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
      to: nftCollectionAddress.toString(true, true, true), // Address.parse(tx.to).toFriendly(), // tx.to, // Destination
      value: toNano(tx.value).toString(), // Amount in nano-tons
      timeout: 5 * 60 * 1000, // 5 minut timeout
      stateInit: stateInitBase64, // Optional serialized to base64 string state_init cell
      text: "Create Collection", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
      // payload: "te6cckEBAQEAAgAAAEysuc0=", // Optional serialized to base64 string payload cell
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

  const mintNFT = async () => {
    const collection = "EQBa_iLLY2KYu94LJMzTbpDCZlOOUzzJRlx2PVF5IKNfIyM2";
    // const params = {
    //   owner: addr,
    //   collection: {
    //     name: "TestCat",
    //     address: collection,
    //   },
    //   name: "TestCat1",
    //   image:
    //     "https://api.telegram.org/file/bot5925997396:AAHDoQN8wjNlPyLVuBUMOIelrpEpki9kmUU/photos/file_8.jpg",
    //   description: "TestCat1",
    //   attributes: [],
    // };
    // const data = await genNFMintTx(params);
    // console.log("data: ", data);
    const tx = {
      value: "0.08",
      token_id: 0,
      payload:
        "te6cckEBAwEARAABMQAAAAEAAAAAAAAAAAAAAAAAAAAAQC+vCAgBAUOAFI8o/cNk4RT0ISbuW7VC7Kc720a6WJVjJyXOgxFHqh0QAgACMHb50VM=",
    };

    const nftCollectionAddress = await nftCollection.getAddress();
    console.log(
      "collection address=",
      nftCollectionAddress.toString(true, true, true)
    );
    const amount = toNano(0.05).toString();

    const body = await nftCollection.createMintBody({
      amount: amount,
      itemIndex: 0,
      itemOwnerAddress: owner,
      itemContentUri: "my_nft.json",
    });
    const bodyBoc = await body.toBoc(false);
    const bodyBase64 = TonWeb.utils.bytesToBase64(bodyBoc);
    const request = {
      //@ts-ignore
      seed: connect.state.seed, // Session Seed
      //@ts-ignore
      appPublicKey: connect.state.walletConfig.appPublicKey, // Wallet's app public key
      to: collection, // Address.parse(tx.to).toFriendly(), // tx.to, // Destination
      value: toNano(tx.value).toString(), // Amount in nano-tons
      timeout: 5 * 60 * 1000, // 5 minut timeout
      // stateInit: bodyBase64, // Optional serialized to base64 string state_init cell
      text: "Mint NFT", // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
      payload: tx.payload, // Optional serialized to base64 string payload cell
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
      <Button onClick={mintNFT}>Mint</Button>

      {link && <QRCode value={link} />}
      <p>Resp: </p>
      <p>{resp}</p>
    </div>
  );
};
