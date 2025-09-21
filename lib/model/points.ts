import { PointsType } from "../enum/points-type";
import { ClassModel } from "./class-model";
import { Game } from "./game";
import { Player } from "./player";
import { Season } from "./season";
import { Tournament } from "./tournament";

export interface Points extends ClassModel {
    player: Player;
    game: Game;
    value: number;
    pointsType: PointsType; /*Dan, Rate, Season*/
    season: Season;
    tournament: Tournament | undefined;
}