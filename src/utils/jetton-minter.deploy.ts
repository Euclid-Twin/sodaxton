import { Address, beginCell, Cell, Slice } from "ton";

import BN from "bn.js";
import { string } from "fast-glob/out/utils";

// https://github.com/ton-blockchain/minter-contract/contracts
const minterHex =
  "b5ee9c72c1020d0100029c000000000d00120018002a006b007000bc0139018f02110218027b0114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093b5f0508806e0a84026a8280790a009f404b19e2c039e2d99924591960225e801e80196019241f200e0e9919605940f97ff93a0ef003191960ab19e2ca009f4042796d625999992e3f60102f1d906380492f81f000e8698180b8d8492f81f07d207d2018fd0018b8eb90fd0018fd001801698fe99ff6a2687d007d206a6a18400aa9385d47199a9a9b1b289a6382f97024817d207d006a18106840306b90fd001812881a282178050a502819e428027d012c678b666664f6aa7041083deecbef29385d718140b0801a682102c76b9735270bae30235373723c0038e1a335035c705f2e04903fa403059c85004fa0258cf16ccccc9ed54e03502c0048e185124c705f2e049d4304300c85004fa0258cf16ccccc9ed54e05f05840ff2f00901fe365f03820898968015a015bcf2e04b02fa40d3003095c821cf16c9916de28210d1735400708018c8cb055005cf1624fa0214cb6a13cb1f14cb3f23fa443070ba8e33f828440370542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d0cf16966c227001cb01e2f4000a000ac98040fb0001c036373701fa00fa40f82854120670542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05006c705f2e04aa1034545c85004fa0258cf16ccccc9ed5401fa403020d70b01c300915be30d0c003e8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb002eedfd83";
const walletHex =
  "b5ee9c72c1021101000323000000000d001200220027002c00700075007a00e8016801a801e2025e02af02b402bf0114ff00f4a413f4bcf2c80b010201620302001ba0f605da89a1f401f481f481a8610202cc0e0402012006050083d40106b90f6a2687d007d207d206a1802698fc1080bc6a28ca9105d41083deecbef09dd0958f97162e99f98fd001809d02811e428027d012c678b00e78b6664f6aa40201200c07020120090800d73b51343e803e903e90350c01f4cffe803e900c145468549271c17cb8b049f0bffcb8b08160824c4b402805af3cb8b0e0841ef765f7b232c7c572cfd400fe8088b3c58073c5b25c60063232c14933c59c3e80b2dab33260103ec01004f214013e809633c58073c5b3327b552002f73b51343e803e903e90350c0234cffe80145468017e903e9014d6f1c1551cdb5c150804d50500f214013e809633c58073c5b33248b232c044bd003d0032c0327e401c1d3232c0b281f2fff274140371c1472c7cb8b0c2be80146a2860822625a019ad822860822625a028062849e5c412440e0dd7c138c34975c2c0600b0a007cc30023c200b08e218210d53276db708010c8cb055008cf165004fa0216cb6a12cb1f12cb3fc972fb0093356c21e203c85004fa0258cf1601cf16ccc9ed5400705279a018a182107362d09cc8cb1f5230cb3f58fa025007cf165007cf16c9718010c8cb0524cf165006fa0215cb6a14ccc971fb001024102301f1503d33ffa00fa4021f001ed44d0fa00fa40fa40d4305136a1522ac705f2e2c128c2fff2e2c254344270542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f40431fa0020d749c200f2e2c4778018c8cb055008cf1670fa0217cb6b13cc80d009e8210178d4519c8cb1f19cb3f5007fa0222cf165006cf1625fa025003cf16c95005cc2391729171e25008a813a08209c9c380a014bcf2e2c504c98040fb001023c85004fa0258cf1601cf16ccc9ed540201d4100f00113e910c1c2ebcb8536000c30831c02497c138007434c0c05c6c2544d7c0fc03383e903e900c7e800c5c75c87e800c7e800c1cea6d0000b4c7e08403e29fa954882ea54c4d167c0278208405e3514654882ea58c511100fc02b80d60841657c1ef2ea4d67c02f817c12103fcbc200475cc36";

export const JETTON_WALLET_CODE = Cell.fromBoc(
  Buffer.from(walletHex, "hex")
)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(
  Buffer.from(minterHex, "hex")
)[0]; // code cell from build output

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

// This is example data - Modify these params for your own jetton!
// - Data is stored on-chain (except for the image data itself)
// - Owner should usually be the deploying wallet's address.
const jettonParams = {
  owner: Address.parse("EQD4gS-Nj2Gjr2FYtg-s3fXUvjzKbzHGZ5_1Xe_V0-GCp0p2"),
  name: "MyJetton",
  symbol: "JET1",
  image: "https://www.linkpicture.com/q/download_183.png", // Image url
  description: "My jetton",
};

export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol";

const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: "utf8" | "ascii" | undefined;
} = {
  name: "utf8",
  description: "utf8",
  image: "ascii",
  symbol: "utf8",
};

export function jettonMinterInitData(
  owner: Address,
  metadata: { [s in JettonMetaDataKeys]?: string },
  totalSupply?: bigint
): Cell {
  return (
    beginCell()
      .storeCoins(totalSupply ?? 0)
      .storeAddress(owner)
      /// @notice we don't encode metadata here, this method is tested only
      .storeRef(
        beginCell()
          .storeStringTail(metadata.name ?? "default")
          .endCell()
      )
      .storeRef(JETTON_WALLET_CODE)
      .endCell()
  );
}

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  return jettonMinterInitData(jettonParams.owner, {
    name: jettonParams.name,
    symbol: jettonParams.symbol,
    image: jettonParams.image,
    description: jettonParams.description,
  });
}

export enum OPS {
  // Transfer = 0xf8a7ea5,
  // Transfer_notification = 0x7362d09c,
  // Internal_transfer = 0x178d4519,
  // Excesses = 0xd53276db,
  // Burn = 0x595f07bc,
  // Burn_notification = 0x7bdd97de,
  // ClaimRewards = 0x5a3e000,
  // ClaimRewardsNotification = 0x5a3e001,
  Mint = 21,
  InternalTransfer = 0x178d4519,
  Transfer = 0xf8a7ea5,
}
export function transferBody(
  toOwnerAddress: Address,
  jettonValue: number | BN,
  forwardAmount?: BN
): Cell {
  return (
    beginCell()
      .storeUint(OPS.Transfer, 32)
      .storeUint(0, 64) // queryid
      .storeCoins(jettonValue)
      .storeAddress(toOwnerAddress)
      .storeAddress(null) // TODO RESP?
      .storeDict(null) // custom payload
      .storeCoins(forwardAmount ?? 0) // forward ton amount
      // .storeMaybeRef(null) // forward payload - TODO??
      .endCell()
  );
}
