// contracts/SimpleStorage.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 storedValue;

    function set(uint256 x) public {
        storedValue = x;
    }

    function get() public view returns (uint256) {
        return storedValue;
    }
}

