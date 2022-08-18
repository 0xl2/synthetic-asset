// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISOracle {
    function getLatestPrice() external view returns(int);
}