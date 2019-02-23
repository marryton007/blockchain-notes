# bitcore 服务搭建(centos7)

1. ## bitcore是什么

   bitcore是一套开源的比特币索引和查询服务，由bitpay组织开发。由以下几个套件构成：  
   * bitcore-node 比特币节点程序
   * insight-api  块/交易查询API接口
   * insight-ui   块/交易查询web界面
   * bitcore-wallet-service  钱包服务

2. ## 搭建

   ```javascript
   // 安装依赖
   sudo yum install zeromq-devel zeromq
   npm install -g bitcore
   // -d 引用原有的数据目录
   //bitcore create -d <bitcoin/data/path> btctest
   bitcore create btctest -t
   cd btctest
   bitcore install bitcore-wallet-service <可选>
   bitcore install insight-api
   bitcore install insight-ui
   // 启动
   bitcore start
   ```

3. ## 测试

   ```shell
   打开BTC区块链浏览器： http://localhost:3001/insight
   bitcore restapi:   http://localhost:3001/insight-api/
   ```

4. ## API测试

   ```shell
    curl http://192.168.50.159:3001/insight-api/block-index/0

    {
    "blockHash": "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943"
    }

    curl http://192.168.50.159:3001/insight-api/block/000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943

    {
    "hash": "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
    "size": 285,
    "height": 0,
    "version": 1,
    "merkleroot": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "tx": [
        "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"
    ],
    "time": 1296688602,
    "nonce": 414098458,
    "bits": "1d00ffff",
    "difficulty": 1,
    "chainwork": "0000000000000000000000000000000000000000000000000000000100010001",
    "confirmations": 1406093,
    "previousblockhash": null,
    "nextblockhash": "00000000b873e79784647a6c82962c70d228557d24a747ea4d1b8bbe878e1206",
    "reward": 50,
    "isMainChain": true,
    "poolInfo": {}
   }
   ```

5. ## 参考文档

   * [insigth-api源码][insight-api]
   * [bitcore官方网站][bitcore]

[insight-api]:https://github.com/bitpay/insight-api
[bitcore]:https://bitcore.io/