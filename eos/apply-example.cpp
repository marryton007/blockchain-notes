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
		require_auth(user);
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