---
eip: 2000
title: Refundable Token Standard
author: Jerry <jerry@startfund.io>, David <david@startfund.io>, Demi <demi@startfund.io>
type: Standards Track
category: ERC
status: Working
created: 2022-01-31
---

## Simple Summary

A standard interface for Refundable Token.

## Abstract

The value of security token can be total sum of linked currency’s value. For example, Token Issuing  process, issuer can receive money from  buyers( or investors) and transfers issuing token to buyers. If offering process is successfully completed, there is no issue. But buyers can change their plan, or offering is failed(or canceled) cause of mis-fitting the compliance rules or other rules. There is no way guarantee to payback(refund) to buyer in on-chain network.

We have suggest this process make possible in on-chain network with payable currency like token(ex: USDT)


## Motivation

A standard interface allows payable token contract to interact with ERC-2000 interface within smart contracts.

Any payable token contract call ERC-2000 interface to exchange with issuing token based on constraint built in ERC-2000 smart contract to validate transactions.

Note: Refund is only available in certain conditions(ex: period, oracle value etc) based on implementations.

## Requirements

Exchanging tokens, requires having an escrow like standard way in on-chain network.

The following stand interfaces should be provided on ERC-2000 interface.
  - MUST support querying texted based compliance for transactions. ex: period, max number of buyers, minimum and maximum tokens to hold, refund period, etc.
  - exchange(or purchase) with success or failed return code.
  - refund(or cancel transaction) with success or failed return code.
  - withdraw when escrow process has been success.


## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

There are 3 contracts for the escrow process: `Buyer Contract`, `Seller Contract` and `Escrow Contract`.
 - Buyer Contract: Buyers will pay to escrow account to exchange with `Seller Token`.
 - Seller Contract: The seller will pay to escrow account to exchange with `Buyer Token`.
 - Escrow Contract: Will be created by seller. Agent to co-operate between buyers and seller based on constraint rules. Instead of simple address mapped balance variable in ERC20 tokens, this balance should have (Seller, Buyer).

**Every ERC-2000 compliant contract must implement the `ERC2000` interfaces**

```solidity
pragma solidity ^0.4.20;

/// @title ERC-2000 Refundable Token Standard

interface ERC2000 {

    /// @notice escrow balance of owner
    /// @dev assigned to the zero address are considered invalid, and this
    ///   function throws for queries about the zero address.
    ///   in case of escrow contract,
    ///       recommend return buyer's token balance.
    ///       used for backward compatibility with ERC20 standard.
    /// @param
    ///   - _owner: An address for whom to query the balance
    /// @return amount of current escrow account balance. can be seller's token or buyer's token
    function balanceOf(address account) public view returns (uint256);


    /// @notice escrow balance of owner
    /// @dev assigned to the zero address are considered invalid, and this
    ///   function throws for queries about the zero address.
    /// @param
    ///   - _owner: An address for whom to query the balance
    /// @return amount of current escrow account balance. First is buyer token , and seconds is seller token
    function escrowBalanceOf(address account) public view returns (uint256, uint256);


    /// @notice simple query to return simple description of compliance.
    /// @dev must implemented in Escrow-Contract and optional for other contracts.
    function escrowComplianceDescription() external view returns (string);

    /// simple query to return string based on error code. if code is zero, return can be 'success'
    /// @dev must implemented in Escrow-Contract and optional for other contracts.
    function escrowErrorCodeDescription(uint32 _code) external view returns (string);


    /// @notice deposit fund(token) into escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - seller can call this function to fund initial supply.
    /// @param
    ///   - to:
    ///     In case of buyer/seller contract, must be escrow contract address.
    ///     In case of escrow contract, must be user address who is triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowFund(address to, uint256 amount) public returns (uint32);


    /// @notice refund from escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - seller should not call this function.
    /// @param
    ///   - to:
    ///     In case of buyer/seller contract, must be escrow contract address.
    ///     In case of escrow contract, must be user address who is triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowRefund(address to, uint256 amount) public returns (uint32);

    /// @notice withdraw token from escrow account.
    /// @dev
    ///   - must implemented in Escrow-Contract and optional for other contracts.
    ///   - buyer is only available when escrow is success, otherwise should call escrowRefund.
    ///   - in case of escrow failed, seller can refund seller-token.
    ///   - if escrow is success, seller and buyer can get exchanged token on their own wallet.
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowWithdraw() public returns (uint32);

}


```

## Rationale
The standard proposes interfaces on top of the ERC-20 standard.
Each functions should include constraint check logic.
In `escrow-contract`, should implemented internal constraint logic such as period, maximum investors, etc.
The `buyer-contract` and `seller-contract` should not have constraint rules.

Let's discuss following functions.

1. **`constructor`**

In escrow contract, will define success/failure conditions. It means constraint rules might not be changed for ever(might be changed after created for market exchange rate.), so it guarantee escrow policy.

2. **`escrowFund`**

This function should run differently for buyer and seller.

[seller]
- The seller call this function to be escrow-ready. Seller's token ownership(balance) will be transferred to escrow-contract and escrow balance will be (Seller: amount, Buyer: 0).
- The seller can call this function multiple times depends on implementation, but preferred just one time.

[buyer]
- When escrow is in running state(not success or failed), the buyer can call this function to deposit fund into escrow account.
- the escrow balance will be (Seller: amount x exchange-rate, Buyer: amount). The `Buyer: amount` will be used for refund process.
- Once it is success, the seller's escrow balance will be (Seller: -= amount x exchange-rate, Buyer: += amount).

3. **`escrowRefund`**

This function should be invoked by buyers only.
The buyer can call this function in running state only. In state of failed or success, could not be success.
The escrow balances of seller and buyer will be updated reverse way of `escrowFund`


4. **`escrowWithdraw`**

Buyers and seller can withdraw tokens from escrow account to their own account.
The following processes are recommended.
- Buyer can withdraw in escrow-success state only. Ownership of seller tokens can be transferred to buyer from escrow-contract. In escrow-failed state, buyer should call `escrowRefund` function.
- When the seller call this function in escrow-success state, remained seller token will be transferred to seller, and earned buyer's token will be also transferred from escrow-account.
- In case of escrow-failed, seller only get refund seller token.



## Backwards Compatibility

By design ERC-2000 is fully backwards compatible with ERC-20.


## Test Cases & Implementations

1. [Seller/Buyer Token example](https://github.com/StartfundInc/erc-refundable-token-standard/blob/main/contracts/examples/ERC20Mockup.sol)

2. [Escrow contract example](https://github.com/StartfundInc/erc-refundable-token-standard/blob/main/contracts/examples/ErcEscrowAccount.sol)

3. [Unit test example](https://github.com/StartfundInc/erc-refundable-token-standard/blob/main/test/escrow-test.js).

## Copyright

2022 Startfund Inc.
