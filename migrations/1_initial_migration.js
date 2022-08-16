var Migrations = artifacts.require('./Migrations.sol')
//var ERC2000 = artifacts.require('ERC2000.sol')
module.exports = function (deployer) {
    deployer.deploy(Migrations)
    //deployer.deploy(ERC2000)
}
