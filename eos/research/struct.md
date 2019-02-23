# eos 源码目录结构分析

1. ##　概述
   本文以eos 1.2.5作为阅读版本，后面系列文章都以此版本为准。

2. ## 下载源码，编译

   ```shell
   cd ~/work/git
   git clone https://github.com/EOSIO/eos
   cd eos
   // compile
   // ./eosio_build.sh
   ```

3. ## 目录

   ```shell
   cd ~/work/git/eos
   ls
   CMakeLists.txt  LICENSE            debian            eosio_build.sh      images     scripts           tools
   CMakeModules    README.md          docs              eosio_install.sh    libraries  testnet.md        tutorials
   Docker          cmake-build-debug  eos.doxygen.in    eosio_uninstall.sh  plugins    testnet.template  unittests
   HEADER          contracts          eosio.version.in  externals           programs   tests
   ```

   看上面的目录结构可得知：
   * 源码使用Cmake作为项目管理工具，Cmake比make具有更好的可移植性，可在Mac/Linux/Windows上运行(eos暂不支持Windows平台)

   通过分析eos_build.sh脚本文件，可知其会引用scripts目录下具体的平台脚本文件，如：

   ```shell
   ls scripts
   CMakeLists.txt  abigen.sh             eosio-tn_down.sh  eosio_build_amazon.sh  eosio_build_dep        ricardeos
   abi_is_json.py  clean_old_install.sh  eosio-tn_roll.sh  eosio_build_centos.sh  eosio_build_fedora.sh
   abi_to_rc       eosio-tn_bounce.sh    eosio-tn_up.sh    eosio_build_darwin.sh  eosio_build_ubuntu.sh
   ```

   其中几个文件名比较特殊：
   * eosio_build_amazon.sh -->    ***amazon平台***
   * eosio_build_centos.sh -->    ***centos环境***
   * eosio_build_darwin.sh -->    ***mac平台***
   * eosio_build_fedora.sh -->    ***fedora环境***
   * eosio_build_ubuntu.sh -->    ***ubuntu环境***
  
   这里仅分析cetnos，其他平台暂未测试，eosio_build_centos.sh大致做了如下事：

   * 收集环境信息，条件检查，如
      * 系统必须是Centos7
      * 内存须大于等于8G，
      * 磁盘空间须20G以上

   * 使用Yum安装SCL仓库，为了系统的稳定，Centos系统安装的软件版本都比较低，SCL仓库中维护较新的一些软件
      * 安装devtoolset-7，高版本的gcc，g++工具
      * 安装Python3
      * 升级系统软件到当前最新版
      * 安装编译过程中需要的一些依赖库，大致有

         ```shell
         git autoconf automake bzip2 libtool ocaml.x86_64 doxygen graphviz-devel.x86_64  
         libicu-devel.x86_64 bzip2.x86_64 bzip2-devel.x86_64 openssl-devel.x86_64 
         gmp-devel.x86_64 python-devel.x86_64 gettext-devel.x86_64
         ```

   * 安装额外依赖工具
      * cmake 3.10.2
      * boost 1.67
      * mongodb，mongodb c++驱动
      * secp256k1-zkp
      * LLVM with WASM

   * 所以依赖安装完成后，eos_build.sh会调用Cmake开始编译，编译时间可能比较长，大概在30~60分钟内。
   * 编译完成后，关键的文件存放在build/programs目录中, 每个子目录中都有一个与目录同名的二进制文件：

      ```shell
       ls build/programs/
       cleos  CMakeFiles  cmake_install.cmake  CTestTestfile.cmake  eosio-abigen  
       eosio-launcher  keosd  Makefile  nodeos
      ```
      * nodeos/nodeos --> eos节点主程序，主要用来出块和同步数据
      * keosd/keosd  -->  eos钱包主程序
      * cleos/cleos  -->  eos客户端程序，通过与nodeos交互来发起交易或查询数据, 通过与keosd交互来使用钱包功能

4. ## 主要目录说明
   * contracts --> 合约源码，eos的合约是以WASM方式编译，WASM一种接近机器语言的中介语言(IR)，类似于Java中的字节码，关键是C、C++、Rust、Typescript都可以编写基于WASM的程序，有益于降低合约开发人员的学习成本，暂时支持得最好的是C++，contracts中包括eosio.bios、eosio.token等系统合约，也有hello等简单的合约，每份合约都独立为一个子目录
   * libraries --> eos核心库文件，对外层的工具、应用、插件提供底层支撑
   * plugins --> eos插件，eos所有功能都是使用插件的方式实现的，一个插件对应plugins下的一个子目录，惯例以xx_plugign命名，如常用的
      * net_plugin  网络插件
      * producer_plugin  出块插件
      * http_plugin  对外提供HTTP接口，属于较低层的插件，其他插件如chain_api_plugin，net_api_plugin， wallet_api_plugin， producer_api_plguin都需要调用http_plguin对外提供访问接口
      * history_plugin  历史插件，提供交易历史查询等功能
  
   * programs --> 主要应用，如nodeos, keosd, cleos
   * scripts --> 编译脚本等
   * tests --> 测试脚本
   * unittests --> 单元测试，更偏向模块中的函数功能测试
   * tutorials --> 快速入门教程
   * tools --> 工具杂项

5. ## git子模块(.gitmodules)

   ```js
   [submodule "libraries/chainbase"]
       path = libraries/chainbase
       url = https://github.com/eosio/chainbase
       ignore = dirty
   [submodule "libraries/appbase"]
       path = libraries/appbase
       url = https://github.com/eosio/appbase
           ignore = dirty
   [submodule "contracts/musl/upstream"]
       path = contracts/musl/upstream
       url = https://github.com/EOSIO/musl.git
       branch = eosio
   [submodule "contracts/libc++/upstream"]
       path = contracts/libc++/upstream
       url = https://github.com/EOSIO/libcxx.git
       branch = eosio
   [submodule "externals/binaryen"]
       path = externals/binaryen
       url = https://github.com/EOSIO/binaryen
   [submodule "libraries/softfloat"]
       path = libraries/softfloat
       url = https://github.com/eosio/berkeley-softfloat-3
   [submodule "externals/magic_get"]
       path = externals/magic_get
       url = https://github.com/EOSIO/magic_get
   [submodule "libraries/fc"]
       path = libraries/fc
       url = https://github.com/EOSIO/fc
   ```

   * libraries/chainbase
   为区块链设计的事务数据库，拥有如下特性：
      * 支持多种对象(表)，每种对象支持多索引(基于boost::multi_index_container)
      * 持久化状态存储且可以在多进程间共享(通过boost shared file map)
      * 支持嵌套事务且具有无限撤消功能

   * libraries/appbase
   插件管理框架，负责管理应用内所有插件的生命周期，如配置、初始化、启动、结束等，确保各插件的有序配合，主要特性有：
      * 动态加载插件
      * 自动加载依赖插件
      * 插件可以通过命令行参数或配置文件来指定配置选项
      * 在收到终止信号时，如SIGINT和SIGTERM，优雅退出
      * 最小化依赖
      * 插件接口，每个插件都要实现下面的功能
         * Initialize，初始化，解析配置文件或命令行参数
         * Startup，开始执行
         * Shutdown，停止且清理资源

   * libraries/fc
   底层工具类，如压缩、加密、进程间通信、IO相关，网络、日志、UTF8编码、序列化等

   * libraries/softfloat
   来自Berkeley的浮点运算库，纯软件实现

   * contracts/musl/upstream
   [git://git.musl-libc.org/musl](git://git.musl-libc.org/musl) 的镜像仓库，musl-libc是C库的标准实现

   * contracts/libc++/upstream
   [http://llvm.org/git/libcxx](http://llvm.org/git/libcxx) 镜像仓库，C++标准库

   * externals/binaryen
   将C、C++代码编译写wasm或是运行wasm代码

   * externals/magic_get
   通过反射方式精确获取结构中的成员信息，基于C++14标准

6. ## 参考资料
   * [eos官方文档][eosio]
   * [eos 源码][source]
   * [WebAssembly 系列文章翻译][wasm]
   * [LLVM : WebAssembly支持初探][llvm]

[eosio]:https://developers.eos.io/
[source]:https://github.com/EOSIO/eos
[wasm]:https://www.zcfy.cc/@Mactaivsh/article
[llvm]:https://zhuanlan.zhihu.com/p/24632251