import GamesList from "@/components/GamesList";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Available Games</h1>
          <p className="text-gray-400">Join as a player or stake on outcomes</p>
        </div>
        
        <Link
          href="/create_games"
          className="mt-4 sm:mt-0 py-2 px-6 bg-[#1f6feb] hover:bg-[#388bfd] text-white font-medium rounded-md transition duration-200 ease-in-out flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path>
          </svg>
          Create New Game
        </Link>
      </div>
      
      <GamesList />
    </div>
  );
}
