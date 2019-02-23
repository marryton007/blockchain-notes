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
