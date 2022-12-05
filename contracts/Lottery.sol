// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Lottery__NotEnoughETHEntered();

contract Lottery is VRFConsumerBaseV2 {
    // State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_participants;

    // Events

    event RaffleEnter(address indexed participant);

    constructor(address vrfCoordinator, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        // if makes up for better gas opt than require
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughETHEntered();
        }

        s_participants.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function pickRandomWinner() external {}


    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {}

    // View / Pure Functions
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getParticipantByIndex(
        uint256 index
    ) public view returns (address) {
        return s_participants[index];
    }
}
