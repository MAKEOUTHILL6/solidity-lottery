// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

error Lottery__NotEnoughETHEntered();

contract Lottery {
    // State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_participants;

    // Events 

    event RaffleEnter(address indexed participant);

    constructor(uint256 entranceFee) {
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

    // function pickRandomWinner() {}


    // View / Pure Functions
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getParticipantByIndex(uint256 index) public view returns(address){
        return s_participants[index];
    }
}
