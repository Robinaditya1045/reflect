'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';



interface PageProps {
    params: { id: string }
}

export default function Page({ params }: PageProps) {
    const [userRole, setUserRole] = useState<'player' | 'staker' | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Replace with your actual user role determination logic
        const mockRole = Math.random() > 0.5 ? 'player' : 'staker';
        setUserRole(mockRole);
    }, []);

    const handleButtonClick = () => {
        if (userRole === 'player') {
            router.push(`/player-outcome/${params.id}`);
        } else if (userRole === 'staker') {
            router.push(`/stake/${params.id}`);
        }
    };

    return (
        <div>
            <div>game {params.id}</div>
            
            {userRole && (
                <button 
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    onClick={handleButtonClick}
                >
                    {userRole === 'player' ? 'Select Option' : 'Stake'}
                </button>
            )}
        </div>
    );
}