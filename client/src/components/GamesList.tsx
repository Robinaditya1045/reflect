"use client";

import React, { useEffect, useState } from 'react';
import GameCard from '@/components/GameCard';
import { getAllGames } from '@/lib/actions/game.actions';

interface Game {
  id: number;
  name: string;
  description: string | null;
  joiningAmount: number;
  status: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  players: Array<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    joiningAmount: number;
    userId: string;
    gameId: number;
    action: string;
  }>;
  stakers: Array<{
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    gameId: number;
  }>;
  stakes: any[];
  totalPool?: number;
}

type SortOption = 'newest' | 'oldest' | 'players' | 'stakers' | 'amount';

export default function GamesList() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const allGames = await getAllGames();
        setGames(allGames);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching games:', err);
        setError(err.message || 'Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    let result = [...games];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(game => game.status === statusFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'players':
        result.sort((a, b) => b.players.length - a.players.length);
        break;
      case 'stakers':
        result.sort((a, b) => b.stakers.length - a.stakers.length);
        break;
      case 'amount':
        result.sort((a, b) => b.joiningAmount - a.joiningAmount);
        break;
    }
    
    setFilteredGames(result);
  }, [games, sortBy, statusFilter]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-[#1f6feb] rounded-full"></div>
          <div className="h-3 w-3 bg-[#1f6feb] rounded-full"></div>
          <div className="h-3 w-3 bg-[#1f6feb] rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-[#301f21] border border-[#f85149] text-[#f85149] p-4 rounded-md">
        <p>Failed to load games: {error}</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="w-full bg-[#0d1117] border border-[#30363d] text-[#8b949e] p-6 rounded-md text-center">
        <h3 className="text-xl font-semibold text-white mb-2">No Games Found</h3>
        <p>Be the first to create a game!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm">
          <span className="text-[#8b949e] mr-2">Sort by:</span>
          <select 
            className="bg-[#0d1117] text-white border-none outline-none" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="players">Most Players</option>
            <option value="stakers">Most Stakers</option>
            <option value="amount">Highest Amount</option>
          </select>
        </div>
        
        <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm">
          <span className="text-[#8b949e] mr-2">Status:</span>
          <select 
            className="bg-[#0d1117] text-white border-none outline-none" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string | 'all')}
          >
            <option value="all">All</option>
            <option value="PENDING">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        
        <div className="ml-auto text-sm text-[#8b949e]">
          Showing {filteredGames.length} of {games.length} games
        </div>
      </div>
      
      {filteredGames.length === 0 ? (
        <div className="w-full bg-[#0d1117] border border-[#30363d] text-[#8b949e] p-6 rounded-md text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No matching games</h3>
          <p>Try changing your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            // Calculate total pool from joining amounts and stakes if not provided
            const totalPool = game.totalPool ?? (
              game.players.reduce((sum, player) => sum + player.joiningAmount, 0) +
              game.stakes.reduce((sum, stake) => sum + (stake.amount || 0), 0)
            );
            
            return (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                playerCount={game.players.length}
                stakerCount={game.stakers.length}
                joiningAmount={game.joiningAmount}
                isPlayersFull={game.players.length >= 2}
                totalPool={totalPool}
                status={game.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
