# 搭建BTC私链(Regtest)

1. ## 起因
   这2天BTC测试网络受到攻击，导致交易确认非常缓慢，几乎无法工作，只好尝试在本地搭建一个BTC Regtest + insight API节点以供测试，也为后续搭建BCH环境打下基础

2. ## 准备
   因服务器已经跑了一个BTC testnet + Insight API服务，为了防止冲突，这次搭建工作在本人台式电脑上完成，准备工作如下:
   * Windows 10 专业版，启用Hyper-V
   * 安装vagrant
   * 下载centos vbox镜像，hyperv版，因机器上已安装了Docker for Windows, 而Hyper-v与Virtual Box是有冲突的，所以这里Vagrant也使用Hyper-v作为底层虚拟机制。

3. ## 流程
   * 使用Vagrant创建一台Centos7虚拟机
   * 在虚拟机中安装bitcore套件

4. ## 创建一台Centos7虚拟机
   * 准备Centos7镜像，填写如下配置文件([vbox-centos.json](scripts/vbox-centos.json)), 其中url指向本地Vbox镜像文件绝对路径

    ```json
    {
        "name": "centos/7",
        "versions": [{
            "version": "1804.02",
            "providers": [{
                "name": "hyperv",
                "url": "file:///H:/download/CentOS-7-x86_64-Vagrant-1804_02.HyperV.box"
            }]
        }]
    }
    ```

   * Vagrant导入Centos7镜像

    ```shell
    vagrant box add vbox-centos.json
    vagrant box list
    // centos/7 (hyperv, 1804.02)
    ```

    * Vagrant初如化虚拟机

    ```shell
    mkdir f:/vbox/centos7
    cd f:/vbox/centos7
    // 初始化虚拟机，指定使用centos/7镜像，这将在当前目录下创建Vagrantfile文件
    vagrant init centos/7
    ```

    * 文件替换
  
    ```shell
    mv scprits/* .
    ```

    * 相关文件内容说明
        * [Vargrantfile](scripts/Vagrantfile)

        ```shell
        Vagrant.configure("2") do |config|
            // 指定虚拟机镜像文件名称
            config.vm.box = "centos/7"
            // 设定虚拟机网络模式为桥接方式，相当于一台独立的主机
            config.vm.network "public_network", use_dhcp_assigned_default_route: true
            // 以超级用户执行init.sh文件中的脚本
            config.vm.provision :shell, path: "init.sh"
            // 以vagrant用户执行start.sh文件中脚本
            config.vm.provision :shell, path: "start.sh", privileged: false
        end
        ```
        * [init.sh](scripts/init.sh)
  
        ```shell
        #!/usr/bin/env bash
        // 使用163替换官方原始源，加速YUM安装
        mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
        curl -O http://mirrors.163.com/.help/CentOS7-Base-163.repo
        mv CentOS7-Base-163.repo /etc/yum.repos.d/

        // 启用epel源，可以安装更多的软件
        cd /tmp
        curl -O http://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
        sudo rpm -ivh epel-release-latest-7.noarch.rpm

        // 更新yum
        yum clean all
        yum makecache

        // 安装需要的常用软件，其中gcc-c++与zeromq-devel是为后面的bitcore预备的
        yum install -y git net-tools wget vim gcc-c++  zeromq-devel socat
        ```

        * [start.sh](scripts/start.sh)

        ```shell
        // 为vagrant用户安装NVM，并安装最新稳定版的Nodejs和npm
        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
        source ~/.bashrc
        nvm install --lts

        // 设置npm的配置文件，加速npm下载
        cat << END > ~/.npmrc
        disturl=https://npm.taobao.org/dist
        chromedriver_cdnurl=http://cdn.npm.taobao.org/dist/chromedriver
        operadriver_cdnurl=http://cdn.npm.taobao.org/dist/operadriver
        phantomjs_cdnurl=http://cdn.npm.taobao.org/dist/phantomjs
        fse_binary_host_mirror=https://npm.taobao.org/mirrors/fsevents
        sass_binary_site=http://cdn.npm.taobao.org/dist/node-sass
        electron_mirror=http://cdn.npm.taobao.org/dist/electron/

        END
        ```

    * 启动虚拟机

    ```shell
    vagrant up --provider=hyperv
    ```

    * 连接虚拟机

    ```shell
    vagrant ssh
    ```

5. ## 安装bitcore + insight-api 套件
   * 安装 bitcore + insight-api

    ```shell
     npm install -g bitcore@latest
     bitcore create mynode
     cd mynode
     bitcore install insight-api
     bitcore install insight-ui
    ```

   * 修改bitcore-node.json, 替换网络类型为regtest(本地回环测试网络), 默认为livenet(主网)

    ```shell
    sed -i -e '2s/livenet/regtest/' bitcoin-node.json
    ```

   * 修改data/bitcoin.json, 允许远程节点连接， 请参考如下配置文件，删除whitelist和rpcallowip

    ```json
    server=1
    txindex=1
    addressindex=1
    timestampindex=1
    spentindex=1
    zmqpubrawtx=tcp://127.0.0.1:28332
    zmqpubhashblock=tcp://127.0.0.1:28332
    rpcuser=bitcoin
    rpcpassword=local321
    uacomment=bitcore
    ```

   * 端口映射  
    Vagrant + Hyper-v不能像virtualbox那样映射端口，这里使用socat工具来完成，当然，也可以使用nginx/haproxy等工具

    ```shell
    // 监听本地18333号端口，将其转发到127.0.0.1:18332
    nohup socat TCP4-LISTEN:18333,reuseaddr,fork TCP4:127.0.0.1:18332 >> portmap.log 2>&1 &
    ```

   * 定时挖矿  
    regtest只能手动挖矿，这里使用crontab实现每分钟打包一次

    ```shell
    crontab -e
    // 填入如下内容，注意这里的脚本全是使用绝对路径
    */1 * * * * /home/vagrant/.nvm/versions/node/v8.11.4/lib/node_modules/bitcore/node_modules/bitcore-node/bin/bitcoin-0.12.1/bin/bitcoin-cli --datadir=/home/vagrant/mynode/data --regtest generate 1
    ```

6. ## 测试
   * 浏览器访问如下网址<http://192.168.50.168:3001/insight>
   * 命令行测试
    在另一台机上下载bitcoin相关工具，使用bitcoin-cli工具进行测试

    ```shell
    // rpcconnect指定虚拟主机地址， rpcport指定连接端口， rpcuser连接用户名， rpcpassword用户密码，regtest网络模式， getblockcount命令
    bitcoin-cli --rpcconnect=192.168.50.168 --rpcport=18333  --rpcuser=bitcoin --rpcpassword=local321 --rpcwait  --regtest getblockcount
    ```

7. ## 参考资源

    * [bitcoin RPC命令列表][api]
    * [bitcoind 配置文件][bitcoin.conf]
    * [使用socat进行端口转发][socat]
    * [Connect to Your Vagrant Virtual Machine with PuTTY][putty]
    * [insight API github源码][insight]
    * [vagrant官网][vagrant]

8. ## FAQ
   * 端口影射好麻烦，能不能直接将18332端口暴露出来？  
    更新记录：使用如下bitcoin.json配置可以解决只能本地监听的问题，可以不再使用socat进行端口映射

    ```json
    server=1
    txindex=1
    addressindex=1
    timestampindex=1
    spentindex=1
    zmqpubrawtx=tcp://127.0.0.1:28332
    zmqpubhashblock=tcp://127.0.0.1:28332
    rpcbind=*
    rpcallowip=0.0.0.0/0
    rpcuser=bitcoin
    rpcpassword=local321
    uacomment=bitcore
    ```

   * 多个节点可以组成Regtest网络吗？  
    可以的，请参考如下资源：  
    1. [Connecting Multiple Bitcoin Core Nodes in Regtest][regtest]
    2. [Multinode / Multiwallet Bitcoin regtest network][regtest1]  
    但要注意，各个节点的版本要一致，不然会出现不能同步数据的问题，比如现在bitcore使用的是bitcoin-0.12.1-bitcore-4(bitpay修改过的), 那么所有节点最好统一版本。

[socat]:https://www.91yun.co/archives/3042
[api]:https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
[bitcoin.conf]:https://en.bitcoin.it/wiki/Running_Bitcoin
[putty]:https://github.com/Varying-Vagrant-Vagrants/VVV/wiki/Connect-to-Your-Vagrant-Virtual-Machine-with-PuTTY
[insight]:https://github.com/bitpay/insight-api
[vagrant]:https://www.vagrantup.com/
[regtest]:https://www.yours.org/content/connecting-multiple-bitcoin-core-nodes-in-regtest-5fdc9c47528b
[regtest1]:https://github.com/FreekPaans/bitcoin-multi-node-regtest