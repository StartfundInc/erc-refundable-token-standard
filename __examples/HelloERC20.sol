pragma solidity ^0.4.24;
import "zeppelin-solidity/contracts/token/ERC20/BasicToken.sol";

contract HelloERC20 is BasicToken {
    constructor (address initialAccount, uint256 initialBalance) public {
        balances[initialAccount] = initialBalance;
        totalSupply_ = initialBalance;
    }
}
