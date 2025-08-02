"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getPlayersByGameId } from "@/lib/actions/game.actions";
import { getUserByWalletAddress } from "@/lib/actions/user.actions";
import { ConnectModal } from "@/components/ui/ConnectModal";
import TopGAddress from "@/contract_data/TopG-address.json";
import TopGAbi from "@/contract_data/TopG.json";

interface PageProps {
    params: { id: string }
}

interface PlayerData {
    id: string;
    userId: string;
    gameId: number;
    action: string;
    joiningAmount: number;
    user: {
        id: string;
        username: string | null;
        walletAddress: string;
    };
}

export default function Page({ params }: PageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [playerChoice, setPlayerChoice] = useState<number | null>(null);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [playerIndex, setPlayerIndex] = useState<number | null>(null); // 0 for player1, 1 for player2


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

    // Fetch players data from the database using server action
    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                setLoading(true);
                // Get game ID from params
                const gameId = parseInt(params.id);
                
                // Call the server action to get players
                const playersData = await getPlayersByGameId(gameId);
                setPlayers(playersData);
            } catch (err) {
                console.error("Error fetching players:", err);
                setError("Failed to load player data");
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, [params.id]);
    
    // Check for wallet connection on component mount
    useEffect(() => {
        const storedWallet = localStorage.getItem('walletAddress');
        const storedOnboarded = localStorage.getItem('isOnboarded') === 'true';
        
        if (storedWallet) {
            setWalletAddress(storedWallet);
            setIsOnboarded(storedOnboarded);
        }
    }, []);

    // Determine if the current user is a player in this game
    useEffect(() => {
        if (walletAddress && players.length > 0) {
            // Check if current wallet address matches player1 or player2
            const playerIndex = players.findIndex(p => 
                p.user?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
            );
            
            if (playerIndex !== -1) {
                setIsCurrentPlayer(true);
                setPlayerIndex(playerIndex);
            } else {
                setIsCurrentPlayer(false);
                setPlayerIndex(null);
            }
        }
    }, [walletAddress, players]);

    const handleConnectSuccess = (address: string, username: string | null, onboarded: boolean) => {
        setWalletAddress(address);
        setIsOnboarded(onboarded);
        
        // Store in localStorage for persistence
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('isOnboarded', onboarded.toString());
        if (username) localStorage.setItem('username', username);
    };

    const initiateConnectWallet = () => {
        setIsModalOpen(true);
    };

    // Handle making a choice (Grab or Share)
    const handleMakeChoice = async (choice: number) => {
        if (!walletAddress) {
            initiateConnectWallet();
            return;
        }
        
        if (!isCurrentPlayer) {
            setError("You are not a player in this game");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            setPlayerChoice(choice);
            
            // Get provider and signer
            
            // Call the appropriate function based on player index (0 = player1, 1 = player2)
            let tx;
            if (playerIndex === 0) {
                tx = await TopG.update_choice1(choice);
            } else {
                tx = await TopG.update_choice2(choice);
            }
            
            // Wait for transaction to be mined
            await tx.wait();
            
            console.log("Choice submitted successfully!");
        } catch (err: any) {
            console.error("Error making choice:", err);
            setError(err.message || "Failed to submit choice");
            setPlayerChoice(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1f6feb]"></div>
            </div>
        );
    }

    if (error && !isSubmitting) {
        return (
            <div className="container mx-auto p-8">
                <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-5 rounded-md">
                    <h3 className="text-lg font-semibold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Get player names with fallbacks
    const player1Name = players[0]?.user?.username || "Player 1";
    const player2Name = players[1]?.user?.username || "Player 2";

    return (
        <div className="container mx-auto p-8">
            <div className="max-w-3xl mx-auto bg-[#0d1117] shadow-lg rounded-md overflow-hidden border border-[#30363d] p-6">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Make Your Choice</h1>
                
                {!isCurrentPlayer && (
                    <div className="bg-[#21262d] border border-[#30363d] text-white p-5 rounded-md mb-6 text-center">
                        <p className="mb-4">You are not a player in this game.</p>
                        <button 
                            onClick={initiateConnectWallet}
                            className="py-2 px-6 bg-[#1f6feb] hover:bg-[#388bfd] text-white font-medium rounded-md transition duration-200 ease-in-out"
                        >
                            Connect Wallet
                        </button>
                    </div>
                )}

                {isCurrentPlayer && (
                    <>
                        <div className="text-center mb-8">
                            <p className="text-lg text-white mb-2">
                                You are playing as <span className="font-bold">{playerIndex === 0 ? player1Name : player2Name}</span>
                            </p>
                            <p className="text-[#8b949e]">
                                {playerChoice 
                                    ? `You chose ${playerChoice === 1 ? 'GRAB' : 'SHARE'}` 
                                    : 'Choose whether to GRAB or SHARE the prize'}
                            </p>
                        </div>

                        <div className="flex justify-center space-x-12 mb-8">
                            <button 
                                onClick={() => handleMakeChoice(1)} // CHOICE_GRAB = 1
                                disabled={isSubmitting || playerChoice !== null}
                                className={`w-36 h-36 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                                    playerChoice === 1 
                                        ? 'bg-[#f85149] text-white border-4 border-white' 
                                        : playerChoice !== null 
                                            ? 'bg-[#21262d] text-[#8b949e] cursor-not-allowed opacity-70' 
                                            : 'bg-[#f85149] hover:bg-[#ff6a64] text-white'
                                }`}
                            >
                                GRAB
                            </button>
                            
                            <button 
                                onClick={() => handleMakeChoice(2)} // CHOICE_SHARE = 2
                                disabled={isSubmitting || playerChoice !== null}
                                className={`w-36 h-36 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                                    playerChoice === 2 
                                        ? 'bg-[#238636] text-white border-4 border-white' 
                                        : playerChoice !== null 
                                            ? 'bg-[#21262d] text-[#8b949e] cursor-not-allowed opacity-70' 
                                            : 'bg-[#238636] hover:bg-[#2ea043] text-white'
                                }`}
                            >
                                SHARE
                            </button>
                        </div>
                        
                        {playerChoice !== null && (
                            <div className="text-center">
                                <p className="text-white text-lg mb-4">Your choice has been submitted!</p>
                                <p className="text-[#8b949e]">
                                    Wait for the other player to make their choice.
                                </p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mt-4">
                                {error}
                            </div>
                        )}
                    </>
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
}