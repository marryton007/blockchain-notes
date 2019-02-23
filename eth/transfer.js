var Web3 = require("web3");
var web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider("http://localhost:7545"));


//转币逻辑
const EthereumTx = require('ethereumjs-tx')
const privateKey = Buffer.from('2d2ab3f6fc55ed3e2997e91933571df2e0e0ddc837438ab641aa66ec4887d762', 'hex')

//转码合约方法和参数
var method_id =web3.sha3('transfer(address,uint256)').substr(2,8);//调用方法的Keccak哈希值的前4字节

//地址补齐32位
var address = '5D8b81c0221486479c80049C2a5F655850dAd3E8';
var address_32 = address.padStart(64, '0');;

//数值转为16进制并补齐32位
var tokenValue = web3.toHex(20).slice(2);
var tokenValue_32 = tokenValue.padStart(64, '0');

var from = '0x2c6e031a7d0Cac289Ff1e56582FBAb16153Ef8CC';

//调用数据生成
var rawData = '0x' + method_id + address_32 + tokenValue_32;

//todo 改成回调
var nonce = web3.eth.getTransactionCount(from); //获取交易序列号

//获取当前gas价格
//var gasPrice = '09184e72a000';
var gasPrice = web3.eth.gasPrice;

//获取预测需要的gas
//todo 
//1. 发送地址中是否有足够的以太。
//2. 发送地址中是否有足够的通证/代币。

var gasEstimate = web3.eth.estimateGas({
  from: from,
  to: "0x6b5aa349e868610380b4d4392a130bd30d0e000d", //合约地址
  data: rawData
});

var gasLimit = gasEstimate;

/*
web3.eth.estimateGas({
  from: from,
  to: "0xb03d3526cf459b5f6ea3375a0d21e47d4f49dd05", 
  data: rawData
},function(err,result){
  if(!err){
    var gasEstimate  = web3.toHex(result);
    //console.log(gasEstimate);
  }else{
    var gasEstimate = web3.toHex('15000');
    //console.log(gasEstimate);
  }
});
*/

const txParams = {
  nonce: web3.toHex(nonce),
  gasPrice: web3.toHex(gasPrice), 
  gasLimit: gasLimit,
  to: '0x6b5aa349e868610380b4d4392a130bd30d0e000d', 
  value: '0x00', 
  data: rawData
  // EIP 155 chainId - mainnet: 1, ropsten: 3
  //chainId: 3
}

const tx = new EthereumTx(txParams)
//签名
tx.sign(privateKey)
//转码
const serializedTx = tx.serialize()

web3.eth.sendRawTransaction(serializedTx.toString('hex'), function(err, hash) {
    if (!err)
      console.log(hash); // "0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385"
    else
      console.log(err);
  });
