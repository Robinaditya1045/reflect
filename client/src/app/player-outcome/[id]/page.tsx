interface PageProps {
    params: { id: string }
}

export default function Page({ params }: PageProps) {
    return (
        <div>player-outcome {params.id}</div>
    );
}