"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormField, FormMessage } from '@/components/ui/Form';
import { createGame } from '@/lib/actions/game.actions';
import { getUserByWalletAddress } from '@/lib/actions/user.actions';
import { ConnectModal } from '@/components/ui/ConnectModal';

const CreateGamePage = () => {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    joiningAmount: '',
  });

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && localStorage.getItem('walletConnected') === 'true') {
            setWalletAddress(accounts[0]);
            
            // Get stored user data
            const storedUsername = localStorage.getItem('username');
            const storedOnboarded = localStorage.getItem('isOnboarded') === 'true';
            
            if (storedUsername) setUsername(storedUsername);
            setIsOnboarded(storedOnboarded);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          handleDisconnect();
        } else {
          // Account changed
          setWalletAddress(accounts[0]);
          // Clear user data on account change to force re-login
          setUsername(null);
          setIsOnboarded(false);
          localStorage.removeItem('username');
          localStorage.removeItem('isOnboarded');
          setIsModalOpen(true);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  const handleConnectClick = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  const handleConnect = (address: string, name: string | null, onboarded: boolean) => {
    setWalletAddress(address);
    setUsername(name);
    setIsOnboarded(onboarded);
    
    // Store in localStorage for persistence
    localStorage.setItem('walletConnected', 'true');
    if (name) localStorage.setItem('username', name);
    localStorage.setItem('isOnboarded', onboarded.toString());
  };
  
  const handleDisconnect = () => {
    setWalletAddress(null);
    setUsername(null);
    setIsOnboarded(false);
    
    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('username');
    localStorage.removeItem('isOnboarded');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Please connect your wallet to create a game');
      return;
    }

    if (!isOnboarded) {
      setError('Please complete your profile setup to create a game');
      return;
    }
    
    if (!formData.name) {
      setError('Game name is required');
      return;
    }

    if (!formData.joiningAmount || parseFloat(formData.joiningAmount) <= 0) {
      setError('Joining amount must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      try {
        // First get the user by wallet address to get the user ID
        const user = await getUserByWalletAddress(walletAddress);
        
        // Now create the game with the user's ID as owner
        const newGame = await createGame(
          formData.name,
          user.id, // Using the user ID as the owner ID, not the wallet address
          parseFloat(formData.joiningAmount),
          formData.description || undefined
        );
        
        console.log('Game created:', newGame);
        
        // Redirect to the new game page
        router.push(`/game/${newGame.id}`);
      } catch (userError: any) {
        console.error('Error with user:', userError);
        
        if (userError.message?.includes('User not found')) {
          setError('Your profile could not be found. Please try reconnecting your wallet.');
        } else {
          throw userError; // Re-throw to be caught by the outer catch
        }
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
          <div className="h-4 w-4 rounded-full bg-[#238636] mr-2"></div>
          Create New Game
        </h1>
        
        {error && (
          <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {!walletAddress ? (
          <div className="text-center p-8">
            <p className="text-[#8b949e] mb-4">Please connect your wallet to create a game.</p>
            <Button
              onClick={handleConnectClick}
              variant="success"
            >
              Connect Wallet
            </Button>
          </div>
        ) : !isOnboarded ? (
          <div className="text-center p-8">
            <p className="text-[#8b949e] mb-4">Please complete your profile setup to create a game.</p>
            <Button
              onClick={handleConnectClick}
              variant="success"
            >
              Complete Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField>
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter game name"
                disabled={isSubmitting}
              />
            </FormField>
            
            <FormField>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter game description"
                disabled={isSubmitting}
              />
            </FormField>
            
            <FormField>
              <Label htmlFor="joiningAmount">Joining Amount (ETH)</Label>
              <Input
                id="joiningAmount"
                name="joiningAmount"
                type="number"
                step="0.001"
                min="0"
                value={formData.joiningAmount}
                onChange={handleChange}
                placeholder="0.05"
                disabled={isSubmitting}
              />
              <FormMessage>
                This is the amount players will need to pay to join the game.
              </FormMessage>
            </FormField>
            
            <div className="flex space-x-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="success"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Game'}
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-[#8b949e]">
              Connected wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
              {username && ` | Username: ${username}`}
              <button
                onClick={handleDisconnect}
                className="ml-3 text-[#f85149] hover:text-[#ff7b72]"
                type="button"
              >
                Disconnect
              </button>
            </div>
          </form>
        )}
      </div>
      
      <ConnectModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default CreateGamePage;