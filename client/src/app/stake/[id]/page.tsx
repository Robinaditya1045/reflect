"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import TopGAddress from "@contract_data/TopG-address.json";
import TopGAbi from "@contract_data/TopG.json";
import { getPlayersByGameId } from "@/lib/actions/game.actions";
import { getUserByWalletAddress } from "@/lib/actions/user.actions";
import { ConnectModal } from "@/components/ui/ConnectModal";

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
    const [option1Count, setOption1Count] = useState(0);
    const [option2Count, setOption2Count] = useState(0);
    const [option3Count, setOption3Count] = useState(0);
    const [option4Count, setOption4Count] = useState(0);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);

    const costPerStake = 0.01; // ETH
    const totalCost = (option1Count + option2Count + option3Count + option4Count) * costPerStake;

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
                
                // Call the server action directly
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

    // Get player names with fallbacks
    const player1Name = players[0]?.user?.username || "Player 1";
    const player2Name = players[1]?.user?.username || "Player 2";

    // Rest of your existing functions
    const handleIncrement = (option: number) => {
        switch(option) {
            case 1: setOption1Count(prev => prev + 1); break;
            case 2: setOption2Count(prev => prev + 1); break;
            case 3: setOption3Count(prev => prev + 1); break;
            case 4: setOption4Count(prev => prev + 1); break;
        }
    };

    const handleDecrement = (option: number) => {
        switch(option) {
            case 1: setOption1Count(prev => Math.max(0, prev - 1)); break;
            case 2: setOption2Count(prev => Math.max(0, prev - 1)); break;
            case 3: setOption3Count(prev => Math.max(0, prev - 1)); break;
            case 4: setOption4Count(prev => Math.max(0, prev - 1)); break;
        }
    };

    const handleStake = async () => {
        if (totalCost <= 0) {
            setError("You must select at least one option");
            return;
        }
        
        // Check if wallet is connected
        if (!walletAddress || !isOnboarded) {
            setIsModalOpen(true);
            return;
        }
        
        setIsSubmitting(true);
        setError("");
        
        try {
            // Get user from wallet address
            const user = await getUserByWalletAddress(walletAddress);
            
            // Create a stake distribution object
            const stakeDistribution = {
                gameId: parseInt(params.id),
                userId: user.id,
                options: {
                    GRAB_GRAB: option1Count,
                    GRAB_SHARE: option2Count,
                    SHARE_GRAB: option3Count,
                    SHARE_SHARE: option4Count
                },
                totalAmount: totalCost
            };
            
            // Connect to wallet using provider
            // @ts-ignore - BrowserProvider exists in ethers v6
            // Convert ETH to Wei
            const amountInWei = ethers.utils.parseEther(totalCost.toString());
            
            let totalSum = option1Count + option2Count + option3Count + option4Count;

            const totalSuminWei = ethers.utils.parseEther(totalSum.toString());
            // Call contract stake function
            const tx = await TopG.bet(option1Count, option2Count, option3Count, option4Count, {
                value: totalSum
            });
            
            // Wait for transaction to be mined
            await tx.wait();
            
            // Reset form after successful stake
            setOption1Count(0);
            setOption2Count(0);
            setOption3Count(0);
            setOption4Count(0);
            
            // Notify success
            alert("Stake placed successfully!");
            
        } catch (err: any) {
            console.error("Error staking:", err);
            setError(err.message || "Failed to place stake");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleConnectSuccess = (address: string, username: string | null, onboarded: boolean) => {
        setWalletAddress(address);
        setIsOnboarded(onboarded);
        
        if (onboarded) {
            handleStake();
        }
    };
    
    const renderOption = (
        option: number, 
        count: number, 
        title: string, 
        description: string
    ) => (
        <Card className="mb-4 bg-gray-900">
            <CardHeader>
                <CardTitle className="text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-white mb-4">{description}</p>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => handleDecrement(option)}
                        disabled={count <= 0}
                    >
                        -
                    </Button>
                    <span className="text-xl font-bold text-white">{count}</span>
                    <Button 
                        variant="outline"
                        onClick={() => handleIncrement(option)}
                    >
                        +
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return <div className="container mx-auto p-4">Loading player data...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Stake on Match {params.id}</h1>
            
            {renderOption(
                1, 
                option1Count, 
                `Option 1: ${player1Name} Grab, ${player2Name} Grab`, 
                `Both players choose to grab the prize`
            )}
            
            {renderOption(
                2, 
                option2Count, 
                `Option 2: ${player1Name} Grab, ${player2Name} Share`, 
                `${player1Name} grabs while ${player2Name} shares`
            )}
            
            {renderOption(
                3, 
                option3Count, 
                `Option 3: ${player1Name} Share, ${player2Name} Grab`, 
                `${player1Name} shares while ${player2Name} grabs`
            )}
            
            {renderOption(
                4, 
                option4Count, 
                `Option 4: ${player1Name} Share, ${player2Name} Share`, 
                `Both players choose to share the prize`
            )}
            
            <Card className="mt-6">
                <CardContent className="pt-6">
                    <div className="flex justify-between mb-4">
                        <span>Cost per stake:</span>
                        <span>{costPerStake} ETH</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total cost:</span>
                        <span>{totalCost} ETH</span>
                    </div>
                </CardContent>
            </Card>
            
            {error && <p className="text-destructive mt-4">{error}</p>}
            
            <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handleStake}
                disabled={isSubmitting || totalCost <= 0}
            >
                {isSubmitting ? "Processing..." : `Stake ${totalCost} ETH`}
            </Button>
            
            {/* Connect Modal */}
            <ConnectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onConnect={handleConnectSuccess} 
            />
        </div>
    );
}
