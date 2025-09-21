import { ClassModel } from "./class-model";
import { Game } from "./game";
import { Player } from "./player";

export interface GameResult extends ClassModel {
    score: number | undefined; /*Si no le pasamos el score ya tiene que venir, si le pasamos que calcule el score final de acuerdo al uma y oka del game*/
    finalScore: number;
    chonbo: number; /* cantidad */
    finalPosition: number | undefined;
    game: Game;
    player: Player;
}