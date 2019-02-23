# EOS官网测试节点搭建

本文尝试搭建1个EOS节点，连接到EOS官方测试网络中，这里基于[EOS-Jungle-Testnet][testnet]项目到搭建

1. ## 准备
   * 1台Linux服务器
   * 安装编译相关工具，git等

2. ## 使用低版本同步数据
    由于某些原因，你必须先使用v1.1.0版同步数据，再升级到最新版。如果直接使用最新版，会出现同步失败的问题。

    ```shell
    // 下载eos源码，切换到v1.1.0，编译
    mkdir ~/work/git/
    cd ~/work/git/
    git clone https://github.com/eosio/eos --recursive
    cd eos
    git checkout v1.1.0
    git submodule update --init --recursive
    ./eosio_build.sh

    // 创建链接
    mkdir /home/eos-v1.0  
    cd /home/eos-v1.0
    ln -snf ~/work/git/eos

    // 下载EOS-Jungle-Testnet项目
    mkdir /opt/JungleTestnet
    cd /opt/JungleTestnet
    git clone https://github.com/CryptoLions/EOS-Jungle-Testnet.git ./
    chmod +x ./*.sh
    chmod +x ./Wallet/*.sh

    // 首次启动，同步数据
    ./start.sh --delete-all-blocks --genesis-json genesis.json

    // 非首次启动
    ./start.sh
    ```

3. ## 升级
   为了方便，我就不在同一份EOS源码目录里切换分支了，直接重新拷贝一份

   ```shell
   // 停止节点程序
   cd /opt/JungleTestnet
   ./stop.sh

   // 复制一份源码，切换到最新分支，编译
   cd ~/work/git
   cp -a eos eos2
   cd eos2
   git checkout master
   git checkout v1.2.1
   git submodule update --init --recursive
   ./eosio_build.sh -s EOS

   // 更改链接
   cd /home/eos-v1.0
   ln -snf ~/work/git/eos2 eos

   // 启动节点
   cd /opt/JungleTestnet
   ./start.sh
   ```

4. ## 基本测试

   ```shell
    curl http://localhost:8888/v1/chain/get_info

    {
    "server_version": "bf28f8bb",
    "chain_id": "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
    "head_block_num": 11089218,
    "last_irreversible_block_num": 11088891,
    "last_irreversible_block_id": "00a933fb5bec94abfafdceb60b00691298924c7ef3bffb715a8b821f55029f78",
    "head_block_id": "00a935425642fc2bef29d5bc5f0be0aea950b1f8b93a56b3914986e0494479ed",
    "head_block_time": "2018-08-23T02:59:58.500",
    "head_block_producer": "atticlabjbpn",
    "virtual_block_cpu_limit": 200000000,
    "virtual_block_net_limit": 1048576000,
    "block_cpu_limit": 199337,
    "block_net_limit": 1048448,
    "server_version_string": "v1.2.1"
    }
   ```

5. ## 链接
    * [EOS官方主网节点][mainnet]
    * [EOS Jungle Test Telegram][telegram]

6. ## FAQ
   * 用户可能会在EOS编译里遇到麻烦，依赖的工具比较多，需要先安装依赖工具，在编译的过程中也会下载一些东西，有可能需要翻墙，遇到问题时可借助EOS官方文档、github issues、google搜索等。

[testnet]:https://github.com/CryptoLions/EOS-Jungle-Testnet.git
[mainnet]:https://github.com/CryptoLions/EOS-MainNet
[telegram]:https://t.me/jungletestnet