// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SOracle is Ownable {
    // 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 - ETH/USD on ETH mainnet
    AggregatorV3Interface private priceFeed;

    event SetAggregator(address indexed aggregator);

    /**
     * @notice Function for update aggregator address.
     * @param _aggregator  address of new aggregator
     */
    function setAggregator(address _aggregator) external onlyOwner {
        priceFeed = AggregatorV3Interface(_aggregator);

        emit SetAggregator(_aggregator);
    }

    /**
     * @notice View function to get the latest ETH price.
     */
    function getLatestPrice() external view returns (int price) {
        (, price, , , ) = priceFeed.latestRoundData();
    }
}