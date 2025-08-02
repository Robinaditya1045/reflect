// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TopG {
    // Replacing enum Choice
    uint8 constant CHOICE_NONE = 0;
    uint8 constant CHOICE_GRAB = 1;
    uint8 constant CHOICE_SHARE = 2;

    uint constant wei_to_eth = 1000000000000000000;

    // Replacing enum Outcome
    uint8 constant OUTCOME_PENDING = 0;
    uint8 constant OUTCOME_GG = 1;
    uint8 constant OUTCOME_SS = 2;
    uint8 constant OUTCOME_P1G = 3;
    uint8 constant OUTCOME_P2G = 4;

    struct Match {
        address p1;
        address p2;
        uint8 choice1;
        uint8 choice2;
        uint8 outcome;
    }

    struct Bets {
        uint option1;
        uint option2;
        uint option3;
        uint option4;
    }

    Match[] public matches;
    
    uint public current_match_id = 0;
    uint total1 = 0;
    uint total2 = 0;
    uint total3 = 0;
    uint total4 = 0;

    uint check = 0;
    address public player1;
    address public player2;
    bool full = false;
    function register() payable public{
        require(check<2, "Event full");
        // require(msg.value==50000000000000000, "More stake required");
        if(check==0) player1 = msg.sender;
        else player2 = msg.sender;
        check++;
        if(check==2){
            full = true;
            create_match(player1,player2);
        }
    }

    mapping(uint => mapping(address => Bets)) public match_to_stakers;
    mapping(uint => address[]) public match_to_stakers_list;

    function create_match(address p1, address p2) public {
        
        current_match_id++;
        matches.push(Match(p1, p2, CHOICE_NONE, CHOICE_NONE, OUTCOME_PENDING));
    }

    function update_choice1(uint8 choice_1) public {
        require(msg.sender == matches[current_match_id-1].p1, "You dont have permission");
        matches[current_match_id-1].choice1 = choice_1;
    }

    function update_choice2(uint8 choice_2) public {
        require(msg.sender == matches[current_match_id-1].p2, "You dont have permission");
        matches[current_match_id-1].choice2 = choice_2;
    }

    function bet(uint o1, uint o2, uint o3, uint o4) public payable {
        match_to_stakers_list[current_match_id-1].push(msg.sender);
        match_to_stakers[current_match_id-1][msg.sender] = Bets(o1, o2, o3, o4);
        total1 += o1;
        total2 += o2;
        total3 += o3;
        total4 += o4;
    }

    function result() public {
        uint8 res;
        if (matches[current_match_id-1].choice1 == CHOICE_GRAB && matches[current_match_id-1].choice2 == CHOICE_GRAB) {
            res = OUTCOME_GG;
        } else if (matches[current_match_id-1].choice1 == CHOICE_SHARE && matches[current_match_id-1].choice2 == CHOICE_SHARE) {
            res = OUTCOME_SS;
        } else if (matches[current_match_id-1].choice1 == CHOICE_GRAB && matches[current_match_id-1].choice2 == CHOICE_SHARE) {
            res = OUTCOME_P1G;
        } else if (matches[current_match_id-1].choice1 == CHOICE_SHARE && matches[current_match_id-1].choice2 == CHOICE_GRAB) {
            res = OUTCOME_P2G;
        }
        matches[current_match_id-1].outcome = res;
    }

    function distribute() public payable {
        if (matches[current_match_id-1].outcome == OUTCOME_GG) {
            uint sm = total2 + total3 + total4;
            for (uint i = 0; i < match_to_stakers_list[current_match_id-1].length; i++) {
                uint cur = (match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option1 * sm) / total1;
                cur+=match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option1;
                payable(match_to_stakers_list[current_match_id-1][i]).transfer(cur*wei_to_eth);
            }
        } else if (matches[current_match_id-1].outcome == OUTCOME_SS) {
            uint sm = (total1 + total3 + total4) / 2;
            for (uint i = 0; i < match_to_stakers_list[current_match_id-1].length; i++) {
                uint cur = (match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option2 * sm) / total2;
                cur += match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option2;
                payable(match_to_stakers_list[current_match_id-1][i]).transfer(cur*wei_to_eth);
            }
            payable(matches[current_match_id-1].p1).transfer(sm *wei_to_eth/ 2);
            payable(matches[current_match_id-1].p2).transfer(sm *wei_to_eth / 2);
        } else if (matches[current_match_id-1].outcome == OUTCOME_P1G) {
            uint sm = (total1 + total2 + total4) / 2;
            for (uint i = 0; i < match_to_stakers_list[current_match_id-1].length; i++) {
                uint cur = (match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option3 * sm) / total3;
                cur += match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option3;
                payable(match_to_stakers_list[current_match_id-1][i]).transfer(cur*wei_to_eth);
            }
            payable(matches[current_match_id-1].p1).transfer(sm*wei_to_eth);
        } else if (matches[current_match_id-1].outcome == OUTCOME_P2G) {
            uint sm = (total1 + total2 + total3) / 2;
            for (uint i = 0; i < match_to_stakers_list[current_match_id-1].length; i++) {
                uint cur = (match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option4 * sm) / total4;
                cur += match_to_stakers[current_match_id-1][match_to_stakers_list[current_match_id-1][i]].option4;
                payable(match_to_stakers_list[current_match_id-1][i]).transfer(cur*wei_to_eth);
            }
            payable(matches[current_match_id-1].p2).transfer(sm*wei_to_eth);
        }
        check = 0;
        full = false;
        total1 = 0;
        total2 = 0;
        total3 = 0;
        total4 = 0;

    }
}