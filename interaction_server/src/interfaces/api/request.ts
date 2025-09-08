import type { ObjectId } from "mongooat";
import type { STAGE_STATUS } from "../../constants.js";

export interface IOffsetPagination {
    page?: number;
    limit?: number;
}

export interface ITimeBasedPagination {
    from?: Date;
    limit?: number;
}

// Stage
export namespace IReqStage {
    export interface GetAllQuery {
        page?: string;
        limit?: string;

        searchTerm?: string;
        status?: STAGE_STATUS[];
    }

    export interface Filter {
        searchTerm?: string;
        status?: STAGE_STATUS[];
    }

    export interface Insert {
        title: string;
        hostId: string | ObjectId;
        serverHost: string;
    }
}
