#include <eosiolib/eosio.hpp>
#include <eosiolib/print.hpp>

using namespace eosio;

class [[eosio::contract]] addressbook : public eosio::contract {
  public:
    using contract::contract;
    addressbook(name receiver, name code, datastream<const char *> ds):contract(receiver, code, ds){}

    [[eosio::action]]
      void upsert(name user, std::string first_name, std::string last_name, std::string street, std::string city, std::string state){
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
      }
      else{
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
