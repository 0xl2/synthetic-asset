const { expect } = require("chai");
const { ethers } = require("hardhat");

const BigNumber = ethers.BigNumber;

describe("SyntheticETH contract test", function () {
    before("Deploy contracts", async function () {
        const [owner, alice, bob] = await ethers.getSigners();

        this.owner = owner;
        this.alice = alice;
        this.bob = bob;

        const SToken = await ethers.getContractFactory("SToken");
        this.sToken = await SToken.deploy("SyntheticToken", "STN");
        await this.sToken.deployed();
        console.log(`SToken deployed to: ${this.sToken.address}`);

        const SOracle = await ethers.getContractFactory("SOracle");
        this.sOracle = await SOracle.deploy();
        await this.sOracle.deployed();
        console.log(`SOracle deployed to: ${this.sOracle.address}`);

        const SETH = await ethers.getContractFactory("SyntheticETH");
        this.sETH = await SETH.deploy(
            this.sToken.address,
            this.sOracle.address,
            10000
        );
        await this.sETH.deployed();
        console.log(`SETH deployed to: ${this.sETH.address}`);

        // set aggregator on oracle - ETH/USD aggregator on mainnet
        await this.sOracle.connect(owner).setAggregator("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419");

        // Adding sETH as sPool on sToken
        await this.sToken.connect(owner).setSPool(this.sETH.address, true);
    });

    describe("Test SOracle", function() {
        it("Updating aggregator can be done by onlyOwner", async function() {
            await expect(
                this.sOracle.connect(this.alice).setAggregator("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Receive latest ETH/USD price", async function() {
            const ethPrice = await this.sOracle.getLatestPrice();

            // ETH price is biggeer than 1800USD
            expect(Number(ethPrice)).to.gt(1800 * Math.pow(10, 8));
        });
    });

    describe("Test SToken", function() {
        it("SToken can be mint by only SPool", async function() {
            // even owner cant mint
            await expect(
                this.sToken.connect(this.owner).mint(
                    this.owner.address, 
                    ethers.utils.parseUnits("100")
                )
            ).to.be.revertedWith("Not allowed");
        });

        it("SToken can burn mint by only SPool", async function() {
            // even owner cant burn
            await expect(
                this.sToken.connect(this.owner).burn(
                    this.owner.address, 
                    ethers.utils.parseUnits("100")
                )
            ).to.be.revertedWith("Not allowed");
        });
    });

    describe("Test SETH", function() {
        it("Test SETH deposit for Alice & Bob", async function() {
            // testing deposit 1ETH for alice
            const aliceDeposit = ethers.utils.parseEther("1");

            await this.sETH.connect(this.alice).deposit({
                value: aliceDeposit
            });

            const aliceBalance = await this.sToken.balanceOf(this.alice.address);
            expect(aliceBalance).to.gt(0);

            const aliceInfo = await this.sETH.userInfo(this.alice.address);
            expect(aliceInfo).to.eq(aliceDeposit);

            // testing deposit 1ETH for bob
            const bobDeposit = ethers.utils.parseEther("1.5");

            await this.sETH.connect(this.bob).deposit({
                value: bobDeposit
            });

            const bobBalance = await this.sToken.balanceOf(this.bob.address);
            expect(bobBalance).to.gt(0);
            expect(BigNumber.from(bobBalance).gt(BigNumber.from(aliceBalance))).to.eq(true);

            const bobInfo = await this.sETH.userInfo(this.bob.address);
            expect(bobInfo).to.eq(bobDeposit);
        });

        it("Test SETH withdraw for Alice", async function() {
            const beforeAliceETH = await ethers.provider.getBalance(this.alice.address);
            const aliceBalance = await this.sToken.balanceOf(this.alice.address);
            const testBalance = ethers.utils.parseUnits("100000000");
            
            await expect(
                this.sETH.connect(this.alice).withdraw(testBalance)
            ).to.be.revertedWith("ERC20: burn amount exceeds balance");

            await this.sETH.connect(this.alice).withdraw(aliceBalance);

            const afterAliceETH = await ethers.provider.getBalance(this.alice.address);
            expect(BigNumber.from(afterAliceETH).gt(BigNumber.from(beforeAliceETH))).to.eq(true);

            const aliceInfo = await this.sETH.userInfo(this.alice.address);
            expect(aliceInfo).to.eq(0);
        });
        
        it("Test SETH withdraw for Bob", async function() {
            const beforeBobETH = await ethers.provider.getBalance(this.bob.address);
            const bobBalance = await this.sToken.balanceOf(this.bob.address);
            const testBalance = ethers.utils.parseUnits("100000000");
            
            await expect(
                this.sETH.connect(this.bob).withdraw(testBalance)
            ).to.be.revertedWith("ERC20: burn amount exceeds balance");

            await this.sETH.connect(this.bob).withdraw(bobBalance);

            const afterBobETH = await ethers.provider.getBalance(this.bob.address);
            expect(BigNumber.from(afterBobETH).gt(BigNumber.from(beforeBobETH))).to.eq(true);

            const bobInfo = await this.sETH.userInfo(this.bob.address);
            expect(bobInfo).to.eq(0);
        });
    });
});