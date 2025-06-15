import {Injectable} from '@nestjs/common';
import {WeightTypeEnum} from "../../lib/weight-type.enum";
import {ForceTypeEnum} from "../../lib/force-type.enum";
import {ExerciseCategoryEnum} from "../../lib/exercise-category.enum";
import {ExperienceEnum} from "../../lib/experience.enum";

@Injectable()
export class FiltersService {
    constructor() {
    }

    async getFilters() {
        return {
            weightTypes: Object.values(WeightTypeEnum),
            forceTypes: Object.values(ForceTypeEnum),
            categories: Object.values(ExerciseCategoryEnum),
            experiences: Object.values(ExperienceEnum),
        }
    }
}
