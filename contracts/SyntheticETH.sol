// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interface/ISToken.sol";
import "./interface/ISOracle.sol";

contract SyntheticETH is Ownable, ReentrancyGuard {
    ISToken public sToken;
    ISOracle public sOracle;

    uint256 public rateIndex;

    mapping(address => uint256) public userInfo;

    event NewDeposit(address indexed user, uint256 amount);
    event UpdateRate(uint256 previousRate, uint256 newRate);
    event UpdateSetting(address indexed sToken, address indexed sOracle);
    event Deposit(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event Withdraw(address indexed user, uint256 ethAmount, uint256 tokenAmount);

    constructor(
        address _sToken, 
        address _sOracle, 
        uint256 _rateIndex
    ) {
        sToken = ISToken(_sToken);
        sOracle = ISOracle(_sOracle);

        rateIndex = _rateIndex;
    }

    /**
     * @notice Function for update rate index.
     * @param _rateIndex  uint of new rate index
     */
    function setRate(uint256 _rateIndex) external onlyOwner {
        emit UpdateRate(rateIndex, _rateIndex);

        rateIndex = _rateIndex;
    }

    /**
     * @notice Function for update setting addresses.
     * @param _sToken  address of synthetic token
     * @param _sOracle  address of synthetic oracle
     */
    function updateSetting(address _sToken, address _sOracle) external onlyOwner {
        sToken = ISToken(_sToken);
        sOracle = ISOracle(_sOracle);

        emit UpdateSetting(_sToken, _sOracle);
    }

    /**
     * @notice Function to get the SToken mint amount from deposit ETH.
     * @param _eth  amount of ETH deposited
     */
    function getMintAmount(uint256 _eth) private view returns(uint256 _mint) {
        int ethPrice = sOracle.getLatestPrice();
        require(ethPrice > 0, "Price is too low");

        unchecked {
            _mint = uint256(ethPrice) * _eth * rateIndex / 1e12;
        }
    }

    /**
     * @notice Function to get the withdrawable ETH amount from SToken amount.
     * @param _token  amount of SToken
     */
    function getWithdrawAmount(uint256 _token) private view returns(uint256 _eth) {
        int ethPrice = sOracle.getLatestPrice();
        require(ethPrice > 0, "Price is too low");

        unchecked {
            _eth = _token * 1e12 / rateIndex / uint256(ethPrice);
        }
    }

    /**
     * @notice Function to deposit ETH and receive SToken.
     */
    function deposit() public payable nonReentrant {
        require(msg.value > 0, "Invalid amount");

        if(userInfo[msg.sender] == 0) {
            emit NewDeposit(msg.sender, msg.value);
        }

        userInfo[msg.sender] += msg.value;

        // mint SToken
        uint amount = getMintAmount(msg.value);
        sToken.mint(msg.sender, amount);

        emit Deposit(msg.sender, msg.value, amount);
    }

    /**
     * @notice Function for withdraw request.
     * @param amount  amount of SToken
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        
        uint256 withdrawAmount = getWithdrawAmount(amount);
        if(withdrawAmount > userInfo[msg.sender]) withdrawAmount = userInfo[msg.sender];

        userInfo[msg.sender] -= withdrawAmount;

        sToken.burn(msg.sender, amount);

        payable(msg.sender).transfer(withdrawAmount);

        emit Withdraw(msg.sender, withdrawAmount, amount);
    }

    receive() external payable {
        deposit();
    }
}
