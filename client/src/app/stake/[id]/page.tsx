interface PageProps {
    params: { id: string }
}

export default function Page({ params }: PageProps) {
    return (
        <div>stake {params.id}</div>
    );
}