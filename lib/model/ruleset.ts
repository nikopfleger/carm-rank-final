import { GameType } from "../enum/game-type";
import { ClassModel } from "./class-model";
import { Season } from "./season";
import { Uma } from "./uma";

export interface Ruleset extends ClassModel {
    name: string;
    sanma: Boolean;
    uma: Uma;
    oka: number;
    chonbo: number;
    gameType: GameType;
    inPoints: number;
    outPoints: number;
    seasonList: Array<Season>;
}