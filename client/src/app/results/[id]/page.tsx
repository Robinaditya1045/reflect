interface PageProps {
    params: { id: string }
}

export default function Page({ params }: PageProps) {
    return (
        <div>results {params.id}</div>
    );
}