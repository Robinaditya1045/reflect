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
        // Your existing handleStake implementation
        // ...
    };

    const renderOption = (
        option: number, 
        count: number, 
        title: string, 
        description: string
    ) => (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => handleDecrement(option)}
                        disabled={count <= 0}
                    >
                        -
                    </Button>
                    <span className="text-xl font-bold">{count}</span>
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
        <div className="container mx-auto p-4 bg-gray-950 text-gray-100 rounded-md shadow-md border border-gray-800">
            <h1 className="text-2xl font-bold mb-6 text-white">Stake on Match {params.id}</h1>
            
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
            
            <Card className="mt-6 bg-gray-900 border-gray-700 text-gray-100">
            <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                <span>Cost per stake:</span>
                <span>{costPerStake} ETH</span>
                </div>
                <div className="flex justify-between font-bold text-white">
                <span>Total cost:</span>
                <span>{totalCost} ETH</span>
                </div>
            </CardContent>
            </Card>
            
            {error && <p className="text-red-400 mt-4">{error}</p>}
            
            <Button 
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
            size="lg"
            onClick={handleStake}
            disabled={isSubmitting || totalCost <= 0}
            >
            {isSubmitting ? "Processing..." : `Stake ${totalCost} ETH`}
            </Button>
        </div>
    );
}
