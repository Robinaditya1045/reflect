"use server";
import prisma from "../prisma";

export const stakeGame = async (
    userId: string,
    gameId: number, // Changed from string to number to match schema
    stakeAmount: number
) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
        });
        
        if (!game) {
            throw new Error('Game not found');
        }
        
        if (game.status !== 'PENDING') {
            throw new Error('Game is not open for staking');
        }
        
        // Create a StakerGame record first
        await prisma.stakerGame.create({
            data: {
                user: { connect: { id: userId } },
                game: { connect: { id: gameId } },
            }
        });
        
        // Then create the stake with proper fields according to schema
        const stake = await prisma.stake.create({
            data: {
                user: { connect: { id: userId } },
                game: { connect: { id: gameId } },
                amount: stakeAmount,
            },
        });
        
        // Update totalPool
        await prisma.game.update({
            where: { id: gameId },
            data: { totalPool: { increment: stakeAmount } }
        });
        
        return stake;
    } catch (error) {
        console.error('Error staking game:', error);
        throw new Error('Failed to stake game');
    }
}

export const getStakesByGameId = async (gameId: number) => { // Changed from string to number
    try {
        const stakes = await prisma.stake.findMany({
            where: { gameId },
            include: {
                user: true,
            },
        });
        
        return stakes;
    } catch (error) {
        console.error('Error fetching stakes:', error);
        throw new Error('Failed to fetch stakes');
    }
}

export const getStakerGamesByUserId = async (userId: string) => {
    try {
        const stakerGames = await prisma.stakerGame.findMany({
            where: { userId },
            include: {
                game: true,
            },
        });
        
        return stakerGames;
    } catch (error) {
        console.error('Error fetching staker games:', error);
        throw new Error('Failed to fetch staker games');
    }
}

export const playerActions = async (
    userId: string,
    gameId: number, // Changed from string to number
    action: PlayerAction // Using the enum type from schema
) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
        });
        
        if (!game) {
            throw new Error('Game not found');
        }
        
        if (game.status !== 'IN_PROGRESS') {
            throw new Error('Game is not in progress');
        }

        // Fixed the update method - Prisma doesn't have findUniqueAndUpdate
        const updatedPlayerGame = await prisma.playerGame.update({
            where: {
                userId_gameId: {
                    userId,
                    gameId,
                }
            },
            data: {
                action,
            },
        });
        
        return updatedPlayerGame;
    } catch (error) {
        console.error('Error performing player action:', error);
        throw new Error('Failed to perform player action');
    }
}

// Add the enum type import at the top of the file
import { PlayerAction } from '@prisma/client';