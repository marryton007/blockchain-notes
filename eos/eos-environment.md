# 基于docker搭建eos本地节点

在开发EOS Dapp过程中，经常需要与一个EOS节点进行交互，这里介绍一个快速搭建本地EOS节点的方法。

1. ## 准备工作
   * 准备1台机器，Windows/Linux/Mac均可
   * 安装docker/git

2. ## 下载相关代码

   ```shell
   cd work/eos
   git clone https://github.com/EOSIO/eosjs.git
   cd eosjs/docker
   sh up.sh
   ```

3. ## 相关文件分析

   * docker-compose.yaml

   ```js
   // 设置cros (api跨域)，不然后面测试时会报错
   command: /opt/eosio/bin/nodeosd.sh --verbose-http-errors --max-transaction-time=1000 --data-dir /opt/eosio/bin/data-dir -e --http-alias=nodeosd:8888 --http-alias=127.0.0.1:8888 --http-alias=localhost:8888
   修改为：
   command: /opt/eosio/bin/nodeosd.sh --verbose-http-errors --max-transaction-time=1000 --data-dir /opt/eosio/bin/data-dir -e --http-alias=nodeosd:8888 --http-alias=127.0.0.1:8888 --http-alias=localhost:8888 --access-control-allow-origin *
   ```

   * up.sh

   ```js
   # 先停止，删除本脚本管理的容器
   docker-compose down

   # 如果没有相关的Dockers镜像，先摘取下来
   #docker-compose pull

   # 启动容器，每隔2秒打印容器的日志
   docker-compose up -d
   docker-compose logs -f | egrep -v 'Produced block 0' &
   sleep 2

   # 创建钱包
   cleos wallet create
   # 向钱包中导入1个私钥
   cleos wallet import --private-key 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3

   # 在安装eosio.system合约前先创建用户

   # 创建测试账户
   cleos create account eosio inita $owner_pubkey $active_pubkey
   cleos create account eosio initb $owner_pubkey $active_pubkey
   cleos create account eosio initc $owner_pubkey $active_pubkey

   # 创建系统管理相关账户
   cleos create account eosio eosio.bpay $owner_pubkey $active_pubkey
   cleos create account eosio eosio.msig $owner_pubkey $active_pubkey
   cleos create account eosio eosio.names $owner_pubkey $active_pubkey
   cleos create account eosio eosio.ram $owner_pubkey $active_pubkey
   cleos create account eosio eosio.ramfee $owner_pubkey $active_pubkey
   cleos create account eosio eosio.saving $owner_pubkey $active_pubkey
   cleos create account eosio eosio.stake $owner_pubkey $active_pubkey
   cleos create account eosio eosio.token $owner_pubkey $active_pubkey
   cleos create account eosio eosio.vpay $owner_pubkey $active_pubkey

   # 部署，创建10亿SYS代币，发行1万到eosio.token账户
   cleos set contract eosio.token contracts/eosio.token -p eosio.token@active
   cleos push action eosio.token create\
     '{"issuer":"eosio.token", "maximum_supply": "1000000000.0000 SYS"}' -p eosio.token@active
   cleos push action eosio.token issue\
     '{"to":"eosio.token", "quantity": "10000.0000 SYS", "memo": "issue"}' -p eosio.token@active

   # 部署，创建10亿EOS代币，发行1万到eosio.token账户
   cleos push action eosio.token create\
     '{"issuer":"eosio.token", "maximum_supply": "1白白白白rrr
     '{"to":"eosio.token", "quantity": "1000000000.0000 EOS", "memo": "issue"}' -p eosio.token@active  

   # Either the eosio.bios or eosio.system contract may be deployed to the eosio
   # account.  System contain everything bios has but adds additional constraints
   # such as ram and cpu limits.
   # eosio.* accounts  allowed only until eosio.system is deployed
   cleos set contract eosio contracts/eosio.bios -p eosio@active

   # SYS转账
   cleos transfer eosio.token eosio '1000 SYS'
   cleos transfer eosio.token inita '1000 SYS'
   cleos transfer eosio.token initb '1000 SYS'
   cleos transfer eosio.token initc '1000 SYS'

   # 用户来发行代币，如PHI
   cleos push action eosio.token create\
     '{"issuer":"eosio.token", "maximum_supply": "1000000000.000 PHI"}' -p eosio.token@active
   cleos push action eosio.token issue\
     '{"to":"eosio.token", "quantity": "10000.000 PHI", "memo": "issue"}' -p eosio.token@active
   cleos transfer eosio.token inita '100 PHI'
   cleos transfer eosio.token initb '100 PHI'

   # Custom asset
   cleos create account eosio currency $owner_pubkey $active_pubkey
   cleos set contract currency contracts/eosio.token -p currency@active
   cleos push action currency create\
     '{"issuer":"currency", "maximum_supply": "1000000000.0000 CUR"}' -p currency@active
   cleos push action currency issue '{"to":"currency", "quantity": "10000.0000 CUR", "memo": "issue"}' -p currency@active

   cleos push action currency transfer\
     '{"from":"currency", "to": "inita", "quantity": "100.0000 CUR", "memo": "issue"}' -p currency

   ```

4. ## 测试

    * 打开[eosio 官方API参考][eos-api],在这个页面可以直接测试本地节点是否架设成功
    * 使用curl测试，请参考[eosio 官方API参考][eos-api]
    * 使用Postman测试，略

[eos-api]:https://developers.eos.io/eosio-nodeos/reference