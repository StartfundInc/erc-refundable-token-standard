---
eip: 5528
title: Refundable Fungible Tokens
description: Allows refunds for EIP-20 tokens by escrow smart contract
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
- The seller creates an escrow smart contract with detailed escrow information. The information could include seller token contract address, buyer token contract address,  lock period, exchange rate, the maximum number of buyers, minimum balance of buyers, additional escrow success conditions, etc.
- The seller funds seller tokens to the escrow contract.
- Buyers fund buyer tokens which are pre-defined in the escrow contract.
- When the escrow status meets success, the seller can withdraw buyer tokens, and buyers can withdraw seller tokens based on exchange rates.
- Buyers can withdraw(or refund) their funded token if the escrow process is failed or is in the middle of the escrow process.

## Motivation

Due to the nature of cryptocurrencies that guarantee anonymity, there is no way to get it back to the cryptocurrency that has already been paid.
To solve this problem, the Escrow service exists in the real world. However, it is challenging to implement an escrow service coordinated by a third-party arbitrator in a decentralized cryptocurrency ecosystem.  To solve this, we designed a smart contract that acts as an escrow and devised a function where each token is sent back to the original wallet if the escrow is not completed.

Escrow smart contract service should support refund `ERC20` tokens in the middle of the escrow process or when the operation fails.

## Specification

There are two types of contract for the escrow process:
- `Payable Contract`: The sellers and buyers use this token to fund the `Escrow Contract`.
- `Escrow Contract`: Defines the escrow policies and holds `Payable Contract`'s token for a certain period.

This standard proposes interfaces on top of the [EIP-20](./eip-20.md) standard.

### Methods

**NOTES**:
  - The following specifications use syntax from Solidity `0.4.17` (or above)
#### constructor
The `Escrow Contract` may define the following policies:
- MUST include seller token contract address
- MUST include buyer token contract address
- Escrow period
- Maximum (or minimum) number of investors
- Maximum (or minimum) number of tokens to fund
- Exchange rates of seller/buyer token
- KYC verification of users

#### escrowFund
Funds `_value` amount of tokens to address `_to`.
In the case of `Escrow Contract`,
 - `_to` MUST be the user address.
 - `msg.sender` MUST be the payable contract address.
 - MUST check policy validations.
In the case of `Payable Contract`,
  - The address `_to` MUST be the escrow contract address.
  - MUST call ERC20's `_transfer` likely function.
  - Before calling `_transfer` function, MUST call the same function of the escrow contract interface. The parameter `_to` MUST be `msg.sender` to recognize the user address in the escrow contract.
```
function escrowFund(address _to, uint256 _value) public returns (bool)
```

#### escrowRefund
Refunds `_value` amount of tokens from address `_from`.
In the case of `Escrow Contract`,
 - `_from` MUST be the user address.
 - `msg.sender` MUST be the payable contract address.
 - MUST check policy validations.
In the case of `Payable Contract`,
  - The address `_from` MUST be the escrow contract address.
  - MUST call ERC20's `_transfer` likely function.
  - Before calling `_transfer` function, MUST call the same function of the escrow contract interface. The parameter `_from` MUST be `msg.sender` to recognize the user address in the escrow contract.
```
function escrowRefund(address _from, uint256 _value) public returns (bool)
```

#### escrowWithdraw
Withdraws funds from the escrow account.
In the case of `Escrow Contract`,
 - MUST check the escrow process is completed.
 - MUST send the remaining balance of seller and buyer tokens to `msg.sender`'s seller and buyer contract wallets.
In the case of `Payable Contract`, it is optional.
```
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

The interfaces described in this ERC have been chosen to cover the refundable issue in the escrow operation.

The suggested 3 functions (`escrowFund`, `escrowRefund` and `escrowWithdraw`) are based on `transfer` function in `ERC20`.

`escrowFund` send tokens to the escrow contract. The escrow contract can hold the contract in the escrow process or reject tokens if the policy does not meet.

`escrowRefund` can be invoked in the middle of the escrow process or when the escrow process is failed.

`escrowWithdraw` allows users (sellers and buyers) to transfer tokens from the escrow account. When the escrow process is completed, the seller can get the buyer's token and the buyers can get the seller's token.

## Backwards Compatibility

This EIP is fully backward compatible with the [EIP-20](./eip-20.md) specification.

## Test Cases

1. [Seller/Buyer Token example](../assets/eip-5528/ERC20Mockup.sol).
2. [Escrow contract example](../assets/eip-5528/EscrowContractAccount.sol).
3. [Unit test example with truffle](../assets/eip-5528/truffule-test.js).

The above three files demonstrate the following conditions for exchanging seller/buyer tokens.
- The exchange rate is one-to-one.
- If the number of buyers reaches 2, the escrow process will be terminated(success).
- Otherwise(not meeting success condition yet), buyers can refund(or withdraw) their funded tokens.

## Security Considerations

Since the external contract(Escrow Contract) will control seller or buyer rights, flaws within the escrow contract directly lead to the standard’s unexpected behavior.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
