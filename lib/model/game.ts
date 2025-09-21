import { ClassModel } from "./class-model";
import { Ruleset } from "./ruleset";
import { Season } from "./season";
import { Tournament } from "./tournament";

export interface Game extends ClassModel {
    date: Date;
    location: Location;
    ruleset: Ruleset;
    season: Season | undefined; /*separados season y ruleset xq puede ser un juego casual que no rankea*/
    tournament: Tournament | undefined; /*puede ser juego de torneo o no*/
}