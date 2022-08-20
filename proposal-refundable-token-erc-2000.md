---
eip: 5503
title: Refundable Token Standard
author: <admin@startfund.io>
discussions-to: https://ethereum-magicians.org/t/eip-5409-non-fungible-token-extension-for-eip-1155/10240
status: Draft
type: Standards Track
category: ERC
created: 2022-08-16
---

## Abstract

This standard is an extension of [EIP-20](./eip-20.md). This specification provides a type of escrow service in the block chain ecosystem, which includes the following capabilities.
- The issuer issues tokens.
- The issuer creates an escrow smart contract with detailed escrow information. The information could include issuer token contract address, buyer token contract address,  lock period, exchange rate, maximum number of buyers, minimum balance of buyer and etc.
- The issuer funds issuer tokens to the escrow contract.
- Buyers fund buyer tokens which is pre-defined in escrow contract.
- When the escrow status meets success, the seller can withdraw buyer tokens and buyers can withdraw seller tokens based on exchange rates.
- Buyers can withdraw(or refund) their funded token if the escrow process is failed or in the middle of the escrow process.


## Motivation

In the token issuing process, the issuer can receive money from buyers(or investors) and transfer issuing tokens to buyers. If the offering process is completed, there is no issue. But buyers can change their plan or the offering does not meet success condition (or be canceled) because of misfitting the compliance rules or other rules. There is no guarantee to pay back (refund) to the buyer in the on-chain network.



## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

There are 3 contracts for the escrow process: `Buyer Contract`, `Seller Contract` and `Escrow Contract`.
 - Buyer Contract: Buyers will pay to an escrow account to exchange with `Seller Token`.
 - Seller Contract: The seller will pay to the escrow account to exchange with `Buyer Token`.
 - Escrow Contract: Will be created by the seller. The contract source code allows users(seller and buyers) based on constraint rules. Instead of a simple address mapped balance variable in ERC20 tokens, the user’s balance should be [Seller Token, Buyer Token].

**Every ERC-5503 compliant contract must implement the `ERC5503` interfaces**
```solidity
pragma solidity ^0.4.20;


interface ERC5503 {

    /// @notice escrow balance of owner
    /// @dev assigned to the zero address are considered invalid, and this
    ///   function throws for queries about the zero address.
    /// @param
    ///   - _owner: An address for whom to query the balance
    /// @return amount of current escrow account balance.
    ///   - in case of escrow contract, it can be seller's token or buyer's token for backward compatibility with ERC20 standard.
    ///   - in case of seller/buyer contract, same as other ERC20 standard.
    function balanceOf(address account) public view returns (uint256);


    /// @notice escrow balance of owner
    /// @dev assigned to the zero address are considered invalid, and this
    ///   function throws for queries about the zero address.
    /// @param
    ///   - _owner: An address for whom to query the balance
    /// @return amount of current escrow account balance. First is buyer token , and seconds is seller token
    function escrowBalanceOf(address account) public view returns (uint256, uint256);


    /// @notice simple query to return simple description of compliance.
    /// @dev must be implemented in Escrow-Contract and optional for other contracts.
    function escrowComplianceDescription() external view returns (string);

    /// simple query to return string based on error code. if code is zero, return can be 'success'
    /// @dev must be implemented in Escrow-Contract and optional for other contracts.
    function escrowErrorCodeDescription(uint32 _code) external view returns (string);


    /// @notice deposit fund(token) into escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - seller can call this function to fund initial supply.
    /// @param
    ///   - to:
    ///     In case of buyer/seller contract, it must be an escrow contract address.
    ///     In case of escrow contract, it must be the user address who triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowFund(address to, uint256 amount) public returns (uint32);


    /// @notice refund from escrow account.
    /// @dev
    ///   - seller/buyer contract should call escrow contract's function before _transfer.
    ///   - escrow contract should update (Seller, Buyer) balance.
    ///   - the seller should not call this function.
    /// @param
    ///   - to:
    ///     In case of buyer/seller contract, must be an escrow contract address.
    ///     In case of escrow contract, must be the user address who triggered this transaction.
    ///   - _valuePayed: payable token amount
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowRefund(address to, uint256 amount) public returns (uint32);

    /// @notice withdraw token from escrow account.
    /// @dev
    ///   - must be implemented in Escrow-Contract and optional for other contracts.
    ///   - buyer is only available when escrow is successful, otherwise should call escrowRefund.
    ///   - in case the escrow fails, the seller can refund seller-token.
    ///   - if the escrow is successful, the seller and buyers can get the exchanged tokens on their own wallet.
    /// @return reason code. 0 is success, otherwise is failure code.
    function escrowWithdraw() public returns (uint32);

}


```

## Rationale

This standard proposes interfaces on top of the ERC-20 standard.
Each function should include constraint check logic.
The escrow-contract  should implement internal constraint logic such as period, maximum investors, etc.
The buyer-contract and seller-contract should not have constraint rules.

Let's discuss the following functions.

1. **constructor**

An escrow contract will define success/failure conditions. It means constraint rules might not be changed forever (might be changed after being created for the market exchange rate.), so it guarantees escrow policy.

2. **escrowFund**

This function should run differently for buyers and sellers.

2.1 [Seller]
- The seller calls this function to be escrow-ready. Seller's token ownership(balance) will be transferred to escrow-contract and the escrow balance will be (Seller: amount, Buyer: 0).
- The seller can call this function multiple times depending on implementation, but preferred just one time.

2.2 [Buyer]
- When escrow is running (not successful or failed), the buyer can call this function to deposit funds into the escrow account.
- The escrow balance will be (Seller: amount x exchange-rate, Buyer: amount). The Buyer: the amount will be used for the refund process.
- Once it is a success, the seller's escrow balance will be (Seller: -= amount x exchange-rate, Buyer: += amount).

3. **escrowRefund**

This function should be invoked by buyers only.
The buyer can call this function in the running state only. In the state of failure or success, could not be a success.
The escrow balances of seller and buyer will be updated reverse way of `escrowFund`


4. **escrowWithdraw**

Buyers and sellers can withdraw tokens from the escrow account to their own account.
The following processes are recommended.
- Buyer can withdraw in escrow-success state only. Ownership of seller tokens can be transferred to the buyer from escrow-contract. In an escrow-failed state, the buyer should call the `escrowRefund` function.
- When the seller calls this function in the escrow-success state, the remaining seller token will be transferred to the seller, and the earned buyer's token will be also transferred from escrow-account.
- In the case of escrow-failed, the seller only gets a refund seller token.

## Backwards Compatibility
By design ERC-5503 is fully backward compatible with ERC-20.

## Test Cases
1. [Seller/Buyer Token example](../assets/eip-5503/ERC20Mockup.sol).
2. [Escrow contract example](../assets/eip-5503/EscrowContractAccount.sol).
3. [Unit test example with truffle](../assets/eip-5503/truffule-test.js).

The above 3 files demonstrate the following conditions to exchange seller / buyer tokens.
- exchange rate is 1:1
- If the number of buyers reaches 2, the escrow process will be terminated(success).
- Otherwise(not meet success condition yet), buyers can refund(or withdraw) their funded tokens.

## Security Considerations
Since the external contract(Escrow Contract) will control seller or buyer rights, flaws within the escrow contract directly lead to the standard’s unexpected behavior.

## Copyright
Copyright and related rights waived via [CC0](../LICENSE.md).
