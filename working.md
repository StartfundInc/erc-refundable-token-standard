---
eip: 5528
title: Refundable Fungible Tokens
description: Allows refunds for EIP-20 tokens from escrow smart contract
author: StartfundInc (@StartfundInc)
discussions-to: https://ethereum-magicians.org/t/eip-5528-refundable-token-standard/10494
status: Draft
type: Standards Track
category: ERC
created: 2022-08-16
requires: 20
---

## Abstract

This standard is an extension of [EIP-20](./eip-20.md). This specification provides a type of escrow service in the blockchain ecosystem, which includes the following capabilities.
- The seller issues tokens.
- The seller creates an escrow smart contract with detailed escrow information. The information could include seller token contract address, buyer token contract address,  lock period, exchange rate, the maximum number of buyers, minimum balance of buyers and, etc.
- The seller funds seller tokens to the escrow contract.
- Buyers fund buyer tokens which are pre-defined in the escrow contract.
- When the escrow status meets success, the seller can withdraw buyer tokens and buyers can withdraw seller tokens based on exchange rates.
- Buyers can withdraw(or refund) their funded token if the escrow process is failed or is in the middle of the escrow process.

## Motivation

Due to the nature of cryptocurrencies that guarantee anonymity, there is no way to get it back to the cryptocurrency that has already been payed.
To solve this problem, the Escrow service exists in the real world.  However, it is difficult to implement an escrow service coordinated by a third-party arbitrator in a decentralized cryptocurrency ecosystem.  To solve this, we designed a smart contract that acts as an escrow and devised a function where each token is sent back to the original wallet if the escrow is not completed. Escrow smart contract service holds the `ERC20` tokens until a particular condition has been met for the seller and buyers. By the `ERC5528` standard, smart contract developers can define a wide range of rules to make the deals more successful.


## Specification

There are two type of contracts for the escrow process:
- `Payable Contract`: The sellers and buyers use this token to fund into the `Escrow Contract`.
- `Escrow Contract`: Defines the escrow policies and hold `Payable Contract`'s token for certain period.

This standard proposes interfaces on top of the [EIP-20](./eip-20.md) standard.

### Methods

**NOTES**:
  - The following specifications use syntax from Solidity `0.4.17` (or above)
#### constructor
The `Escrow Contract` may defines followings policies:
- MUST include seller token contract address
- MUST include buyer token contract address
- Lock period
- Maximum (or minimum) number of investors
- Maximum (or minimum) number of tokens to fund
- Exchange rates of seller/buyer token
- KYC verification of users

#### escrowFund
Funds `_value` amount of tokens to address `_to`.
In the case of `Escrow Contract`,
 - `_to` MUST be user address.
 - `msg.sender` MUST be the payable contract address.
 - MUST check policies validations.
In the case of `Payable Contract`,
  - The address `_to` MUST be the escrow contract address.
  - MUST call ERC20's `_transfer` like function.
  - Before call `_transfer` function, MUST call the same function of the escrow contract interface. The parameter `_to` MUST be `msg.sender` to recognize user address in the escrow contract.
``` js
function escrowFund(address _to, uint256 _value) public returns (bool)
```


#### escrowRefund
Refunds `_value` amount of tokens from address `_from`.
In the case of `Escrow Contract`,
 - `_from` MUST be user address.
 - `msg.sender` MUST be the payable contract address.
 - MUST check policies validations.
In the case of `Payable Contract`,
  - The address `_from` MUST be the escrow contract address.
  - MUST call ERC20's `_transfer` like function.
  - Before call `_transfer` function, MUST call the same function of the escrow contract interface. The parameter `_from` MUST be `msg.sender` to recognize user address in the escrow contract.
``` js
function escrowRefund(address _from, uint256 _value) public returns (bool)
```


#### escrowWithdraw
Withdraws funds from escrow account.
In the case of `Escrow Contract`,
 - MUST check the escrow process is successfully completed.
 - MUST send remaining balance of seller and buyer tokens to `msg.sender`'s seller and buyer contract wallets.
In the case of `Payable Contract`, it is optional.
``` js
function escrowWithdraw() public returns (bool)
```

### Example of interface

```solidity
pragma solidity ^0.4.20;

interface ERC5528 is ERC20 {

    function escrowFund(address _to, uint256 _value) public returns (bool);

    function escrowRefund(address to, uint256 amount) public returns (bool);

    function escrowWithdraw() public returns (bool);

}

```

## Rationale

[Current]


[examle of 3135]
This EIP targets on ERC-20 tokens due to its widespread adoption. However, this extension is designed to be compatible with other token standard.

The reason we chose to implement those functions in token contract rather than a separate record contract is as follows:
- Token can transfer is more convenient and more general than interact with DApp
- Token is more standardized and has better UI support
- Token is equal to service, make token economy more prosperous


## Backwards Compatibility

This EIP is fully backward compatible with the [EIP-20](./eip-20.md) specification.

## Test Cases

1. [Seller/Buyer Token example](../assets/eip-5528/ERC20Mockup.sol).
2. [Escrow contract example](../assets/eip-5528/EscrowContractAccount.sol).
3. [Unit test example with truffle](../assets/eip-5528/truffule-test.js).

The above 3 files demonstrate the following conditions for exchanging seller/buyer tokens.
- The exchange rate is one to one.
- If the number of buyers reaches 2, the escrow process will be terminated(success).
- Otherwise(not meet success condition yet), buyers can refund(or withdraw) their funded tokens.

## Security Considerations

Since the external contract(Escrow Contract) will control seller or buyer rights, flaws within the escrow contract directly lead to the standard’s unexpected behavior.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
