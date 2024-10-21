import { useState, useEffect, useCallback, useRef } from "react";
import { Gem, Bomb, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TOTAL_TILES = 20;

type TileState = "empty" | "mine" | "revealed-safe" | "revealed-mine";

interface CustomAudioContext extends AudioContext {
  webkitAudioContext?: typeof AudioContext;
}

export default function MineGame() {
  const [mines, setMines] = useState(3);
  const [gameBoard, setGameBoard] = useState<TileState[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    resetGame();
    // @ts-ignore
    const AudioContextClass = (window.AudioContext ||
      (window as any).webkitAudioContext) as CustomAudioContext;
    //@ts-ignore
    audioContextRef.current = new AudioContextClass();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mines]);

  const resetGame = () => {
    const newBoard: TileState[] = Array(TOTAL_TILES).fill("empty");
    const minePositions: number[] = [];
    while (minePositions.length < mines) {
      const position = Math.floor(Math.random() * TOTAL_TILES);
      if (!minePositions.includes(position)) {
        minePositions.push(position);
        newBoard[position] = "mine";
      }
    }
    setGameBoard(newBoard);
    setIsGameOver(false);
    setShowGameOver(false);
  };

  const playSound = useCallback(
    (type: "diamond" | "gameOver") => {
      if (isMuted || !audioContextRef.current) return;

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      switch (type) {
        case "diamond":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(660, context.currentTime);
          gainNode.gain.setValueAtTime(0.1, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            context.currentTime + 0.3
          );
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
          break;
        case "gameOver":
          oscillator.type = "square";
          oscillator.frequency.setValueAtTime(220, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            55,
            context.currentTime + 1
          );
          gainNode.gain.setValueAtTime(0.2, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            context.currentTime + 1
          );
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 1);
          break;
      }
    },
    [isMuted]
  );

  const handleTileClick = (index: number) => {
    if (
      isGameOver ||
      gameBoard[index] === "revealed-safe" ||
      gameBoard[index] === "revealed-mine"
    )
      return;

    const newBoard = [...gameBoard];
    if (newBoard[index] === "mine") {
      newBoard[index] = "revealed-mine";
      setIsGameOver(true);
      setShowGameOver(true);
      setTimeout(() => playSound("gameOver"), 500);
      // Reveal all tiles when game is over
      newBoard.forEach((tile, i) => {
        if (tile === "mine") newBoard[i] = "revealed-mine";
        else if (tile === "empty") newBoard[i] = "revealed-safe";
      });
    } else {
      newBoard[index] = "revealed-safe";
      playSound("diamond");
    }
    setGameBoard(newBoard);
  };

  const getTileColor = (tile: TileState) => {
    switch (tile) {
      case "revealed-mine":
        return "bg-red-500";
      case "revealed-safe":
        return "bg-green-500";
      default:
        return "bg-gray-700 hover:bg-gray-600";
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-8">
      <Card className="w-full max-w-7xl border border-gray-800 bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl text-center font-bold mb-4 text-white">
              Mine Game
            </h2>
            <div className="flex justify-center space-x-2 mb-4">
              <Button
                variant="outline"
                className={`w-24 ${
                  mines === 3
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => setMines(3)}
              >
                3 Mines
              </Button>
              <Button
                variant="outline"
                className={`w-24 ${
                  mines === 5
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => setMines(5)}
              >
                5 Mines
              </Button>
              <Button
                variant="outline"
                className={`w-24 ${
                  mines === 10
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => setMines(10)}
              >
                10 Mines
              </Button>
            </div>

            <div className="flex max-md:flex-col gap-3">
              <Button
                onClick={resetGame}
                className="w-full bg-green-600 hover:bg-green-700 py-3"
              >
                New Game
              </Button>
              <Button
                onClick={toggleMute}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
              >
                {isMuted ? (
                  <VolumeX className="mr-2" />
                ) : (
                  <Volume2 className="mr-2" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {gameBoard.map((tile, index) => (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                className={`w-full aspect-square rounded-md flex items-center justify-center ${getTileColor(
                  tile
                )}`}
                disabled={
                  isGameOver ||
                  tile === "revealed-safe" ||
                  tile === "revealed-mine"
                }
              >
                {(tile === "revealed-safe" || tile === "revealed-mine") &&
                  (tile === "revealed-mine" ? (
                    <Bomb className="w-10 h-10 text-white" />
                  ) : (
                    <Gem className="w-11 h-11 text-white" />
                  ))}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={showGameOver} onOpenChange={setShowGameOver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500 text-xl">
              Game Over!
            </DialogTitle>
          </DialogHeader>
          <p>You hit a mine. Better luck next time!</p>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={resetGame}
          >
            Play Again
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
