// here for convenience

export const GREETER_CONTRACT_ABI =
  require("../../../contracts/artifacts-zk/contracts/utils/Greeter.sol/Greeter.json").abi;
export const NFT_CONTRACT_ABI =
  require("../../../contracts/artifacts-zk/contracts/token/ERC721.sol/MyNFT.json").abi;
export const TOKEN_CONTRACT_ABI =
  require("../../../contracts/artifacts-zk/contracts/token/ERC20.sol/MyERC20.json").abi;

export const ERC721_GATED_PAYMASTER = "0x8f0ea1312da29f17eabeb2f484fd3c112cccdd63";
export const ERC20_FIXED_PAYMASTER = "0x8f0ea1312da29f17eabeb2f484fd3c112cccdd63";
export const GASLESS_PAYMASTER = "0x8f0ea1312da29f17eabeb2f484fd3c112cccdd63";
export const ALLOWLIST_PAYMASTER = "Allowlist Paymaster 📜";
export const TESTNET_EXPLORER_URL = "https://goerli.explorer.zksync.io/tx/"