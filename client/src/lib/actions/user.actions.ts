"use server";
import prisma from "../prisma";

export const createUser = async (walletAddress: string) => {
    console.log('Creating user with wallet address:', walletAddress);
    
    if (!walletAddress) {
        console.error('No wallet address provided');
        throw new Error('Wallet address is required');
    }
    
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { walletAddress },
        });
        
        if (existingUser) {
            console.log('User already exists:', existingUser);
            return existingUser;
        }
        
        // Create new user
        console.log('Creating new user entry...');
        const user = await prisma.user.create({
            data: {
                walletAddress,
            },
        });
        
        console.log('User created successfully:', user);
        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
    }
}

export const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                ownedGames: true,
                playerGames: true,
                stakerGames: true,
            },
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
    }
}

export const getAllUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                ownedGames: true,
                playerGames: true,
                stakerGames: true,
            },
        });
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }
}

export const onboardUser = async (walletAddress: string, username: string) => {
    console.log('Onboarding user:', { walletAddress, username });
    
    if (!walletAddress || !username) {
        console.error('Missing required fields:', { walletAddress, username });
        throw new Error('Wallet address and username are required');
    }
    
    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { walletAddress },
        });
        
        if (!existingUser) {
            console.error('User not found for onboarding:', walletAddress);
            throw new Error('User not found');
        }
        
        // Update user
        const user = await prisma.user.update({
            where: { walletAddress },
            data: { 
                isonboarded: true, 
                username 
            },
        });
        
        console.log('User onboarded successfully:', user);
        return user;
    } catch (error) {
        console.error('Error onboarding user:', error);
        throw new Error('Failed to onboard user');
    }
}

export const getUserByWalletAddress = async (walletAddress: string) => {
    console.log('Getting user by wallet address:', walletAddress);
    
    if (!walletAddress) {
        console.error('No wallet address provided');
        throw new Error('Wallet address is required');
    }
    
    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                ownedGames: true,
                playerGames: true,
                stakerGames: true,
            },
        });
        
        if (!user) {
            console.error('User not found for wallet address:', walletAddress);
            throw new Error('User not found');
        }
        
        console.log('User found:', user);
        return user;
    } catch (error) {
        console.error('Error fetching user by wallet address:', error);
        throw new Error('Failed to fetch user by wallet address');
    }
}
