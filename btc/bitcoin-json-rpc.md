# bitcoin 测试环境搭建(windows)

## 1. 下载bitcoin二进制文件

```shell
wget -c https://bitcoin.org/bin/bitcoin-core-0.16.1/bitcoin-0.16.1-win64.zip
unzip bitcoin-xx.zip
cd bitcoin-xx/bin
```

## 2. 编写bitcoin配置文件，存放为g:\btcdata\bitcoin.conf

```javascript
server=1
rpcthreads=10
txindex=1
regtest=1
port=19000
rpcport=19001
rpcuser=jiaxi
rpcpassword=12345  
debug=1
```

配置文件说明：

* server=1，节点以服务方式运行
* rpcthreads=10，设置同时访问的RPC客户端数量
* txindex=1，打开交易索引
* regtest, 使用本地测试模式启动节点
* port, 节点之间通信端口
* rpcport, rpcuser, rpcpassword 指定RPC连接端口，及连接使用的用户名和密码，这里的RPC用户有很大的权限，可以创建钱包，转账等，所以非常重要，要小心保护

## 3. 启动节点

```shell
./bitcoind -datadir=g:\btcdata
```

bitcoind会在datadir目录中寻找bitcoin.conf，并使用文件中定义的参数启动节点程序

## 4. 测试

* 使用bitcoin-cli

```shell
./bitcoin-cli --datadir=g:\btcdata getblockchaininfo
```

* 使用curl测试

```shell
curl -u jiaxi:12345 --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "getblocchaininfo", "params": [] }'  -H 'content-type: text/plain;' http://127.0.0.1:19001/
```

## 5. 交易API示例

* 生成块，获取BTC

```shell
// 生成101个块，挖矿所得的交易需要100次确认后方可使用，所以这里挖101个块
./bitcoin-cli --datadir=g:\btcdata generate 101
```

* 查询余额

```shell
./bitcoin-cli --datadir=g:\btcdata getbalance
50.00000000
```

* 生成新地址

```shell
./bitcoin-cli --datadir=g:\btcdata getnewaddress
2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7
```

* 发起一笔转账到新地址

```shell
./bitcoin-cli --datadir=g:\btcdata sendtoaddress 2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7 10.00
// 返回交易Hash
248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3
```

* 查看交易情况

```shell
./bitcoin-cli --datadir=g:\btcdata gettransaction 248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3
{
    "amount": 0.00000000,
    "fee": -0.00003760,
    "confirmations": 0,
    "trusted": true,
    "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
    "walletconflicts": [
    ],
    "time": 1531366458,
    "timereceived": 1531366458,
    "bip125-replaceable": "no",
    "details": [
        {
            "account": "",
            "address": "2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7",
            "category": "send",
            "amount": -10.00000000,
            "label": "",
            "vout": 0,
            "fee": -0.00003760,
            "abandoned": false
        },
        {
            "account": "",
            "address": "2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7",
            "category": "receive",
            "amount": 10.00000000,
            "label": "",
            "vout": 0
        }
    ],
    "hex": "0200000001098d3e99ac1b85e3d9ea51167fe76acb0adf674941b808c539659ede16569af70000000049483045022100ae389409a2f0dbce46ec0b05203900ce5c9e39cb3803c1d984bfd409a54545970220389e92e644cea4287833759e1bb69450fea9d5f7faa0c77592d9e592b47fa2c801feffffff0200ca9a3b0000000017a9147c7e407ef18c0c1a4cde41320024c6cdd4e4cdef8750196bee0000000017a9142da4e8bfa64e2e703338e11f4711fbf74b0c47b68765000000"
}
```

* 查看UTXO

```shell
// 列出TUTXO
./bitcoin-cli --datadir=g:\btcdata listunspent
// 列出UTXO，包含未被确认的UTXO
./bitcoin-cli --datadir=g:\btcdata listunspent 0
[
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 0,
        "address": "2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7",
        "account": "",
        "redeemScript": "0014766074e2d78eb9a69cc8ea1ae3dce82d641aa9df",
        "scriptPubKey": "a9147c7e407ef18c0c1a4cde41320024c6cdd4e4cdef87",
        "amount": 10.00000000,
        "confirmations": 0,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 1,
        "address": "2MwQZx1LYufHHNmzBYVzL7tTJMRLcYPYbQo",
        "redeemScript": "00142ea42350830e953a55692cc4304474984b4ce62b",
        "scriptPubKey": "a9142da4e8bfa64e2e703338e11f4711fbf74b0c47b687",
        "amount": 39.99996240,
        "confirmations": 0,
        "spendable": true,
        "solvable": true,
        "safe": true
    }
]
```

* 再挖一个块

```shell
./bitcoin-cli --datadir=g:\btcdata generate 1
```

* 检查UTXO

```shell
./bitcoin-cli --datadir=g:\btcdata listunspent
[
    {
        "txid": "cf77ddf6818a6bfc33c4ddc652987938babe433d4468253dd50c1647533d8278",
        "vout": 0,
        "address": "muwcxfqkmbnPqm7ExErEc6rzrSEJCTNRAx",
        "scriptPubKey": "2102f74aaa91da14e88544be1fd115912b6effb2ccc48ee1f9756d77fde2e222c643ac",
        "amount": 50.00000000,
        "confirmations": 101,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 0,
        "address": "2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7",
        "account": "",
        "redeemScript": "0014766074e2d78eb9a69cc8ea1ae3dce82d641aa9df",
        "scriptPubKey": "a9147c7e407ef18c0c1a4cde41320024c6cdd4e4cdef87",
        "amount": 10.00000000,
        "confirmations": 1,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 1,
        "address": "2MwQZx1LYufHHNmzBYVzL7tTJMRLcYPYbQo",
        "redeemScript": "00142ea42350830e953a55692cc4304474984b4ce62b",
        "scriptPubKey": "a9142da4e8bfa64e2e703338e11f4711fbf74b0c47b687",
        "amount": 39.99996240,
        "confirmations": 1,
        "spendable": true,
        "solvable": true,
        "safe": true
    }
]
// 上面有3笔UTXO可用，是因为现在块号是102，第2个块的挖矿所得已经可以用了
// 设置变量
UTXO_TXID=cf77ddf6818a6bfc33c4ddc652987938babe433d4468253dd50c1647533d8278
UTXO_VOUT=0
```

* 生成新地址

```shell
./bitcoin-cli --datadir=g:\btcdata getnewaddress
2Mu7zX6myKUK3tqiF4yER7azdckG198pgPw
// 设置变量
NEW_ADDRESS=2Mu7zX6myKUK3tqiF4yER7azdckG198pgPw
```

* 发起Raw transaction

```shell
// 注意这里的找零，UTXO共有50BTC，转出了49.9999，减少的部分作为手续费，如果转出数额为10，则手续费高达40BTC，为了要防止这种情况，应该在vout中添加找零地址及金额
./bitcoin-cli --datadir=g:\btcdata createrawtransaction '''[{"txid":"'$UTXO_TXID'","vout":'$UTXO_VOUT'}]'''  '''{"'$NEW_ADDRESS'":49.9999}'''
020000000178823d5347160cd53d2568443d43beba38799852c6ddc433fc6b8a81f6dd77cf0000000000ffffffff01f0ca052a0100000017a914149218c44efe249661a98caf93b43930789d739f8700000000
RAW_TX=020000000178823d5347160cd53d2568443d43beba38799852c6ddc433fc6b8a81f6dd77cf0000000000ffffffff01f0ca052a0100000017a914149218c44efe249661a98caf93b43930789d739f8700000000
```

* 签发交易

```shell
./bitcoin-cli --datadir=g:\btcdata  signrawtransaction $RAW_TX
{
    "hex": "020000000178823d5347160cd53d2568443d43beba38799852c6ddc433fc6b8a81f6dd77cf0000000049483045022100f02dcfff3568cfcdb6faa90c966d8afc7a763974e800778f67239b087f12f3040220295618b8d6a064505e5b45fe884d86fd8cd189a8a433916388cfd7a79bcb89a901ffffffff01f0ca052a0100000017a914149218c44efe249661a98caf93b43930789d739f8700000000",
    "complete": true
}
SIGNED_RAW_TX=020000000178823d5347160cd53d2568443d43beba38799852c6ddc433fc6b8a81f6dd77cf0000000049483045022100f02dcfff3568cfcdb6faa90c966d8afc7a763974e800778f67239b087f12f3040220295618b8d6a064505e5b45fe884d86fd8cd189a8a433916388cfd7a79bcb89a901ffffffff01f0ca052a0100000017a914149218c44efe249661a98caf93b43930789d739f8700000000
```

* 发送签名交易

```shell
./bitcoin-cli --datadir=g:\btcdata sendrawtransaction $SIGNED_RAW_TX
```

* 生成新块

```shell
./bitcoin-cli --datadir=g:\btcdata generate 1
```

* 查看UTXO

```shell
./bitcoin-cli --datadir=g:\btcdata listunspent
[{
        "txid": "07d94910fef1681f9852e1cc2fbfdfc861b98127123df1d1686e1e40ea4e4e37",
        "vout": 0,
        "address": "2Mu7zX6myKUK3tqiF4yER7azdckG198pgPw",
        "account": "",
        "redeemScript": "00143070c773db960c8a5966131f3d509cd530c062c2",
        "scriptPubKey": "a914149218c44efe249661a98caf93b43930789d739f87",
        "amount": 49.99990000,
        "confirmations": 1,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 0,
        "address": "2N4bV2D6KJYdkTea7fELFqQ9Z4BZJouYJC7",
        "account": "",
        "redeemScript": "0014766074e2d78eb9a69cc8ea1ae3dce82d641aa9df",
        "scriptPubKey": "a9147c7e407ef18c0c1a4cde41320024c6cdd4e4cdef87",
        "amount": 10.00000000,
        "confirmations": 2,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3",
        "vout": 1,
        "address": "2MwQZx1LYufHHNmzBYVzL7tTJMRLcYPYbQo",
        "redeemScript": "00142ea42350830e953a55692cc4304474984b4ce62b",
        "scriptPubKey": "a9142da4e8bfa64e2e703338e11f4711fbf74b0c47b687",
        "amount": 39.99996240,
        "confirmations": 2,
        "spendable": true,
        "solvable": true,
        "safe": true
    },
    {
        "txid": "f137ae3d734882f584142a275a48cede59efbfb325b3bb79fa2e77869f0c93ff",
        "vout": 0,
        "address": "muwcxfqkmbnPqm7ExErEc6rzrSEJCTNRAx",
        "scriptPubKey": "2102f74aaa91da14e88544be1fd115912b6effb2ccc48ee1f9756d77fde2e222c643ac",
        "amount": 50.00000000,
        "confirmations": 101,
        "spendable": true,
        "solvable": true,
        "safe": true
    }]
    // 设置环境变量
    UTXO1_TXID=f137ae3d734882f584142a275a48cede59efbfb325b3bb79fa2e77869f0c93ff
    UTXO1_VOUT=0
    UTXO1_ADDRESS=muwcxfqkmbnPqm7ExErEc6rzrSEJCTNRAx
    UTXO2_TXID=248b1b01630f06b1a4169aa3c3eeecafd3e070393de994ee2eda8454f69d8be3
    UTXO2_VOUT=1
    UTXO2_ADDRESS=2MwQZx1LYufHHNmzBYVzL7tTJMRLcYPYbQo
```

* 获取地址私钥

```shell
UTXO1_PRIVATE_KEY=$(./bitcoin-cli --datadir=g:\btcdata dumpprivkey $UTXO1_ADDRESS)
UTXO2_PRIVATE_KEY=$(./bitcoin-cli --datadir=g:\btcdata dumpprivkey $UTXO2_ADDRESS)
```

* 获取新地址

```shell
NEW_ADDRESS1=$(./bitcoin-cli --datadir=g:\btcdata getnewaddress)
NEW_ADDRESS2=$(./bitcoin-cli --datadir=g:\btcdata getnewaddress)
```

* 创建Raw transaction

```shell
RAW_TX=$(./bitcoin-cli --datadir=g:\btcdata createrawtransaction '''[{"txid":"'$UTXO1_TXID'","vout":'$UTXO1_VOUT'},{"txid":"'$UTXO2_TXID'","vout":'$UTXO2_VOUT'}]''' '''{"'$NEW_ADDRESS1'":79.9998,"'$NEW_ADDRESS2'":10}''')
./bitcoin-cli --datadir=g:\btcdata decoderawtransaction $RAW_TX
```

* 对2个输入作签名处理

```shell
PARTLY_SIGNED_RAW_TX=$(./bitcoin-cli --datadir=g:\btcdata signrawtransaction $RAW_TX '[]' '''["'$UTXO1_PRIVATE_KEY'"]''' |jq -r '.hex')
SINGED_RAW_TX=$(./bitcoin-cli --datadir=g:\btcdata signrawtransaction $PARTLY_SIGNED_RAW_TX '[]' '''["'$UTXO2_PRIVATE_KEY'"]''' | jq -r '.hex')
```

* 发送交易

```shell
./bitcoin-cli --datadir=g:\btcdata sendrawtransaction $SINGED_RAW_TX
./bitcoin-cli --datadir=g:\btcdata generate 1
./bitcoin-cli --datadir=g:\btcdata listunspent
```