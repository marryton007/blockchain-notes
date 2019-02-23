# EOS 存储模块分析

1. ## 背景
   在区块链中，链上数据最终都要持久化存储到每个节点的磁盘上，本文尝试分析在eos平台上，区块链如何与文件系统进行交互

2. ## 交互场景
   * 从文件系统查看(参考[eos Jungle测试网络][jungle]项目)

   ```shell
   [jiaxi@localhost JungleTestnet]$ ls
   blocks  cleos.sh  config.ini  genesis.json  nodeos.pid  README.md  scripts  start.sh  state  
   stderr.txt  stdout.txt  stop.sh  Wallet
   ```

   文件主要存放在blocks、state目录中

   ```shell
   [jiaxi@localhost JungleTestnet]$ tree  blocks state
   blocks
   ├── blocks.index
   ├── blocks.log
   └── reversible
       ├── shared_memory.bin
       └── shared_memory.meta
   state
   ├── shared_memory.bin
   └── shared_memory.meta

   1 directory, 6 files
   ```

3. ## 源码
   通过在源码中查找blocks.index、blocks.log之类的关键字，代码定位在libraries/chain/controller.cpp:139行

   ```c++
   controller_impl( const controller::config& cfg, controller& s  )
   :self(s),
    db( cfg.state_dir,
        cfg.read_only ? database::read_only : database::read_write,
        cfg.state_size ),
    reversible_blocks( cfg.blocks_dir/config::reversible_blocks_dir_name,
        cfg.read_only ? database::read_only : database::read_write,
        cfg.reversible_cache_size ),
    blog( cfg.blocks_dir ),
    fork_db( cfg.state_dir ),
    wasmif( cfg.wasm_runtime ),
    resource_limits( db ),
    authorization( s, db ),
    conf( cfg ),
    chain_id( cfg.genesis.compute_chain_id() ),
    read_mode( cfg.read_mode )
   {
    ...
   }
   ```

   controller_impl 定义在libraries/chain/controller.cpp:91，内容如下：

   ```C++
   struct controller_impl {
      controller&                    self;
      chainbase::database            db;                // 对应state目录下的文件
      chainbase::database            reversible_blocks; // 对应blocks/reversible目录下的文件，存储已经接收但仍可逆的块
      block_log                      blog;              // 对应blocks/blocks.*, 持久化存储账本数据
      optional<pending_state>        pending;
      block_state_ptr                head;
      fork_database                  fork_db;           // 对应state/forkdb.dat, 分支数据库
   ```

   其中db/reversible_blocks是由git子模块libraries/chainbase来实现，chainbase的使用方法如[官方README][readme]所述如下：

   ```C++
   /* 第一步, 定义一个存储书籍的表，这里取枚举的表ID */
   enum tables {
        book_table
   };

   /* 第二步，定义书籍的结构体结构体必须继承chainbaise::object,
   传入2个模板参数，一个是第一步定义的表ID，第二个是结构体本身*/
   struct book : public chainbase::object<book_table, book> {
        /* 默认构造函数  */
        CHAINBASE_DEFAULT_CONSTRUCTOR( book )

        id_type          id;  // 必须定义，在表中作为主键
        int pages        = 0; // 总页数
        int publish_date = 0; // 出版日期
   };

   /* 定义表索引， 可以按3种方式检索， 主键ID，总页数，出版日期 */
   struct by_id;
   struct by_pages;
   struct by_date;

   /* 定义一个boost_multi_index容器，有3点要注意
    1. 容器必须使用chainbase::alloctor<book> 作为存储
    2. 首个索引必须是主键ID，是唯一的
   */
   typedef multi_index_container<
      book,
      indexed_by<
         ordered_unique< tag<by_id>, member<book,book::id_type,&book::id> >, ///< 第一个索引，必须是主键，且是唯一索引
         ordered_non_unique< tag<by_pages>, BOOST_MULTI_INDEX_MEMBER(book,int,pages) >,
         ordered_non_unique< tag<by_date>, BOOST_MULTI_INDEX_MEMBER(book,int,publish_date) >
      >,
      chainbase::allocator<book> ///< 必须
   > book_index;

   int main( int argc, char** argv ) {
      chainbase::database db;
      /* 创建或打开一个容量为8M的数据库，存放在database_dir目录下 */  
      db.open( "database_dir", database::read_write, 1024*1024*8 );  
      /* 创建或打开前面的book_index， book_index类似于数据库中的表 */
      db.add_index< book_index >(); /// open or create the book_index

      /* 在数据库中获取book_index */
      const auto& book_idx = db.get_index<book_index>().indicies();

      /**
      在数据库放入2本书籍，注意 db.create<book>(lambda函数)， 返回一个引用
       */
      const auto& new_book300 = db.create<book>( [&]( book& b ) {
          b.pages = 300+book_idx.size();
      } );
      const auto& new_book400 = db.create<book>( [&]( book& b ) {
          b.pages = 300+book_idx.size();
      } );

      /**
      修改new_book300这本书籍， 注意db.modify(new_book300, lambda函数)
      */
      db.modify( new_book300, [&]( book& b ) {
         b.pages++;
      });

      /* 遍历book_index表，打印所有书籍的页数 */
      for( const auto& b : book_idx ) {
         std::cout << b.pages << "\n";
      }

      /* 对book_index表，搜索多于100页的书籍， 并列出其页数 */
      auto itr = book_idx.get<by_pages>().lower_bound( 100 );
      if( itr != book_idx.get<by_pages>().end() ) {
         std::cout << itr->pages;
      }

      /* 删除new_book400这本书 */
      db.remove( new_book400 );

      return 0;
   }
   ```

4. ## 参考资源
    * [eos源码][eos]
    * [eos Jungle测试网络][jungle]
    * [chainbase README][readme]

[eos]:https://github.com/EOSIO/eos
[jungle]:https://github.com/CryptoLions/EOS-Jungle-Testnet
[readme]:https://github.com/eosio/chainbase#example-usage
