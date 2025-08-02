"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { joinAsPlayer, joinAsStaker } from '@/lib/actions/game.actions';
import { getUserByWalletAddress } from '@/lib/actions/user.actions';
import { ConnectModal } from './ui/ConnectModal';
import { ethers } from 'ethers';
import TopGAddress from '@contract_data/TopG-address.json';
import TopGAbi from '@contract_data/TopG.json';

interface GameCardProps {
  id: number;
  name: string;
  playerCount: number;
  stakerCount: number;
  joiningAmount: number;
  isPlayersFull: boolean;
  totalPool?: number;
  status?: string;
}

const GameCard: React.FC<GameCardProps> = ({
  id,
  name,
  playerCount,
  stakerCount,
  joiningAmount,
  isPlayersFull,
  totalPool = 0,
  status = 'PENDING',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinType, setJoinType] = useState<'player' | 'staker' | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasJoined, setHasJoined] = useState({
    asPlayer: false,
    asStaker: false
  });
  // Track UI state for counts that may change after user actions
  const [localPlayerCount, setLocalPlayerCount] = useState(playerCount);
  const [localStakerCount, setLocalStakerCount] = useState(stakerCount);
  const [localIsPlayersFull, setLocalIsPlayersFull] = useState(isPlayersFull || playerCount >= 2);
  const [localTotalPool, setLocalTotalPool] = useState(totalPool);
  
  const [TopG, setTopG] = useState<any>(null);
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contractInstance5 = new ethers.Contract(
          TopGAddress.address,
          TopGAbi.abi,
          signer
        );
        setTopG(contractInstance5);
      } else {
        alert('MetaMask not detected. Please install MetaMask.');
      }
    };

    init();
  }, []);

  // Check localStorage for wallet connection on component mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('walletAddress');
    const storedUsername = localStorage.getItem('username');
    const storedOnboarded = localStorage.getItem('isOnboarded') === 'true';
    
    if (storedWallet) {
      setWalletAddress(storedWallet);
      setUsername(storedUsername);
      setIsOnboarded(storedOnboarded);
      
      // Check if user has already joined this game
      checkJoinStatus(storedWallet);
    }
  }, [id]);
  
  // Check if user has already joined this game
  const checkJoinStatus = async (address: string) => {
    try {
      if (!address) return;
      
      const user = await getUserByWalletAddress(address);
      
      // Check if user is already a player in this game
      const isPlayer = user.playerGames.some((pg: any) => pg.gameId === id);
      
      // Check if user is already a staker in this game
      const isStaker = user.stakerGames.some((sg: any) => sg.gameId === id);
      
      setHasJoined({
        asPlayer: isPlayer,
        asStaker: isStaker
      });
    } catch (error) {
      console.error('Error checking join status:', error);
    }
  };

  const handleConnectSuccess = (address: string, uname: string | null, onboarded: boolean) => {
    setWalletAddress(address);
    setUsername(uname);
    setIsOnboarded(onboarded);
    
    // Store in localStorage for persistence
    localStorage.setItem('walletAddress', address);
    if (uname) localStorage.setItem('username', uname);
    localStorage.setItem('isOnboarded', onboarded.toString());
    
    // Check if user has already joined this game
    checkJoinStatus(address);
    
    // If user is onboarded, proceed with joining
    if (onboarded && joinType) {
      handleJoin(joinType);
    }
  };
  
  const initiateJoin = (type: 'player' | 'staker') => {
    setJoinType(type);
    setError(null);
    
    // If wallet is not connected, open modal
    if (!walletAddress || !isOnboarded) {
      setIsModalOpen(true);
      return;
    }
    
    // If wallet is connected and user is onboarded, proceed with joining
    handleJoin(type);
  };
  
  const handleJoin = async (type: 'player' | 'staker') => {
    if (!walletAddress || !isOnboarded) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      const user = await getUserByWalletAddress(walletAddress);
      
      if (type === 'player') {
        if (localIsPlayersFull) {
          setError('This game already has the maximum number of players');
          return;
        }
        
        if (hasJoined.asPlayer) {
          setError('You have already joined this game as a player');
          return;
        }
        
        // contract call
        const tx = await TopG.register();
        await tx.wait();
        await joinAsPlayer(id, user.id, joiningAmount);
        setHasJoined(prev => ({ ...prev, asPlayer: true }));
        
        // Update local state to reflect changes
        setLocalPlayerCount(prev => prev + 1);
        setLocalTotalPool(prev => prev + joiningAmount);
        
        // Check if player count has reached limit
        if (localPlayerCount + 1 >= 2) {
          setLocalIsPlayersFull(true);
        }
      } else {
        if (hasJoined.asStaker) {
          setError('You have already joined this game as a staker');
          return;
        }
        
        await joinAsStaker(id, user.id, joiningAmount);
        setHasJoined(prev => ({ ...prev, asStaker: true }));
        
        // Update local state
        setLocalStakerCount(prev => prev + 1);
        setLocalTotalPool(prev => prev + joiningAmount);
      }
    } catch (error: any) {
      console.error(`Error joining as ${type}:`, error);
      setError(error.message || `Failed to join as ${type}`);
    } finally {
      setIsJoining(false);
      setJoinType(null);
    }
  };
  
  return (
    <div className="bg-[#0d1117] shadow-lg rounded-md overflow-hidden border border-[#30363d] hover:border-[#6e7681] transition-all duration-200">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={cn(
              "h-4 w-4 rounded-full mr-2",
              status === 'PENDING' ? "bg-[#238636]" : 
              status === 'IN_PROGRESS' ? "bg-[#f0883e]" : 
              "bg-[#8b949e]"
            )}></div>
            <h2 className="text-xl font-semibold text-white">{name}</h2>
          </div>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            status === 'PENDING' ? "bg-[#238636] text-white" : 
            status === 'IN_PROGRESS' ? "bg-[#f0883e] text-white" : 
            "bg-[#21262d] text-[#8b949e]"
          )}>
            {status === 'PENDING' ? 'Open' : 
             status === 'IN_PROGRESS' ? 'In Progress' : 
             'Completed'}
          </span>
        </div>
        
        {error && (
          <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-3">
            {error}
          </div>
        )}
        
        <div className="space-y-3 mb-4 bg-[#161b22] p-3 rounded-md border border-[#30363d]">
          <div className="flex justify-between">
            <span className="text-sm text-[#8b949e]">Players:</span>
            <span className="text-sm font-medium text-white bg-[#1f6feb] px-2 py-0.5 rounded-full">{localPlayerCount}/2</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-[#8b949e]">Stakers:</span>
            <span className="text-sm font-medium text-white bg-[#238636] px-2 py-0.5 rounded-full">{localStakerCount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-[#8b949e]">Joining Amount:</span>
            <span className="text-sm font-medium text-white bg-[#6e40c9] px-2 py-0.5 rounded-full">{joiningAmount} ETH</span>
          </div>
          
          {localTotalPool > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-[#8b949e]">Total Pool:</span>
              <span className="text-sm font-medium text-white bg-[#f0883e] px-2 py-0.5 rounded-full">{localTotalPool.toFixed(3)} ETH</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Link 
            href={`/game/${id}`}
            className="flex-1 py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#6e7681] text-white text-center font-medium rounded-md transition duration-200 ease-in-out"
          >
            View Game
          </Link>
          
          {status === 'PENDING' && (
            <button 
              onClick={() => initiateJoin('staker')}
              disabled={isJoining || hasJoined.asStaker}
              className={cn(
                "flex-1 py-2 px-4 text-center font-medium rounded-md transition duration-200 ease-in-out border",
                hasJoined.asStaker
                  ? "bg-[#21262d] border-[#30363d] text-[#8b949e] cursor-not-allowed opacity-70"
                  : "bg-[#238636] hover:bg-[#2ea043] border-[#238636] text-white"
              )}
            >
              {isJoining && joinType === 'staker' 
                ? 'Joining...' 
                : hasJoined.asStaker 
                  ? 'Already Staking' 
                  : 'Join as Staker'}
            </button>
          )}
        </div>
        
        {status === 'PENDING' ? (
          <button 
            onClick={() => !localIsPlayersFull && initiateJoin('player')}
            disabled={isJoining || localIsPlayersFull || hasJoined.asPlayer}
            className={cn(
              "block w-full mt-2 py-2 px-4 text-center font-medium rounded-md transition duration-200 ease-in-out border",
              localIsPlayersFull 
                ? "bg-[#21262d] border-[#30363d] text-[#8b949e] cursor-not-allowed opacity-70" 
                : hasJoined.asPlayer
                  ? "bg-[#21262d] border-[#30363d] text-[#8b949e] cursor-not-allowed opacity-70"
                  : "bg-[#1f6feb] hover:bg-[#388bfd] border-[#1f6feb] text-white"
            )}
          >
            {isJoining && joinType === 'player' 
              ? 'Joining...' 
              : localIsPlayersFull 
                ? 'Players Full' 
                : hasJoined.asPlayer 
                  ? 'Already Joined' 
                  : 'Join as Player'}
          </button>
        ) : (
          <div className="mt-2 py-2 px-4 text-center font-medium rounded-md bg-[#21262d] border border-[#30363d] text-[#8b949e]">
            {status === 'IN_PROGRESS' ? 'Game in Progress' : 'Game Completed'}
          </div>
        )}
      </div>
      
      {/* Connect Modal */}
      <ConnectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConnect={handleConnectSuccess} 
      />
    </div>
  );
};

export default GameCard;
