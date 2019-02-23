# EOS关键技术点

1. ## 背景
   在近2个月[EOS源码][eos_code]研读过程中，从一开始的不太熟悉C++11、Boost库，慢慢渐入佳镜，当把代码主要脉络都撸了一遍后，感觉C++写个大型项目还有很有趣的。本文就以个人的理解来说一说EOS当中一些技术上的关键实现。

2. ## 关键技术点
   * **multi_index_container**  
    Boost的mutli_index_container容器相比STD的vector/set之类的容器多了一个多索引功能，就好像数据库可以建多个索引一样(每个索引针对一列或多列)，multi_index_container也可以针对存储对像的一个字段或多个字段建立索引，从更高角度看，你基本上就可以把multi_index_container理解为数据库中的表一样，可以参考如下一段代码，见libraries/chain/controller.cpp:332

    ```C++
       void add_indices() {
        reversible_blocks.add_index<reversible_block_index>();

        db.add_index<account_index>();
        db.add_index<account_sequence_index>();

        db.add_index<table_id_multi_index>();
        db.add_index<key_value_index>();
        db.add_index<index64_index>();
        db.add_index<index128_index>();
        db.add_index<index256_index>();
        db.add_index<index_double_index>();
        db.add_index<index_long_double_index>();

        db.add_index<global_property_multi_index>();
        db.add_index<dynamic_global_property_multi_index>();
        db.add_index<block_summary_multi_index>();
        db.add_index<transaction_multi_index>();
        db.add_index<generated_transaction_multi_index>();

        authorization.add_indices();
        resource_limits.add_indices();
    }
    ```

    在上面这段代码中，可以理解为往数据库中添加一系列表，每一次db.add_index<xxx>()就是添加一个表，其中xxx就是一个multi_index_container，表明了表中存储的对象等。
    代码中的db实现在[chainbase源码][chainbase]可以找到，它作为git子项目引入，如官网所示，它有如下功能：

        * 支持多个表(multiple objects)
        * 支持持久化存储或多进程共享
        * 支持无限回滚(undo)

    这里先说一下回滚，db在[eos][eos]中主要的用途就是存放世界状态(world_state)，另外一个重要的元素pending是基于db得来，关于pending，你可以理解为是用来"存储未确认交易"的一个容器。[eos][eos]的逻辑是这样的，节点收到一个交易请求后，通过基本检查之后，就在该节点上执行该交易，执行的过程中会修改节点上world_state，并将该交易放入pending(因为该交易并没有被整个系统确认)，在某些时候，可能是这个交易最终没有达成共识，或是交易的顺序不一致等，这时就需要回滚world_state的状态，在这里pending的undo功能就派上用场了。

    持久化和多进程共享：在实现上用到了[Boost Managed Memory Segments][mmap]，该技术将一个文件映射到进程空间之中，这样在进程中对某段内存修改就是直接修改了文件内容，其他进程也可以将该文件映射到自己的进程空间中，这样就完成了在多进程间共享的效果。

    可以说[chainbase][chainbase]是[eos][eos]为区块链这种场景量身定做的一款简单、高效的数据库。

   * **boost asio**  
    [Boost.asio][boost_asio]是一个跨平台，主要用于网络和其他一些底层IO的C++库，关于asio的资料请大家查阅官方文档或网络资料，[eos][eos]主要将asio用于P2P节点通信以及一些异步IO任务，如网络数据的异步读写，一些定时器的应用等。

   * **plugin**  
    个人觉得[eos][eos]代码比较好理解的原因在于其插件(plugin)机制，每个插件仅实现较小的特定功能，这让代码从整体上看来比较好理解，如核心的chain_plugin，net_plugin, producer_plugin等。其中chain_plugin更是将libraries下的代码封装成插件，为其他插件提供服务。插件的管理框架由git子项目[appbase实现][appbase]实现，得益于该框架，[eos][eos]可以动态架载某个插件及其依赖的插件，可以通过传递命令行参数或加载配置文件的方式来改变运行参数，在收到杀死信号时能优雅的执行插件清理工作等。[appbase][appbase]本身也使用[Boost.signals2][signals2]来实现插件间通道(channel)和(method)，也即QT编程中的signal+slot模式，或者说是监视/观察者/订阅者模式，在一个插件做完某件工作后，可以触发(emit)一个事件，监听这个事件的其他插件就可以接着做其他事了。

    下面的内容来自于plugins/chain_interface/include/eosio/chain/plugin_interface.hpp, 从这个文件也算可以管中窥豹，大致猜测出[eos][eos]插件间会有哪些事件传递了。

    ```C++
    namespace eosio { namespace chain { namespace plugin_interface {
    using namespace eosio::chain;
    using namespace appbase;

    template<typename T>
    using next_function = std::function<void(const fc::static_variant<fc::exception_ptr, T>&)>;

    struct chain_plugin_interface;

    namespace channels {
        using pre_accepted_block     = channel_decl<struct pre_accepted_block_tag,    signed_block_ptr>;
        using rejected_block         = channel_decl<struct rejected_block_tag,        signed_block_ptr>;
        using accepted_block_header  = channel_decl<struct accepted_block_header_tag, block_state_ptr>;
        using accepted_block         = channel_decl<struct accepted_block_tag,        block_state_ptr>;
        using irreversible_block     = channel_decl<struct irreversible_block_tag,    block_state_ptr>;
        using accepted_transaction   = channel_decl<struct accepted_transaction_tag,  transaction_metadata_ptr>;
        using applied_transaction    = channel_decl<struct applied_transaction_tag,   transaction_trace_ptr>;
        using accepted_confirmation  = channel_decl<struct accepted_confirmation_tag, header_confirmation>;

    }

    namespace methods {
        using get_block_by_number    = method_decl<chain_plugin_interface, signed_block_ptr(uint32_t block_num)>;
        using get_block_by_id        = method_decl<chain_plugin_interface, signed_block_ptr(const block_id_type& block_id)>;
        using get_head_block_id      = method_decl<chain_plugin_interface, block_id_type ()>;
        using get_lib_block_id       = method_decl<chain_plugin_interface, block_id_type ()>;

        using get_last_irreversible_block_number = method_decl<chain_plugin_interface, uint32_t ()>;
    }

    namespace incoming {
        namespace channels {
            using block                 = channel_decl<struct block_tag, signed_block_ptr>;
            using transaction           = channel_decl<struct transaction_tag, packed_transaction_ptr>;
        }

        namespace methods {
            // synchronously push a block/trx to a single provider
            using block_sync            = method_decl<chain_plugin_interface, void(const signed_block_ptr&), first_provider_policy>;
            using transaction_async     = method_decl<chain_plugin_interface, void(const packed_transaction_ptr&, bool，
            next_function<transaction_trace_ptr>), first_provider_policy>;
        }
    }

    namespace compat {
        namespace channels {
            using transaction_ack       = channel_decl<struct accepted_transaction_tag, std::pair<fc::exception_ptr, packed_transaction_ptr>>;
        }
    }

    } } }
    ```

   * **PImpl**  
    这种写法在[eos][eos]代码中相当常见，这里就拿出来给大家讲一讲，先看一些代码片断，好有个印象：

    libraries/chain/include/eosio/chain/controller.hpp
    ```C++
    class controller {
        public:
            ......
        private:
            std::unique_ptr<controller_impl> my;
    }
    ```

    plugins/chain_plugin/include/eosio/chain_plugin/chain_plugin.hpp
    ```C++
    class chain_plugin : public plugin<chain_plugin> {
        public:
            ......
        private:
            ......
            unique_ptr<class chain_plugin_impl> my;
        };
    ```

    plugins/net_plugin/include/eosio/net_plugin/net_plugin.hpp
    ```C++
    class net_plugin : public appbase::plugin<net_plugin>
    {
        public:
            ......
        private:
            std::unique_ptr<class net_plugin_impl> my;
    };
    ```

    plugins/producer_plugin/include/eosio/producer_plugin/producer_plugin.hpp
    ```C++
    class producer_plugin : public appbase::plugin<producer_plugin> {
        public:
            ......
        private:
            std::shared_ptr<class producer_plugin_impl> my;
    };
    ```

    上面大家看到代码风格非常一致，都是在.hpp文件里定义一个私有的my类变量，这个类变量都以_impl结尾，而相对应的_impl的实现是在对应的.cpp文件中。这是C++的一种习惯用法，主要目的是为了达到接口与实现分离，只要对外的.hpp文件不变，内部_impl不论怎么实现都可以。

   * **CRTP**  
    [奇异递归模板模式][crtp]，奇怪的名字，还不好记。基主要特征表现为：将派生类作为基类的模板参数，看[wiki][crtp]上的一个示例：

    ```C++
    // Base class has a pure virtual function for cloning
    class Shape {
    public:
        virtual ~Shape() {}
        virtual Shape *clone() const = 0;
    };
    // This CRTP class implements clone() for Derived
    template <typename Derived>
    class Shape_CRTP : public Shape {
    public:
        virtual Shape *clone() const {
            return new Derived(static_cast<Derived const&>(*this));
        }
    };

    // Nice macro which ensures correct CRTP usage
    #define Derive_Shape_CRTP(Type) class Type: public Shape_CRTP<Type>

    // Every derived class inherits from Shape_CRTP instead of Shape
    Derive_Shape_CRTP(Square) {};
    Derive_Shape_CRTP(Circle) {};
    // This allows obtaining copies of squares, circles or any other shapes by shapePtr->clone().
    ```

    [crtp][crtp]主要实现了C++中的"静态多态"(Compile-time Polymorphism)，避免了"动态多态"(Run-time Polymorphism)中虚表调用的开销，但并不能完全取代"动态多态"。

   * **C++模板**  
    这个主题是最基本，也是最重要的一个，在[eos][eos]源码中，几乎比比皆是，有人说到了令人发指的地步，这是绕不过去的一个门槛，既然没有捷径，只能迎难而上了。

3. ## 总结
    本文列出了在研读[EOS源码][eos_code]过程中遇到的一些C++相关主题，也算是做一个回顾。这里说一些体会，刚开始看的时候进度比较慢，在CRTP，smart-point等技术点上卡了些时间，那时对代码理解也不深刻，只是有一个大概的印象，但还是坚持看了下来，一边看代码，一边查资料，慢慢的也就习惯了，发现理解的速度也加快了。我认为看代码有几点比较重要：
    * 遇到不懂的技术点，再去查资料/工具书，而不是看把工具书看一遍，再来看代码。
    * 合适的代码浏览、调试工具。"磨刀不误砍柴功"，好的工具确实能让人舒心如意，提高效率。看[EOS源码][eos_code]时，[jetbrains公司出品的clion][clion]就非常合适，对C++和Cmake支持非常完美，也集成了调试环境，支持Mac/Linux/Windows, 非常合适，唯一的缺点是内存占得太厉害了。另外就开发环境来说，还是Mac/Linux比较合适，Windows实在是不适合作开发。
    * 有时看书、看资料怎么都不能理解，可先把这个问题放一边，去看其他的东西，慢慢来。有人说学习之路是螺旋式的，别人我不知道，我好像属于这种。

4. ## 参考资料
   * [chainbase源码][chainbase]
   * [eos 内存数据库 chainbase 深入解析][chainbase2]
   * [Boost Managed Memory Segments][mmap]
   * [eos][eos]
   * [EOS源码][eos_code]
   * [Boost.asio 介绍][asio]
   * [Boost.asio 官方资料][boost_asio]
   * [Framework for building applications based upon plugins][appbase]
   * [Boost.Signals2][signals2]
   * [编译防火墙——C++的Pimpl惯用法解析][pimpl2]
   * [pimpl][pimpl]
   * [奇异递归模板模式][crtp]
   * [C++中文参考][cpp_zh]
   * [C++英文参考][cpp_en]
   * [jetbrains clion][clion]

[chainbase]:https://github.com/eosio/chainbase
[chainbase2]:https://eosfans.io/topics/1172
[mmap]:https://www.boost.org/doc/libs/1_67_0/doc/html/interprocess/managed_memory_segments.html#interprocess.managed_memory_segments.managed_shared_memory
[eos]:https://eos.io/
[eos_code]:https://github.com/EOSIO/eos
[asio]:https://blog.csdn.net/column/details/boost-asio.html
[boost_asio]:https://www.boost.org/doc/libs/1_66_0/doc/html/boost_asio/overview.html
[appbase]:https://github.com/eosio/appbase
[signals2]:https://www.boost.org/doc/libs/1_68_0/doc/html/signals2.html
[pimpl]:https://zh.cppreference.com/w/cpp/language/pimpl
[pimpl2]:https://blog.csdn.net/lihao21/article/details/47610309
[crtp]:https://zh.wikipedia.org/wiki/%E5%A5%87%E5%BC%82%E9%80%92%E5%BD%92%E6%A8%A1%E6%9D%BF%E6%A8%A1%E5%BC%8F
[cpp_zh]:https://zh.cppreference.com/w/%E9%A6%96%E9%A1%B5
[cpp_en]:https://en.cppreference.com/w/
[clion]:https://www.jetbrains.com/clion/