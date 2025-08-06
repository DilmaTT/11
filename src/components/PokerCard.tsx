import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PokerCardProps {
  hand: string;
  className?: string;
  fixedCards?: Array<{ rank: string, suit: string }>;
}

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

export const PokerCard = ({ hand, className, fixedCards }: PokerCardProps) => {
  const isMobile = useIsMobile();

  // Parse hand like "AA", "AKs", "72o" etc.
  const getCardInfo = (hand: string) => {
    const getRandomSuit = () => SUITS[Math.floor(Math.random() * SUITS.length)];
    const getTwoDifferentRandomSuits = () => {
      let suit1 = getRandomSuit();
      let suit2 = getRandomSuit();
      while (suit1 === suit2) {
        suit2 = getRandomSuit();
      }
      return [suit1, suit2];
    };

    if (hand.length === 2 && hand[0] === hand[1]) {
      // Pocket pairs like AA, KK, etc.
      const [suit1, suit2] = getTwoDifferentRandomSuits();
      return [
        { rank: hand[0], suit: suit1 },
        { rank: hand[1], suit: suit2 }
      ];
    } else if (hand.length === 3) {
      // Suited or offsuit like AKs, AKo
      const suited = hand[2] === 's';
      if (suited) {
        const commonSuit = getRandomSuit();
        return [
          { rank: hand[0], suit: commonSuit },
          { rank: hand[1], suit: commonSuit }
        ];
      } else { // Offsuit
        const [suit1, suit2] = getTwoDifferentRandomSuits();
        return [
          { rank: hand[0], suit: suit1 },
          { rank: hand[1], suit: suit2 }
        ];
      }
    } else if (hand.length === 2) { // Non-paired offsuit like AK, QJ (implicitly offsuit if no 's' or 'o')
      const [suit1, suit2] = getTwoDifferentRandomSuits();
      return [
        { rank: hand[0], suit: suit1 },
        { rank: hand[1], suit: suit2 }
      ];
    }
    // Fallback for invalid hand format
    return [
      { rank: 'A', suit: 'spades' },
      { rank: 'A', suit: 'hearts' }
    ];
  };

  // Use fixedCards if provided, otherwise generate based on the hand string
  const cards = fixedCards || getCardInfo(hand);

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
      default:
        return '♠';
    }
  };

  const getCardColor = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return 'bg-red-700';
      case 'diamonds':
        return 'bg-blue-700';
      case 'clubs':
        return 'bg-green-700';
      case 'spades':
      default:
        return 'bg-gray-800';
    }
  };

  // Display 'T' for Ten. The hand data uses 'T'.
  const formatRank = (rank: string) => {
    return rank;
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            getCardColor(card.suit),
            "text-white rounded-md shadow-lg w-12 h-16 sm:w-16 sm:h-20 relative font-bold flex items-center justify-center"
          )}
        >
          {/* Top-left corner info */}
          <div className="absolute top-[0.15rem] left-1.5 flex flex-col items-center leading-none">
            <span className={cn(
              isMobile ? "text-[13.863px] translate-y-[10%]" : "text-[14.292px] sm:text-[17.86px] translate-y-[20%]"
            )}>{formatRank(card.rank)}</span>
            <span className={cn(
              isMobile ? "text-[11.647px] -mt-1.5 translate-y-[75%]" : "text-[10.719px] sm:text-[13.89px] -mt-1.5 translate-y-[65%]"
            )}>{getSuitSymbol(card.suit)}</span>
          </div>
          
          {/* Central large rank */}
          <div className="text-4xl sm:text-5xl translate-x-[15%] translate-y-[20%]">
            {formatRank(card.rank)}
          </div>
        </div>
      ))}
    </div>
  );
};
