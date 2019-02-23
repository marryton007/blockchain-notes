var chai = require('chai'),
    should = chai.should(),
    expect = require('chai').expect,
    supertest = require('supertest'),
    crypto = require('crypto')
    util = require('util')
    api = supertest('http://47.96.37.107:8091');

chai.use(require('chai-subset')); 
chai.use(require('chai-things'));


describe('wallet', function () {

     it('check app version', function (done) {
        api.post('/api/misc/appversion')
            .set('Accept', 'application/json')
            .field('version', '0.1')
            .field('platform', 'ios')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res){
                if (err) throw err;
                expect(res.body.code).to.equal("0")
                expect(res.body.result).to.have.property("url")
                expect(res.body.result).to.have.property("describe")
                expect(res.body.result).to.have.property("version")
                expect(res.body.result).to.have.property("name")
                expect(res.body.result).to.have.property("skip")
                done()
            });
    });

    it('get the assets list', function (done) {
        api.post('/api/assets/list')
            .set('Accept', 'application/json') 
            .field('version', '0')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if(err) throw err;
                // console.log(util.inspect(res.body,false, null))
                expect(res.body.code).to.equal('0')
                expect(res.body.result).to.have.property('version')
                expect(res.body.result).to.have.property('data')
                expect(res.body.result.data).to.be.a('array')
                expect(res.body.result.data).to.have.length.above(1)
                done()
            })
    });

    it('get asset price by CNY', function (done) {
        api.post("/api/assets/price")
            .set('Accept', 'application/json')
            .field('currency', "CNY")
            .expect(200)
            .expect('Content-Type',/json/)
            .end(function (err, res) {
                if(err)throw err
                // console.log(util.inspect(res.body,false, null))
                expect(res.body.result.data).to.have.deep.any.keys('BTC','ETH')
                done()
            })
    });


    it('get assets balance', function (done) {
        addr = "0x296291777dffBffC19af45843af43C49C6f06073"
        list = ["0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"]
        api.post("/api/assets/balance")
            .set("Accept","application/json")
            .field("address",addr)
            .field("contractList",list)
            .expect(200)
            .expect("Content-Type", /json/)
            .end(function (err, res) {
                if (err) throw err
                // console.log(util.inspect(res.body,false, null))
                expect(res.body.result.data).to.containSubset([{"contractAddress": "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"}])
                res.body.result.data.should.all.have.property('balance')
                expect(res.body.result.data).have.length.above(1)
                done()
            })
    })



    it('search the  ETH assets', function (done) {
        api.post('/api/assets/search')
            .set('Accept', 'application/json') 
            .field('key', 'REAL')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if(err) throw err;
                // console.log(util.inspect(res.body,false, null))
                expect(res.body.code).to.equal('0')
                expect(res.body.result).to.containSubset([{symbol: "REAL", decimal: 18}])
                done()
            })
    });

    it('search asset with contract address', function (done) {
        addr = "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"
        api.post('/api/assets/search')
            .set('Accept', 'application/json')
            .field('key', addr)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err
                }
                // console.log(util.inspect(res.body,false,null))
                expect(res.body.code).to.equal('0')
                expect(res.body.result).to.containSubset([{symbol:'DGD', address:addr}])
                done()
            })
    })

    it('create new remark', function (done) {
        txid = '0xe35ce661adad7579c92607271cedbd967cc851fc935ccc3567a18e264ac294bd'
        from = '0xaa3188a2c4348bf2f660f2aafae6090ee77d38b7'
        to = '0xb67817b3f5b1a1b7ff90b827aa4e708621ad1456'
        value = '315000000000000000'
        contractAddress = '0x0000000000000000000000000000000000000000'
        gasLimit = '21000'
        gasPrice = '20000000000'
        secKey = "g31Xds^aBNK%TGmo"
        checksum = crypto.createHash('md5').update(txid+from+to+value+secKey).digest('hex')

        api.post('/api/tx/remark')
            .set('Accept', "application/json")
            .field('txid', txid)
            .field('remark', "hello,world")
            .field('from',from)
            .field('to', to)
            .field('value', value)
            .field('gasLimit', gasLimit)
            .field('gasPrice', gasPrice)
            .field('checksum', checksum)
            .field('contractAddress', contractAddress)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) throw err
                // console.log(util.inspect(res.body,false,null))
                expect(res.body.code).to.equal('0')
                done()
            })
    })

    
    it('query transaction detail information', function (done) {
        txid = '0xe35ce661adad7579c92607271cedbd967cc851fc935ccc3567a18e264ac294bd'
        
        api.post('/api/tx/query')
            .set('Accept', 'application/json')
            .field('txid', txid)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) throw err
                // console.log(util.inspect(res.body,false,null))
                expect(res.body.result).to.contains.keys('txid','remark','from','to','status')
                done()
            })
    })

    it('query transaction list for address', function (done) {
        addr = "0xaa3188a2c4348bf2f660f2aafae6090ee77d38b7"

        api.post('/api/tx/list')
            .set('Accept', 'application/json')
            .field('address', addr)
            .expect(200)
            .expect('Content-type', /json/)
            .end(function (err, res) {
                if (err) throw err
                // console.log(util.inspect(res.body,false,null))
                res.body.result.data.should.all.contains.keys('txid','from','to','value','contractAddress','contractName','status')
                done()
            })
    })

    it('get messages list', function (done) {
        addr = "0x758349578347"

        api.post('/api/misc/messages')
            .set('Accept', 'application/json')
            .field('address', addr)
            .field('language', 1)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) throw err
                // console.log(util.inspect(res.body,false,null))
                expect(res.body.code).to.equal('0')
                expect(res.body.result).to.all.contains.keys('title','content','timestamp','type','params')
                done()
            })
    })

    it('upload jpush tag', function (done) {
        addr = "0xaa3188a2c4348bf2f660f2aafae6090ee77d38b7"
        tag = "abc"
        secKey = "g31Xds^aBNK%TGmo"
        checksum = crypto.createHash('md5').update(addr+tag+secKey).digest('hex')
        // console.log(checksum)

        api.post('/api/wallet/add')
            .set("Accept", 'application/json')
            .field('address', addr)
            .field('tag', tag)
            .field('checksum', checksum)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) throw err
                console.log(util.inspect(res.body,false,null))
                expect(res.body.code).to.equal('0')
                done()
            })
    })
});
