"use server";
import prisma from "../prisma";
import { GameOutcome } from "@prisma/client";

export const createGame = async (
    name: string,
    ownerId: string,
    joiningAmount: number,
    description?: string
) => {
    try {
        const newGame = await prisma.game.create({
            data: {
                name,
                description,
                ownerId,
                joiningAmount,
                status: 'PENDING',
                totalPool: 0,
            },
        });
        
        return newGame;
    } catch (error) {
        console.error('Error creating game:', error);
        throw new Error('Failed to create game');
    }
}

export const getGameById = async (id: number) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                players: true,
                stakers: true,
                stakes: true,
            },
        });
        
        if (!game) {
            throw new Error('Game not found');
        }
        
        return game;
    } catch (error) {
        console.error('Error fetching game:', error);
        throw new Error('Failed to fetch game');
    }
}

export const getPlayersByGameId = async (gameId: number) => {
    try {
        const players = await prisma.playerGame.findMany({
            where: { gameId },
            include: {
                user: true, // Include user details if needed
            },
        });

        return players;
    } catch (error) {
        console.error('Error fetching players:', error);
        throw new Error('Failed to fetch players');
    }
}

export const getAllGames = async () => {
    try {
        const games = await prisma.game.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                players: true,
                stakers: true,
                stakes: true,
            },
        });
        return games;
    } catch (error) {
        console.error('Error fetching games:', error);
        throw new Error('Failed to fetch games');
    }
}

export const joinAsPlayer = async (
    gameId: number,
    playerId: string,
    joiningAmount: number
) => {
    try {
        // Use a transaction to ensure all operations are atomic
        return await prisma.$transaction(async (tx) => {
            const game = await tx.game.findUnique({
                where: { id: gameId },
                include: {
                    players: true,
                },
            });
            
            if (!game) {
                throw new Error('Game not found');
            }
            
            if (game.status !== 'PENDING') {
                throw new Error('Game is not open for joining');
            }
            
            // Check if player limit reached (2 players max)
            if (game.players.length >= 2) {
                throw new Error('Game already has maximum number of players');
            }
            
            // Check if player has already joined
            const existingPlayer = await tx.playerGame.findFirst({
                where: {
                    gameId,
                    userId: playerId,
                },
            });
            
            if (existingPlayer) {
                throw new Error('You have already joined this game as a player');
            }
            
            // Create player-game relationship
            const player = await tx.playerGame.create({
                data: {
                    gameId,
                    userId: playerId,
                    joiningAmount,
                },
            });
            
            // Update the game's total pool
            await tx.game.update({
                where: { id: gameId },
                data: {
                    totalPool: {
                        increment: joiningAmount,
                    },
                },
            });
            
            return player;
        });
    } catch (error) {
        console.error('Error joining game:', error);
        throw new Error('Failed to join game');
    }
}

export const joinAsStaker = async (
    gameId: number,
    stakerId: string,
    stakeAmount: number
) => {
    try {
        // Use a transaction to ensure all operations are atomic
        return await prisma.$transaction(async (tx) => {
            const game = await tx.game.findUnique({
                where: { id: gameId },
            });
            
            if (!game) {
                throw new Error('Game not found');
            }
            
            if (game.status !== 'PENDING') {
                throw new Error('Game is not open for staking');
            }
            
            // Check if staker has already joined
            const existingStaker = await tx.stakerGame.findFirst({
                where: {
                    gameId,
                    userId: stakerId,
                },
            });
            
            if (existingStaker) {
                throw new Error('You have already joined this game as a staker');
            }
            
            const stakerGame = await tx.stakerGame.create({
                data: {
                    gameId,
                    userId: stakerId,
                },
            });
            
            const stake = await tx.stake.create({
                data: {
                    gameId,
                    userId: stakerId,
                    amount: stakeAmount,
                },
            });
            
            // Update the game's total pool
            await tx.game.update({
                where: { id: gameId },
                data: {
                    totalPool: {
                        increment: stakeAmount,
                    },
                },
            });
            
            return { stakerGame, stake };
        });
    } catch (error) {
        console.error('Error joining as staker:', error);
        throw new Error('Failed to join as staker');
    }
}

export const updateGameStatus = async (gameId: number, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', finalOutcome?: GameOutcome) => {
    try {
        const data: any = { status };
        if (status === 'COMPLETED' && finalOutcome) {
            data.finalOutcome = finalOutcome;
        }
        
        const updatedGame = await prisma.game.update({
            where: { id: gameId },
            data,
        });
        
        return updatedGame;
    } catch (error) {
        console.error('Error updating game status:', error);
        throw new Error('Failed to update game status');
    }
}
