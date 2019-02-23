# EOS智能合约编写指南

1. ## 内容概要
   本文尝试给你提供一份完整的开发EOS智能合约快速入门指南，争取让你在较短的时间内上手开发EOS智能合约，本文将精力集中于EOS智能合约本身的开发，对于其它部分，如EOS开发环境的搭建，尽量选用类似Docker容器环境，免去自己搭建开发环境的痛苦。读者最好有一些C++的相关知识，了解Linux基本命令等，好，我们开始吧。

2. ## 开发环境搭建
   首先，我们需要一个智能合约运行的环境，这里我们可以搭一个单节点的EOS环境，本例以使用ubuntu18.04为例
   * 搭建eos单节点
      * 下载[eosjs项目][eosjs]

      ```shell
      mdkir work && cd work
      git clone https://github.com/EOSIO/eosjs.git
      cd eosjs
      git checkout v16.0.9
      cd docker
      ```

      * 稍作修改
        1. 代码里使用的docker镜像是1.2.4，可以修改成高版本的镜像，我这里使用的是1.2.5
        2. 在nodeos服务的command命令里加上"--contracts-console"，允许合约执行时将打印输出到控制台，方便调试
        3. 给nodeos服务添加主机文件夹影射，这里"/home/jiaxi/git/code"是主机目录，存放智能合约源码，"/tmp/contracts"是docker中的目录位置

           ```yaml
           volumes:
             - "/home/jiaxi/git/code:/tmp/contracts"
           ```

        4. 如果你觉得上面的步骤比较多，可以直接使用我提供的[diff文件](eosjs.diff)

           ```shell
           git apply --reject eosjs.diff
           ```

      * 启动EOS节点

       ```shell
       cd work/eosjs/docker
       ./up.sh
       ```

      * 测试节点程序

       ```shell
       alias cleos='docker exec docker_keosd_1 cleos -u http://nodeosd:8888 --wallet-url http://localhost:8900'
       cleos get info
       ```
       注意：使用alias创建别名，简化命令输入，珍惜生命，后面还要用到。

   * 安装合约编译工具(cdt)

    ```shell
    wget -c https://github.com/EOSIO/eosio.cdt/releases/download/v1.3.2/eosio.cdt-1.3.2.x86_64.deb
    sudo dpkg -i eosio.cdt-1.3.2.x86_64.deb
    ```

3. ## 开发首个合约
   在eos源码目录中，已经提供了一些关智能合约的例子，但由于使用cdt工具来编译，这些例子要做一些小小的改动，以符合编译工具的需要，我们来看一下例子。
   * 官方原始版本的hello合约

    ```c++
    #include <eosiolib/eosio.hpp>
    using namespace eosio;

    class hello : public eosio::contract {
    public:
        using contract::contract;

        /// @abi action 
        void hi( account_name user ) {
            print( "Hello, ", name{user} );
        }
    };

    EOSIO_ABI( hello, (hi) )
    ```
   * 使用cdt工具编译的新[greeting合约](greeting.cpp)

    ```c++
    #include <eosiolib/eosio.hpp>

    using namespace eosio;

    class greeting : public contract {
    public:
        using contract::contract;

        [[eosio::action]]
        void hi( name user ) {
            print( "greeting, ", name{user});
        }
    };
    EOSIO_DISPATCH( greeting, (hi))
    ```

    请注意新版本里的"[[eosio::action]]"修饰，类似的还有[[eosio::contract]], [[eosio::table]], 还有最后的EOSIO_API宏变成了EOSIO_DISPATCH。

   * 编译

    ```shell
    cd /home/jiaxi/git/code
    mkdir greeting
    cd greeting
    eosio-cpp -o greeting.wasm greeting.cpp --abigen
    ```
    注意：
    1. 目录"/home/jiaxi/git/code", 请与前面docker-compose启动时的参数保持一致。
    2. 上面最后一步使用eosio-cpp编译出2个文件，一个是greeting.wasm, 一个是greeting.abi, 这2个文件是后面部署时必须的。其中.wasm是符合WebAssembly格式的二进制文件，即智能合约编译后的代码(code), abi文件是一json文件。

   * 部署

    ```shell
    cleos create account eosio greeting EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV -p eosio@active
    cleos set contract greeting /tmp/contracts/greeting -p greeting@active
    cleos push action greeting hi '["jiaxi"]' -p greeting@active
    ```
    注意：
    1. cleos是前面alias创建的别名，它其实是执行了docker容器中的一条命令
    2. cleos create account <创建者帐户> <新账户名> <公钥> -p <创建者权限>
        * 上面这条命令意思即使用esoio这个帐户新建了greeting这个帐户。
        * 为了简单起见，greeting与eosio使用了同一套公钥、私钥
        * 可以通过命令"cleos wallet keys"来列出当前钱包中导入KEY
        * 可以通过命令"cleos get accounts EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV" 来列出使用了该公钥的所有用户
    3. cleos set contract <帐户名称> <合约路径> -p <帐户权限>
    4. cleos push action <帐户名称> <合约中的action名称> <调用参数> -p <帐户权限>
    5. 你可以重复前面的'set contract'，每当你发觉合约不够完善，需要修改，就可以再次执行该命令，这就是所谓的"升级合约"了。你可以看出EOS中，合约是依附在帐户系统上的。而要调用合约则是通过'push action'操作。

    万事开头难，走到这里，恭喜你已经完成非常重要的一步！

4. ## 持久化存储
   合约中有些数据需要长久保留下来，比如说一个电话本，一份公司名册，一份失信人员黑名单等。这些数据都需要长久保留下来，而不是使用一次就算完了。在eos合约中，可以使用multi_index来存储这些数据。multi_index基于boost的multi_index，相对于标准C++容器，如vector,set等，boost multi_index提供了多索引能力，基本上你可以将multi_index理解为DB中的表了。DB中每个表可以按多个字段来索引，multi_index类似。我们来看一下如何在合约中使用multi_index功能。

   * 定义结构体，以电话本为例

    ```C++
        struct [[eosio::table]] person {
            name key;
            std::string first_name;
            std::string last_name;
            std::string street;
            std::string city;
            std::string state;

            uint64_t primary_key() const { return key.value; }
        };

        typedef eosio::multi_index<"people"_n, person> address_index;
    ```
    注意：
    1. 注意结构体中[[eosio::table]]的修饰，这是必须的
    2. 必须要有uint64_t primary_key() const, 这么一个函数，这个函数返回表的主键定义
    3. typedef eosio::multi_index<"people"_n, person> address_index
        * 使用eosio::mutli_index<表名，存储的结构体>定义一个表，这里即定义了名为people的表，表中存储的结构体为struct person
        * 新定义了一个类型address_index

    * 主要操作
       * 初始化

        ```c++
        address_index addresses(_code, _code.value);
        ```
        其中_code由上下文传入，一般对应合约名称。 生成表对象名addresses，只要传入的参数一样，返回的都是同一个表，无论对象名称是什么

       * 查询

        ```c++
        auto itr = addresses.find(user.value);
        ```
        根据关键字，调用find方法，查询相关记录，返回迭代器对象

       * 新增

        ```c++
        addresses.emplace(user, [&](auto& row){
                            row.key = user;
                            row.first_name = first_name;
                            row.last_name = last_name;
                            row.street = street;
                            row.city = city;
                            row.state = state;
                        });

        ```
        向addresses表中插入一个记录， emplace函数有2个参数，第2个参数是个lambda函数

       * 修改

        ```c++
        addresses.modify(itr, user, [&](auto& row){
                                row.key = user;
                                row.first_name = first_name;
                                row.last_name = last_name;
                                row.street = street;
                                row.city = city;
                                row.state = state;
                            });

        ```
        这里第一个参数是迭代器对象，最后一个参数是lambda函数

       * 删除

        ```c++
        addresses.erase(itr);
        ```
        这里第一个参数是迭代器对象

5. ## 合约之间的触发
   记得有个故事说，一根筷子很容易被折断，如果是一堆筷子就不那么容易了。套到智能合约上，这个故事就是一个智能合约的功能是有限的，那多个合约功能就是无限的！故事很美好，但首先要解决一个问题，合约之间如何触发。前面说调用合约是通过'push action'操作，那在写智能合约的时候有没有函数可以实现这个功能呢？ 你猜对了，这是必须要有的(不然故事就没法往下说了)，其原理也是发送Action，相关的API是action().send(), 让我们来看2个合约。

    * [地址本合约](addressbook.cpp)

    ```C++
    #include <eosiolib/eosio.hpp>
    #include <eosiolib/print.hpp>

    using namespace eosio;

    class [[eosio::contract]] addressbook : public eosio::contract {
    public:
        using contract::contract;
        addressbook(name receiver, name code, 
                    datastream<const char *> ds):contract(receiver, code, ds){}

        [[eosio::action]]
        void upsert(name user, std::string first_name, std::string last_name,
                    std::string street, std::string city, std::string state){
            require_auth(user);
            address_index addresses(_code, _code.value);
            auto itr = addresses.find(user.value);
            if(itr == addresses.end()){
                addresses.emplace(user, [&](auto& row){
                                        row.key = user;
                                        row.first_name = first_name;
                                        row.last_name = last_name;
                                        row.street = street;
                                        row.city = city;
                                        row.state = state;
                                        });
                send_summary(user, "successfully emplace record to addressbook.");
                increment_counter(user, "emplace");
            }else{
                std::string changes;
                addresses.modify(itr, user, [&](auto& row){
                                            row.key = user;
                                            row.first_name = first_name;
                                            row.last_name = last_name;
                                            row.street = street;
                                            row.city = city;
                                            row.state = state;
                                            });
                send_summary(user, "successfully modified record in addressbook");
                increment_counter(user, "modify");
            }
        }

        [[eosio::action]]
        void erase(name user){
            require_auth(user);
            address_index addresses(_code, _code.value);
            auto itr = addresses.find(user.value);
            eosio_assert(itr != addresses.end(), "Record does not exist anymore.");
            addresses.erase(itr);
            send_summary(user, "erased record from addressbook");
            increment_counter(user, "erase");
        }

        [[eosio::action]]
            void notify(name user, std::string msg){
            require_auth(get_self());
            require_recipient(user);
        }

    private:
        struct [[eosio::table]] person {
            name key;
            std::string first_name;
            std::string last_name;
            std::string street;
            std::string city;
            std::string state;

            uint64_t primary_key() const { return key.value; }
        };

        void send_summary(name user, std::string msg){
            action(permission_level{get_self(), "active"_n},
                    get_self(),
                    "notify"_n,
                    std::make_tuple(user, name{user}.to_string() + " "+ msg)
                    ).send();
        }

        void increment_counter(name user, std::string type){
            action counter = action(permission_level{get_self(), "active"_n},
                                    "abcounter"_n,
                                    "count"_n,
                                    std::make_tuple(user, type));
            counter.send();
        }

        typedef eosio::multi_index<"people"_n, person> address_index;
    };

    EOSIO_DISPATCH(addressbook, (upsert)(notify)(erase))
    ```

    * [计数合约](abcounter.cpp)

    ```C++
    #include <eosiolib/eosio.hpp>
  
    using namespace eosio;

    class [[eosio::contract]] abcounter : public eosio::contract {
    public:
        using contract::contract;

        abcounter(name receiver, name code,
                datastream<const char*> ds):contract(receiver, code, ds){}

        [[eosio::action]]
        void count(name user, std::string type){
            require_auth(name("addressbook"));
            count_index counts(_code, _code.value);
            auto itr = counts.find(user.value);

            if (itr == counts.end()){
                counts.emplace("addressbook"_n, [&](auto& row){
                    row.key = user;
                    row.emplaced = (type == "emplace") ? 1 : 0;
                    row.modified = (type == "modify") ? 1 : 0;
                    row.erased = (type == "erase") ? 1 : 0;
                });
            }else{
                counts.modify(itr, "addressbook"_n, [&](auto& row){
                    if (type == "emplace"){ row.emplaced += 1; }
                    if (type == "modify") { row.modified += 1; }
                    if (type == "erase") { row.erased += 1; }
                });
            }
        }

    private:
        struct [[eosio::table]] counter{
            name key;
            uint64_t emplaced;
            uint64_t modified;
            uint64_t erased;

            uint64_t primary_key() const { return key.value; }
        };  

        using count_index = eosio::multi_index<"mycounts"_n, counter>;
    };  

    EOSIO_DISPATCH(abcounter, (count));
    ```

    前面的action被称为inline-action(内部action),其特点是inline-action与前面其他action是封装一个事务(transaction)中,如果inline-action执行失败，则整个事务会回滚。
    其中关键点在于action().send()
    一个action需要几个参数：
    * permission_level对象，一般形似<帐户名@active>，发起action的授权信息
    * 帐户名
    * action名称
    * action参数  
    这其实是一套消息/信号机制，合约之间通过'send action'的方式，目标合约收到消息后，会根据帐户部署的合约来对action作出反应。非常类似Erlang语言中的处理，也是面向对象编程模型的基础。通过合理的编排，利用这套机制可以实现'工作流'之类的操作，你可以自由发挥，唯一限制你的只是你的想象力。

6. ## 自定义合约路由(Dispatch)
   EOS智能合约的入口函数是apply(receiver, code, action)，即合约开始执行时，都从apply这个函数开始，通过重新实现apply函数，就可以完全控制合约的运行与调度，其实EOSIO_DISPATCH宏内部就是对apply函数的封装。那自己实现apply函数有什么用呢？可以针对一些特殊情况做些处理，请看下面这个[例子](apply-example.cpp)：

    ```C++
    #include <eosiolib/eosio.hpp>

    using namespace eosio;

    class [[eosio::contract]] inita : public eosio::contract{
    public:
        using contract::contract;

        inita(name receiver, name code, datastream<const char*> ds):contract(receiver, code, ds){}

        [[eosio::action]]
        void test(name user, std::string msg){
            require_auth(user);
            print("_code: ", _code);
            print("msg: ", msg);
        }

        [[eosio::action]]
        void notify(name user, std::string msg){
            // auto data = unpack_action_data<notify>();
            // require_auth(user);
            print("\n I'm in user ", user, " and action notify. ");
            print("\n_self: ", _self);
            print("\n_code: ", _code);
            print("\nuser: ", user);
            print("\nmsg: ", msg);
        }

    };

    extern "C" {
        void apply(uint64_t receiver, uint64_t code, uint64_t action) {
            auto self = receiver;
            print("\nreceiver: ", name(receiver));
            print("\ncode: ", name(code));
            print("\naction: ", name(action));

            if(self == code){
                switch(action){
                    case name("test").value:
                        execute_action(name(receiver), name(code), &inita::test);
                    case name("notify").value:
                        execute_action(name(receiver), name(code), &inita::notify);
                }
            }else if(name(code) == name("addressbook")){
                execute_action(name(receiver), name("inita"), &inita::notify);
            }
        }
    };
    ```

7. ## 参考资源
   * [EOS智能合约快速入门][start]
   * [EOS智能合约参考资料][eosio-cpp]
   * [Boost multi-index 容器参考][multi_index]

8. ## 总结
   本文给出了EOS智能合约开发的一个完整流程，限于篇幅，很多细节没有详细展开，不过一些关键的概念，如***action，multi_index, apply***是理解EOS智能合约的关键元素和骨架，掌握了这些关键点，再加上合约相关的参考资料，相信你很快会写出自己的智能合约。

[start]:https://developers.eos.io/eosio-home/docs
[eosio-cpp]:https://developers.eos.io/eosio-cpp/docs
[eosjs]:https://github.com/EOSIO/eosjs.git
[multi_index]:https://www.boost.org/doc/libs/1_67_0/libs/multi_index/doc/index.html