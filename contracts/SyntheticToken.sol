// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SToken is Ownable, ERC20 {
    mapping(address => bool) public sPools;

    event UpdateSPool(address indexed sPool, bool flag);

    constructor(
        string memory name, 
        string memory symbol
    ) ERC20(name, symbol) {}

    modifier onlySPools {
        require(sPools[msg.sender], "Not allowed");
        _;
    }

    /**
     * @notice Function for manage SPools.
     * @param _sPool  address of synthetic pool
     * @param _flag  bool for synthetic pool
     * only admin can call this token
     */
    function setSPool(
        address _sPool,
        bool _flag
    ) external onlyOwner {
        sPools[_sPool] = _flag;

        emit UpdateSPool(_sPool, _flag);
    }

    /**
     * @notice Function for mint SToken to users.
     * @param amount  address of user which will receive token
     * @param amount  amount of SToken
     * only sPools can mint token
     */
    function mint(address to, uint256 amount) external onlySPools {
        _mint(to, amount);
    }

    /**
     * @notice Function for burn SToken from users.
     * @param amount  address of user which will burn token
     * @param amount  amount of SToken
     * only sPools can burn token
     */
    function burn(address from, uint256 amount) external onlySPools {
        _burn(from, amount);
    }
}
