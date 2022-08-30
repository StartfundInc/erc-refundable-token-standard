---
eip: 5528
title: Refundable Fungible Tokens
description: Allows refunds for EIP-20 tokens for a period of time
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
- The issuer issues tokens.
- The issuer creates an escrow smart contract with detailed escrow information. The information could include issuer token contract address, buyer token contract address,  lock period, exchange rate, the maximum number of buyers, minimum balance of buyers, etc.
- The issuer funds issuer tokens to the escrow contract.
- Buyers fund buyer tokens which are pre-defined in the escrow contract.
- When the escrow status meets success, the seller can withdraw buyer tokens and buyers can withdraw seller tokens based on exchange rates.
- Buyers can withdraw(or refund) their funded token if the escrow process is failed or is in the middle of the escrow process.

## Motivation

[TBD]: Should cover escrow & refundable
- Why escrow is requires
- Why refundable is requires


[OLD ONE]
Escrow service holds the money until a particular condition has been met for the seller and buyer.  By the `ERC5528` standard, smart contract developers can define a wide range of rules to make the deals more successful.

[example of 3135]
There are two main purposes of this EIP, one is to reduce interactions with blockchain, the second is to link Ethereum to real-world payment problems.

Many small businesses want to build payment system based on blockchain but find it difficult. There are basically two ways:

1. Directly pay with token. There are many wallet can receive and transfer token but transactions on Ethereum cost gas and take time to confirm.
2. User lock token on payment smart contract and service provider use payment messages signed by user to release token, establishing a micropayment channel. The advantage is interactions with blockchain is reduced and the signing/verifying process is off-chain. But interact with payment contract needs service provider to build a DApp, which require resources many small businesses do not have. Even if they managed to build DApps, they are all different, not standardized. Also, user should have a wallet with DApp browser and has to learn how to use it.

This EIP helps to standardize the interactions of micropayment system, and make it possible for wallet build a universal UI in the future.


## Specification


There are 3 contracts for the escrow process: `Buyer Contract`, `Seller Contract`, and `Escrow Contract`.
- Escrow Contract: Will be created by the seller. This contract should define the escrow policy and holds seller' tokens and buyer' tokens
- Buyer Contract: The buyer will pay buyer-tokens to the escrow contract to exchange with seller-tokens.
- Seller Contract: The seller will pay seller-tokens to the escrow contract to exchange with buyer-tokens.


This standard proposes interfaces on top of the [EIP-20](./eip-20.md) standard.

### Methods

**NOTES**:
  - The following specifications use syntax from Solidity `0.4.17` (or above)

#### constructor
The `Escrow Contract` may defines followings:
- MUST include seller token contract address
- MUST include buyer token contract address
- Lock period
- Maximum (or minimum) number of investors
- Maximum (or minimum) number of tokens to fund
- Exchange rates of seller/buyer token
- KYC verification of users

#### escrowFund

This function should run differently for buyers and sellers.

2.1 [Seller]
- The seller calls this function to be escrow-ready. The seller's token ownership(balance) will be transferred to the escrow contract and the escrow balance should be `(Seller: amount, Buyer: 0)`.
- The seller can call this function multiple times depending on implementation, but preferred just one time.

2.2 [Buyer]
- During the escrow process, the buyer should be able to call this function to deposit funds into the escrow account.
- The escrow balance should be  `(Seller: amount X exchange rate, Buyer: amount)`. The Buyer: the amount will be used for the refund process.
- In a successful scenario, the seller's escrow balance should be `(Seller: -= amount X exchange rate, Buyer: += amount)`.

#### escrowRefund

This function should be invoked by buyers only.
The buyer can call this function in the running state only. In the state of failure or success, could not be a success.
The escrow balances of seller and buyer will be updated reverse way of `escrowFund`


#### escrowWithdraw

Buyers and sellers can withdraw tokens from the escrow account to their account.
The following processes are recommended.
- Buyer can withdraw in escrow-success state only. Ownership of seller tokens can be transferred to the buyer from escrow-contract. In an escrow-failed state, the buyer should call the `escrowRefund` function.
- When the seller calls this function in the escrow-success state, the remaining seller token will be transferred to the seller, and the earned buyer's token will be also transferred from the escrow-account.
- In the case of escrow-failed, the seller only gets a refund seller token.


```solidity
pragma solidity ^0.4.20;



    /// @notice deposit fund(token) into escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - the seller can call this function to fund the initial supply.
    /// @param
    ///   - to:
    ///     In the case of a buyer/seller contract, it must be an escrow contract address.
    ///     In the case of an escrow contract, it must be the user address that triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is a success, otherwise is failure code.
    function escrowFund(address to, uint256 amount) public returns (uint32);


    /// @notice refund from escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - the seller should not call this function.
    /// @param
    ///   - to:
    ///     In case of a buyer/seller contract, must be an escrow contract address.
    ///     In case of an escrow contract, must be the user address who triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is a success, otherwise is failure code.
    function escrowRefund(address to, uint256 amount) public returns (uint32);

    /// @notice withdraw token from the escrow account.
    /// @dev
    ///   - must be implemented in Escrow-Contract and optional for other contracts.
    ///   - buyer is only available when escrow is successful, otherwise should call escrowRefund.
    ///   - in case the escrow fails, the seller can refund the seller-token.
    ///   - if the escrow is successful, the seller and buyers can get the exchanged tokens in their wallets.
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowWithdraw() public returns (uint32);

}

```

## Rationale

[TBD]

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
