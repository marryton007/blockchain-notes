#include <eosiolib/eosio.hpp>

using namespace eosio;

class [[eosio::contract]] abcounter : public eosio::contract {
public:
	using contract::contract;

	abcounter(name receiver, name code, datastream<const char*> ds):contract(receiver, code, ds){}

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